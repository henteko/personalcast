'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ActivityForm } from '@/components/forms/ActivityForm';
import { GenerationOptions } from '@/lib/types/api';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function GeneratePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (activityLog: string, options: GenerationOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityLog,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'エラーが発生しました');
      }

      const data = await response.json();
      // Navigate to job status page
      router.push(`/jobs/${data.jobId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
      setIsLoading(false);
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
              今日の活動を記録しましょう
            </h1>
            <p className="text-lg md:text-xl text-text-secondary">
              あなたの1日をAIが分析し、プロのニュース番組として音声化します
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-blue/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-light-blue/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16">
        {/* Process Section */}
        <section className="mb-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-center text-primary-blue mb-10">
            生成プロセス
          </h3>
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
            
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 text-primary-blue rounded-full flex items-center justify-center text-xl font-bold">
                    1
                  </div>
                  <h4 className="font-semibold ml-3">活動分析</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  記録された活動をAIが分析し、重要なポイントを抽出します
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 text-primary-blue rounded-full flex items-center justify-center text-xl font-bold">
                    2
                  </div>
                  <h4 className="font-semibold ml-3">スクリプト生成</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  2人のAIキャスターによる自然な対話形式のスクリプトを作成
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 text-primary-blue rounded-full flex items-center justify-center text-xl font-bold">
                    3
                  </div>
                  <h4 className="font-semibold ml-3">音声合成</h4>
                </div>
                <p className="text-sm text-text-secondary">
                  最新のAI音声技術で、プロ品質の音声番組を生成します
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-2xl mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-error flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-text-primary mb-2">
                活動記録フォーム
              </h2>
              <p className="text-text-secondary">
                今日の出来事、完了したタスク、感じたことなどを自由に記録してください
              </p>
            </div>

            <ActivityForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {/* Tips Section */}
          <div className="mt-12 bg-blue-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-primary-blue mb-6 text-center">
              記録のコツ
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-2xl">✨</span>
                </div>
                <h4 className="font-semibold text-sm mb-2">具体的に</h4>
                <p className="text-sm text-text-secondary">
                  何をどのように達成したか具体的に書くと、より良い分析ができます
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="font-semibold text-sm mb-2">数字を含める</h4>
                <p className="text-sm text-text-secondary">
                  時間や成果の数値を含めると、客観的な振り返りができます
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <span className="text-2xl">💭</span>
                </div>
                <h4 className="font-semibold text-sm mb-2">感想も大切</h4>
                <p className="text-sm text-text-secondary">
                  感じたことや気づきも記録すると、より豊かな番組になります
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}