import { GenerationStatus } from '@/lib/types/api';

interface ProgressDisplayProps {
  status: GenerationStatus;
  progress: number;
  message: string;
}

const STATUS_LABELS: Record<GenerationStatus, string> = {
  [GenerationStatus.QUEUED]: 'キューに追加されました',
  [GenerationStatus.PARSING]: 'メモを解析中',
  [GenerationStatus.ANALYZING_MEMO]: '活動を分析中',
  [GenerationStatus.GENERATING_SCRIPT]: '台本を生成中',
  [GenerationStatus.SCRIPT_READY]: '台本が完成しました',
  [GenerationStatus.SYNTHESIZING_VOICE]: '音声を生成中',
  [GenerationStatus.MIXING_AUDIO]: '音声を処理中',
  [GenerationStatus.COMPLETED]: '完了',
  [GenerationStatus.FAILED]: 'エラー',
};

export function ProgressDisplay({ status, progress, message }: ProgressDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-xl font-semibold text-text-primary mb-6">生成進捗</h2>
      
      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">
              {STATUS_LABELS[status]}
            </span>
            <span className="text-sm text-text-secondary">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-blue h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <p className="text-sm text-text-secondary text-center">{message}</p>
        )}

        {/* Status Steps */}
        <div className="mt-6 space-y-3">
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const currentStatus = key as GenerationStatus;
            const isActive = currentStatus === status;
            const isCompleted = currentStatus < status;
            
            if (currentStatus === GenerationStatus.FAILED) return null;
            
            return (
              <div key={key} className="flex items-center gap-3">
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
                    <span className="text-xs font-bold">
                      {Object.keys(STATUS_LABELS).indexOf(key) + 1}
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isActive ? 'text-text-primary font-medium' : 'text-text-secondary'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}