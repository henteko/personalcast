import { NextRequest, NextResponse } from 'next/server';
import { GenerationStatus, JobResponse } from '@/lib/types/api';
import { jobManager } from '@/lib/storage/JobManager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = jobManager.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const response: JobResponse = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      scriptAvailable: job.status >= GenerationStatus.SCRIPT_READY,
      estimatedTimeRemaining: job.status === GenerationStatus.COMPLETED ? 0 : 
        Math.max(0, job.estimatedTime - (job.progress / 100 * job.estimatedTime))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}