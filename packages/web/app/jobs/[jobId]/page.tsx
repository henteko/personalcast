'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobResponse, GenerationStatus, ScriptData, ResultResponse } from '@/lib/types/api';
import { ConvexProgressDisplay } from '@/components/analysis/ConvexProgressDisplay';
import { ScriptDisplay } from '@/components/analysis/ScriptDisplay';
import { AudioPlayer } from '@/components/analysis/AudioPlayer';
import type { Id } from '@/convex/_generated/dataModel';

export default function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobResponse | null>(null);
  const [script, setScript] = useState<ScriptData | null>(null);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const loadJobId = async () => {
      const { jobId: paramJobId } = await params;
      setJobId(paramJobId);
      const jobId = paramJobId;
      
      const loadScript = async (id: string) => {
        try {
          const response = await fetch(`/api/jobs/${id}/script`);
          if (response.ok) {
            const data = await response.json();
            setScript(data.script);
          }
        } catch (error) {
          console.error('Failed to load script:', error);
        }
      };

      const loadResult = async (id: string) => {
        try {
          const response = await fetch(`/api/jobs/${id}/result`);
          if (response.ok) {
            const data: ResultResponse = await response.json();
            setResult(data);
          }
        } catch (error) {
          console.error('Failed to load result:', error);
        }
      };
      
      const checkStatus = async () => {
        try {
          const response = await fetch(`/api/jobs/${jobId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'ジョブが見つかりません');
          }

          const data: JobResponse = await response.json();
          setJobData(data);

          // Check if script is available
          if (data.scriptAvailable && !script) {
            loadScript(jobId);
          }

          // Check if completed
          if (data.status === GenerationStatus.COMPLETED) {
            loadResult(jobId);
          } else if (data.status === GenerationStatus.FAILED) {
            setError('生成中にエラーが発生しました');
          } else {
            // Continue polling
            timeoutId = setTimeout(checkStatus, 2000);
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'エラーが発生しました');
        }
      };
      
      checkStatus();
    };
    
    loadJobId();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [params, script]);


  if (error) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-error mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold">{error}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-light-blue transition-colors"
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-text-secondary">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-blue mb-2">PersonalCast</h1>
          <p className="text-text-secondary">分析レポート生成中</p>
        </header>

        <main className="max-w-4xl mx-auto">
          {/* Progress Display */}
          {jobId && jobData.status !== GenerationStatus.COMPLETED && (
            <div className="mb-8">
              <ConvexProgressDisplay
                jobId={jobId as Id<"jobs">}
              />
            </div>
          )}

          {/* Script Display - プレビューとして表示（台本生成後〜完了前） */}
          {script && jobData.status !== GenerationStatus.COMPLETED && (
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">プレビュー:</span> 台本が生成されました。音声生成が完了するまでお待ちください。
                </p>
              </div>
              <ScriptDisplay script={script} />
            </div>
          )}

          {/* Audio Player - 完了後のみ表示 */}
          {jobData.status === GenerationStatus.COMPLETED && result && (
            <div className="mb-8">
              <AudioPlayer
                audioUrl={result.audioUrl}
                script={result.script}
                duration={result.duration}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            {jobData.status === GenerationStatus.COMPLETED && result && (
              <a
                href={result.audioUrl}
                download={`personalcast_${new Date().toISOString().split('T')[0]}.mp3`}
                className="px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-light-blue transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                ダウンロード
              </a>
            )}
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-200 text-text-primary rounded-lg hover:bg-gray-300 transition-colors"
            >
              新しい分析を開始
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}