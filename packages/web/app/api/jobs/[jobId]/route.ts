import { NextRequest, NextResponse } from 'next/server';
import { GenerationStatus, JobResponse } from '@/lib/types/api';
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
    
    // Try to get job from Convex first
    try {
      const client = getConvexClient();
      const convexJob = await client.query(api.jobs.getJob, { 
        jobId: jobId as Id<"jobs"> 
      });
      
      if (convexJob) {
        // Map Convex job to API response format
        const response: JobResponse = {
          jobId: convexJob._id,
          status: mapConvexStatus(convexJob.status),
          progress: convexJob.progress,
          message: convexJob.progressMessage,
          scriptAvailable: ['script_ready', 'synthesizing_voice', 'mixing_audio', 'completed'].includes(convexJob.status),
          estimatedTimeRemaining: convexJob.status === 'completed' ? 0 : 30
        };
        
        return NextResponse.json(response);
      }
    } catch (convexError) {
      // Fall back to local job manager
      console.log('Convex query failed, falling back to local job manager');
    }
    
    // Fall back to local job manager for backward compatibility
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

// Map Convex status to API status
function mapConvexStatus(status: string): GenerationStatus {
  const statusMap: Record<string, GenerationStatus> = {
    'queued': GenerationStatus.QUEUED,
    'parsing': GenerationStatus.PARSING,
    'analyzing_memo': GenerationStatus.ANALYZING_MEMO,
    'generating_script': GenerationStatus.GENERATING_SCRIPT,
    'script_ready': GenerationStatus.SCRIPT_READY,
    'synthesizing_voice': GenerationStatus.SYNTHESIZING_VOICE,
    'mixing_audio': GenerationStatus.MIXING_AUDIO,
    'completed': GenerationStatus.COMPLETED,
    'failed': GenerationStatus.FAILED,
  };
  
  return statusMap[status] || GenerationStatus.QUEUED;
}