'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GenerationStatus } from '@/lib/types/api';

interface ConvexProgressDisplayProps {
  jobId: Id<"jobs">;
}

const STATUS_LABELS: Record<string, string> = {
  'queued': 'キューに追加されました',
  'parsing': 'メモを解析中',
  'analyzing_memo': '活動を分析中',
  'generating_script': '台本を生成中',
  'script_ready': '台本が完成しました',
  'synthesizing_voice': '音声を生成中',
  'mixing_audio': '音声を処理中',
  'completed': '完了',
  'failed': 'エラー',
};

const STATUS_ORDER = [
  'queued',
  'parsing',
  'analyzing_memo',
  'generating_script',
  'script_ready',
  'synthesizing_voice',
  'mixing_audio',
  'completed'
];

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
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-xl font-semibold text-text-primary mb-6">生成進捗</h2>
      
      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">
              {STATUS_LABELS[job.status] || job.status}
            </span>
            <span className="text-sm text-text-secondary">{job.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-blue h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        {job.progressMessage && (
          <p className="text-sm text-text-secondary text-center">{job.progressMessage}</p>
        )}

        {/* Error Message */}
        {job.status === 'failed' && job.error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">エラー: {job.error.message}</p>
          </div>
        )}

        {/* Status Steps */}
        <div className="mt-6 space-y-3">
          {STATUS_ORDER.map((status, index) => {
            const isActive = status === job.status;
            const currentIndex = STATUS_ORDER.indexOf(job.status);
            const isCompleted = index < currentIndex;
            
            return (
              <div key={status} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-success text-white'
                      : isActive
                      ? 'bg-primary-blue text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isActive ? 'text-text-primary font-medium' : 'text-text-secondary'
                  }`}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>
            );
          })}
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