export interface GenerationOptions {
  analysisStyle: 'analytical' | 'comprehensive';
  duration: number; // 1-10
  speed?: number; // 0.5-2.0
  newsShowName?: string;
}

export enum GenerationStatus {
  QUEUED = 'queued',
  PARSING = 'parsing',
  ANALYZING_MEMO = 'analyzing_memo',
  GENERATING_SCRIPT = 'generating_script',
  SCRIPT_READY = 'script_ready',
  SYNTHESIZING_VOICE = 'synthesizing_voice',
  MIXING_AUDIO = 'mixing_audio',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface JobResponse {
  jobId: string;
  status: GenerationStatus;
  estimatedTime?: number;
  progress?: number;
  message?: string;
  scriptAvailable?: boolean;
  estimatedTimeRemaining?: number;
}

export interface ScriptSection {
  speaker: string;
  text: string;
}

export interface ScriptData {
  title: string;
  sections: ScriptSection[];
}

export interface ScriptResponse {
  jobId: string;
  status: GenerationStatus;
  script: ScriptData;
}

export interface ResultResponse {
  jobId: string;
  status: GenerationStatus;
  audioUrl: string;
  script: ScriptData;
  duration: number;
  expiresAt: string;
}

export interface AnalyzeRequest {
  activityLog: string;
  options: GenerationOptions;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}