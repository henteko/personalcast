// ジョブステータスの定義と順序を統一
export const JOB_STATUS = {
  QUEUED: 'queued',
  PARSING: 'parsing',
  ANALYZING_MEMO: 'analyzing_memo',
  GENERATING_SCRIPT: 'generating_script',
  SCRIPT_READY: 'script_ready',
  SYNTHESIZING_VOICE: 'synthesizing_voice',
  MIXING_AUDIO: 'mixing_audio',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

// ステータスの順序（failedは除外）
export const STATUS_ORDER: JobStatus[] = [
  JOB_STATUS.QUEUED,
  JOB_STATUS.PARSING,
  JOB_STATUS.ANALYZING_MEMO,
  JOB_STATUS.GENERATING_SCRIPT,
  JOB_STATUS.SCRIPT_READY,
  JOB_STATUS.SYNTHESIZING_VOICE,
  JOB_STATUS.MIXING_AUDIO,
  JOB_STATUS.COMPLETED
];

// ステータスのラベル
export const STATUS_LABELS: Record<JobStatus, string> = {
  [JOB_STATUS.QUEUED]: 'キューに追加されました',
  [JOB_STATUS.PARSING]: 'メモを解析中',
  [JOB_STATUS.ANALYZING_MEMO]: '活動を分析中',
  [JOB_STATUS.GENERATING_SCRIPT]: 'スクリプトを生成中',
  [JOB_STATUS.SCRIPT_READY]: 'スクリプトが完成しました',
  [JOB_STATUS.SYNTHESIZING_VOICE]: '音声を生成中',
  [JOB_STATUS.MIXING_AUDIO]: '音声を処理中',
  [JOB_STATUS.COMPLETED]: '完了',
  [JOB_STATUS.FAILED]: 'エラー'
};

// ステータスごとの進捗率
export const STATUS_PROGRESS: Record<JobStatus, number> = {
  [JOB_STATUS.QUEUED]: 0,
  [JOB_STATUS.PARSING]: 10,
  [JOB_STATUS.ANALYZING_MEMO]: 30,
  [JOB_STATUS.GENERATING_SCRIPT]: 50,
  [JOB_STATUS.SCRIPT_READY]: 60,
  [JOB_STATUS.SYNTHESIZING_VOICE]: 70,
  [JOB_STATUS.MIXING_AUDIO]: 90,
  [JOB_STATUS.COMPLETED]: 100,
  [JOB_STATUS.FAILED]: 0
};