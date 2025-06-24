'use client';

import { useState } from 'react';
import { GenerationOptions } from '@/lib/types/api';

interface ActivityFormProps {
  onSubmit: (activityLog: string, options: GenerationOptions) => void;
  isLoading?: boolean;
}

const TEMPLATE_TEXT = `【業務活動】
- TypeScript移行タスク2件完了
- コードレビュー3件実施
- チームミーティング参加

【学習・成長】
- React新機能の学習（30分）
- テスト設計のドキュメント作成

【健康・生活】
- 朝のランニング（5km）
- 健康的な昼食を選択

【その他】
- プロジェクト計画の更新`;

export function ActivityForm({ onSubmit, isLoading = false }: ActivityFormProps) {
  const [activityLog, setActivityLog] = useState('');
  const [options, setOptions] = useState<GenerationOptions>({
    analysisStyle: 'analytical',
    duration: 5,
    speed: 1.0,
    newsShowName: 'PersonalCast'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activityLog.trim()) {
      onSubmit(activityLog, options);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      setActivityLog(text);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
      <div>
        <label htmlFor="activity-log" className="block text-sm font-medium text-text-primary mb-2">
          活動記録
        </label>
        <textarea
          id="activity-log"
          value={activityLog}
          onChange={(e) => setActivityLog(e.target.value)}
          placeholder={TEMPLATE_TEXT}
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
          required
          disabled={isLoading}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            {activityLog.length} / 10,000 文字
          </span>
          <label className="cursor-pointer text-sm text-primary-blue hover:text-primary-light-blue">
            <input
              type="file"
              accept=".txt,.md,.json,.csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            ファイルをアップロード
          </label>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary-blue hover:text-primary-light-blue flex items-center gap-2 cursor-pointer"
        >
          詳細オプション
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                分析スタイル
              </label>
              <select
                value={options.analysisStyle}
                onChange={(e) => setOptions({ ...options, analysisStyle: e.target.value as 'analytical' | 'comprehensive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                disabled={isLoading}
              >
                <option value="analytical">分析的（データ重視）</option>
                <option value="comprehensive">包括的（詳細な説明）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                番組の長さ: {options.duration}分
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={options.duration}
                onChange={(e) => setOptions({ ...options, duration: parseInt(e.target.value) })}
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                音声速度: {options.speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={options.speed}
                onChange={(e) => setOptions({ ...options, speed: parseFloat(e.target.value) })}
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                番組名
              </label>
              <input
                type="text"
                value={options.newsShowName}
                onChange={(e) => setOptions({ ...options, newsShowName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                placeholder="PersonalCast"
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !activityLog.trim()}
        className="w-full py-3 px-4 bg-primary-blue text-white font-medium rounded-lg hover:bg-primary-light-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {isLoading ? '処理中...' : '分析を開始'}
      </button>
    </form>
  );
}