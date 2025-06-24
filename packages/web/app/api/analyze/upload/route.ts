import { NextRequest, NextResponse } from 'next/server';
import { GenerationStatus, JobResponse } from '@/lib/types/api';
import { jobManager } from '@/lib/storage/JobManager';
import { createConvexJob } from '@/lib/convex/client';
import { ConvexStorageAdapter } from '@/lib/storage/ConvexStorageAdapter';
import type { Id } from '@/convex/_generated/dataModel';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('activityLog') as File;
    const optionsString = formData.get('options') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'activityLog file is required' },
        { status: 400 }
      );
    }

    if (!optionsString) {
      return NextResponse.json(
        { error: 'options is required' },
        { status: 400 }
      );
    }

    // Parse options
    let options;
    try {
      options = JSON.parse(optionsString);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid options format' },
        { status: 400 }
      );
    }

    // Validate file
    if (file.size > 1024 * 1024) { // 1MB limit
      return NextResponse.json(
        { error: 'File size must be less than 1MB' },
        { status: 400 }
      );
    }

    const allowedTypes = ['text/plain', 'text/markdown', 'application/json', 'text/csv'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type must be txt, md, json, or csv' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Create job in Convex
    const convexJobId = await createConvexJob(content, new Date().toISOString());
    
    // Create local job for compatibility
    const job = jobManager.createJob(content, options);
    
    // Store mapping between local and Convex job IDs
    (global as any).jobIdMapping = (global as any).jobIdMapping || {};
    (global as any).jobIdMapping[job.id] = convexJobId;
    
    // Upload file to Convex storage if CONVEX_URL is set
    if (process.env.NEXT_PUBLIC_CONVEX_URL) {
      try {
        const convexStorage = new ConvexStorageAdapter(process.env.NEXT_PUBLIC_CONVEX_URL);
        const fileBuffer = await file.arrayBuffer();
        const fileData = Buffer.from(fileBuffer).toString('base64');
        
        await convexStorage.uploadFile(
          convexJobId,
          fileData,
          file.name,
          file.type
        );
      } catch (uploadError) {
        console.error('Convex file upload failed:', uploadError);
        // Continue with local processing
      }
    }

    // Import the processing function
    const { processJob } = await import('../route');
    
    // Start processing asynchronously
    processJob(job.id, convexJobId).catch(async error => {
      console.error('Job processing error:', error);
      jobManager.updateJob(job.id, {
        status: GenerationStatus.FAILED,
        error: error.message
      });
    });

    // Return job response with Convex ID
    const response: JobResponse = {
      jobId: convexJobId as string,
      status: job.status,
      estimatedTime: job.estimatedTime
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Upload analyze API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}