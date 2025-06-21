import { GenerationStatus, ScriptData } from '../types/api';
import { v4 as uuidv4 } from 'uuid';

export interface Job {
  id: string;
  status: GenerationStatus;
  activityLog: string;
  options: any;
  script?: ScriptData;
  audioPath?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime: number;
  progress: number;
  message: string;
  scriptAvailable?: boolean;
}

// Simple in-memory job storage for development
// In production, this would be replaced with a database or Redis
class JobManager {
  private jobs: Map<string, Job> = new Map();

  createJob(activityLog: string, options: any): Job {
    const job: Job = {
      id: uuidv4(),
      status: GenerationStatus.QUEUED,
      activityLog,
      options,
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedTime: 60,
      progress: 0,
      message: 'ジョブがキューに追加されました'
    };

    this.jobs.set(job.id, job);
    return job;
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  updateJob(jobId: string, updates: Partial<Job>): Job | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    };

    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }

  deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  // Clean up old jobs (older than 24 hours)
  cleanup(): void {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [id, job] of this.jobs.entries()) {
      if (job.createdAt < dayAgo) {
        this.jobs.delete(id);
      }
    }
  }
}

// Export singleton instance
export const jobManager = new JobManager();