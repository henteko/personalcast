import { NextRequest, NextResponse } from 'next/server';
import { GenerationStatus, ScriptResponse } from '@/lib/types/api';
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

    if (!job.script || job.status < GenerationStatus.SCRIPT_READY) {
      return NextResponse.json(
        { error: 'Script not available yet' },
        { status: 400 }
      );
    }

    const response: ScriptResponse = {
      jobId: job.id,
      status: job.status,
      script: job.script
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get script error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}