'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobResponse, GenerationStatus, ScriptData, ResultResponse } from '@/lib/types/api';
import { ConvexProgressDisplay } from '@/components/analysis/ConvexProgressDisplay';
import { ScriptDisplay } from '@/components/analysis/ScriptDisplay';
import { AudioPlayer } from '@/components/analysis/AudioPlayer';
import type { Id } from '@/convex/_generated/dataModel';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobResponse | null>(null);
  const [script, setScript] = useState<ScriptData | null>(null);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [hasShownSuccessMessage, setHasShownSuccessMessage] = useState(false);

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
          const previousStatus = jobData?.status;
          setJobData(data);

          // Check if script is available
          if (data.scriptAvailable && !script) {
            loadScript(jobId);
          }

          // Check if completed
          if (data.status === GenerationStatus.COMPLETED) {
            // Show success message only on first completion during this session
            if (previousStatus !== GenerationStatus.COMPLETED && previousStatus !== undefined && !hasShownSuccessMessage) {
              setShowSuccessMessage(true);
              setHasShownSuccessMessage(true);
              // Hide success message after 5 seconds
              setTimeout(() => setShowSuccessMessage(false), 5000);
            }
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header with back to home link */}
        <header className="container mx-auto px-4 py-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-primary-blue hover:text-primary-light-blue transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">ホームに戻る</span>
          </Link>
        </header>
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold">{error}</p>
            </div>
            <button
              onClick={() => router.push('/generate')}
              className="mt-4 px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              新しい分析を開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
          <p className="mt-4 text-text-secondary">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ステータスに応じたヘッダーメッセージを決定
  const getHeaderMessage = () => {
    if (!jobData) return '読み込み中...';
    
    switch (jobData.status) {
      case GenerationStatus.QUEUED:
        return '処理を準備しています';
      case GenerationStatus.PARSING:
      case GenerationStatus.ANALYZING_MEMO:
        return 'メモを分析しています';
      case GenerationStatus.GENERATING_SCRIPT:
      case GenerationStatus.SCRIPT_READY:
        return 'スクリプトを作成しています';
      case GenerationStatus.SYNTHESIZING_VOICE:
      case GenerationStatus.MIXING_AUDIO:
        return '音声を生成しています';
      case GenerationStatus.COMPLETED:
        return '生成が完了しました';
      case GenerationStatus.FAILED:
        return 'エラーが発生しました';
      default:
        return '処理中...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header with back to home link */}
      <header className="container mx-auto px-4 py-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-primary-blue hover:text-primary-light-blue transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">ホームに戻る</span>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-primary-blue mb-4">
              {jobData.status === GenerationStatus.COMPLETED ? '音声レポートが完成しました' : 'PersonalCast生成中'}
            </h1>
            <p className="text-lg md:text-xl text-text-secondary">
              {getHeaderMessage()}
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-blue/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-light-blue/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
      </section>

      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Progress Display */}
          {jobId && jobData.status !== GenerationStatus.COMPLETED && (
            <div className="mb-12">
              <ConvexProgressDisplay
                jobId={jobId as Id<"jobs">}
              />
            </div>
          )}

          {/* Script Display - プレビューとして表示（スクリプト生成後〜完了前） */}
          {script && jobData.status !== GenerationStatus.COMPLETED && (
            <div className="mb-12">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">スクリプトプレビュー</h3>
                    <p className="text-sm text-blue-700">
                      スクリプトが生成されました。現在、音声生成を行っています。完了まで少々お待ちください。
                    </p>
                  </div>
                </div>
              </div>
              <ScriptDisplay script={script} />
            </div>
          )}

          {/* Audio Player - 完了後のみ表示 */}
          {jobData.status === GenerationStatus.COMPLETED && result && (
            <div className="space-y-8">
              {/* Success Message - Show only for first 5 seconds after completion */}
              {showSuccessMessage && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 transition-opacity duration-500">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">生成完了！</h3>
                      <p className="text-sm text-green-700">
                        あなたの一日を振り返る音声レポートが完成しました。再生ボタンを押してお楽しみください。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Player Card */}
              <AudioPlayer
                audioUrl={result.audioUrl}
                script={result.script}
                duration={result.duration}
              />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href={result.audioUrl}
                  download={`personalcast_${new Date().toISOString().split('T')[0]}.mp3`}
                  className="px-8 py-4 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  音声をダウンロード
                </a>
                <button
                  onClick={() => router.push('/generate')}
                  className="px-8 py-4 bg-white text-primary-blue border-2 border-primary-blue rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  新しい分析を開始
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons for non-completed status */}
          {jobData.status !== GenerationStatus.COMPLETED && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => router.push('/generate')}
                className="px-8 py-4 bg-white text-primary-blue border-2 border-gray-200 rounded-lg hover:border-primary-blue hover:bg-blue-50 transition-colors font-medium"
              >
                新しい分析を開始
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}