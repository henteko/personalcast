import { NextRequest, NextResponse } from 'next/server';
import { GenerationStatus, ResultResponse } from '@/lib/types/api';
import { jobManager } from '@/lib/storage/JobManager';
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter';

const outputStorage = new LocalStorageAdapter(process.env.LOCAL_OUTPUT_DIR || './output');

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

    // Get audio URL
    const audioUrl = await outputStorage.getUrl(job.audioPath);
    
    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const response: ResultResponse = {
      jobId: job.id,
      status: job.status,
      audioUrl: audioUrl,
      script: job.script,
      duration: job.options.duration * 60, // Convert minutes to seconds
      expiresAt: expiresAt.toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}