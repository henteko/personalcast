'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { JOB_STATUS, STATUS_ORDER, STATUS_LABELS, JobStatus } from '@/lib/constants/jobStatus';

interface ConvexProgressDisplayProps {
  jobId: Id<"jobs">;
}

export function ConvexProgressDisplay({ jobId }: ConvexProgressDisplayProps) {
  // Convexが自動的にリアルタイム更新を処理
  const job = useQuery(api.jobs.getJob, { jobId });
  
  if (!job) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-semibold text-text-primary mb-8 text-center">生成プロセス</h2>
      
      <div className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-3">
            <span className="text-base font-medium text-text-primary">
              {STATUS_LABELS[job.status as JobStatus] || job.status}
            </span>
            <span className="text-base font-semibold text-primary-blue">{job.progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-blue to-primary-light-blue h-4 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${job.progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {job.progressMessage && (
          <p className="text-base text-text-secondary text-center bg-blue-50 rounded-lg py-3 px-4">{job.progressMessage}</p>
        )}

        {/* Error Message */}
        {job.status === 'failed' && job.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">エラー: {job.error.message}</p>
            </div>
          </div>
        )}

        {/* Status Steps */}
        <div className="mt-8 relative">
          {/* Connection Line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-4 relative z-10">
            {STATUS_ORDER.map((status, index) => {
              const jobStatus = job.status as JobStatus;
              const isActive = status === jobStatus;
              const currentIndex = STATUS_ORDER.indexOf(jobStatus);
              const isCompleted = currentIndex !== -1 && index < currentIndex;
              const isFailed = job.status === JOB_STATUS.FAILED;
              
              return (
                <div key={status} className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isFailed
                        ? 'bg-gray-100 text-gray-400'
                        : isCompleted
                        ? 'bg-green-100 text-green-600'
                        : isActive
                        ? 'bg-primary-blue text-white shadow-lg scale-110'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted && !isFailed ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-lg font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-base ${
                        isFailed
                          ? 'text-gray-400'
                          : isActive 
                          ? 'text-text-primary font-semibold' 
                          : isCompleted
                          ? 'text-text-primary'
                          : 'text-text-secondary'
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                    {isActive && (
                      <div className="mt-1">
                        <div className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse animation-delay-200"></div>
                          <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse animation-delay-400"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Actions */}
        {job.status === 'completed' && job.audioUrl && (
          <div className="mt-6 pt-6 border-t">
            <a
              href={job.audioUrl}
              className="inline-flex items-center px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              download
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              音声をダウンロード
            </a>
          </div>
        )}
      </div>
    </div>
  );
}