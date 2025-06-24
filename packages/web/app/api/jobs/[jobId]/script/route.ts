import { NextRequest, NextResponse } from 'next/server';
import { GenerationStatus, ScriptResponse } from '@/lib/types/api';
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
      
      if (convexJob && convexJob.scriptData) {
        // Map Convex status to GenerationStatus
        const statusMap: Record<string, GenerationStatus> = {
          'script_ready': GenerationStatus.SCRIPT_READY,
          'synthesizing_voice': GenerationStatus.SYNTHESIZING_VOICE,
          'mixing_audio': GenerationStatus.MIXING_AUDIO,
          'completed': GenerationStatus.COMPLETED,
        };
        
        const mappedStatus = statusMap[convexJob.status] || GenerationStatus.GENERATING_SCRIPT;
        
        const response: ScriptResponse = {
          jobId: convexJob._id,
          status: mappedStatus,
          script: {
            title: convexJob.scriptData.title,
            sections: convexJob.scriptData.sections,
            summary: convexJob.scriptData.summary || ''
          }
        };
        
        return NextResponse.json(response);
      }
    } catch (convexError) {
      console.log('Convex query failed, falling back to local job manager');
    }
    
    // Fall back to local job manager
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