import { NextRequest, NextResponse } from 'next/server';
import { GenerationStatus, JobResponse } from '@/lib/types/api';
import { jobManager } from '@/lib/storage/JobManager';

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

    // Create job with file content
    const job = jobManager.createJob(content, options);

    // Import the processing function
    const { processJob } = await import('../route');
    
    // Start processing asynchronously
    processJob(job.id).catch(error => {
      console.error('Job processing error:', error);
      jobManager.updateJob(job.id, {
        status: GenerationStatus.FAILED,
        error: error.message
      });
    });

    // Return job response
    const response: JobResponse = {
      jobId: job.id,
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