'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityForm } from '@/components/forms/ActivityForm';
import { GenerationOptions } from '@/lib/types/api';

export default function Home() {
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
    <div className="min-h-screen bg-bg-main">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-blue mb-4">PersonalCast</h1>
          <p className="text-lg text-text-secondary">
            あなたの1日の活動を分析し、AIパーソナリティがニュース番組形式でお届けします
          </p>
        </header>

        <main className="flex flex-col items-center">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              今日の活動を記録しましょう
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-error">
                {error}
              </div>
            )}

            <ActivityForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          <section className="mt-12 w-full max-w-4xl">
            <h3 className="text-xl font-semibold text-text-primary mb-4 text-center">
              使い方
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl mb-4">📝</div>
                <h4 className="font-semibold mb-2">1. 活動を記録</h4>
                <p className="text-sm text-text-secondary">
                  今日の業務、学習、健康活動などを記録します
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl mb-4">🤖</div>
                <h4 className="font-semibold mb-2">2. AI分析</h4>
                <p className="text-sm text-text-secondary">
                  AIがあなたの活動を分析し、ニュース台本を生成します
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl mb-4">🎙️</div>
                <h4 className="font-semibold mb-2">3. 音声でお届け</h4>
                <p className="text-sm text-text-secondary">
                  2人のAIキャスターがあなたの1日を振り返ります
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}