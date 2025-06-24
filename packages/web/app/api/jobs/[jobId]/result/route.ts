import { NextRequest, NextResponse } from 'next/server';
import { GenerationStatus, ResultResponse } from '@/lib/types/api';
import { jobManager } from '@/lib/storage/JobManager';
import { getConvexClient } from '@/lib/convex/client';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // Try Convex first
    try {
      const client = getConvexClient();
      const convexJob = await client.query(api.jobs.getJob, { 
        jobId: jobId as Id<"jobs"> 
      });
      
      if (convexJob && convexJob.status === 'completed' && convexJob.audioUrl) {
        // Return Convex-based result
        const response: ResultResponse = {
          jobId: convexJob._id,
          status: GenerationStatus.COMPLETED,
          audioUrl: convexJob.audioUrl,
          script: convexJob.scriptData || { sections: [], title: '', summary: '' },
          duration: 600, // Default 10 minutes
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        return NextResponse.json(response);
      }
    } catch (convexError) {
      console.log('Falling back to local job manager');
    }
    
    // Fall back to local job manager
    const job = jobManager.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== GenerationStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Job not completed yet' },
        { status: 400 }
      );
    }

    if (!job.audioPath || !job.script) {
      return NextResponse.json(
        { error: 'Result data not available' },
        { status: 500 }
      );
    }

    // This endpoint should not be reached when using Convex
    // Return error since we should be using Convex storage
    return NextResponse.json(
      { error: 'This endpoint is deprecated. Audio files are now served through Convex.' },
      { status: 410 }
    );
  } catch (error) {
    console.error('Get result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}