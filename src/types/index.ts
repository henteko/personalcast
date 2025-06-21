export interface ParsedMemo {
  date: Date;
  dateRange?: { start: Date; end: Date };
  content?: string;
  activities: DailyActivity[];
  positiveElements: string[];
  summary?: string;
}

export interface DailyActivity {
  category: ActivityCategory;
  description: string;
  achievement?: string;
}

export enum ActivityCategory {
  WORK = 'work',
  LEARNING = 'learning',
  HEALTH = 'health',
  PERSONAL = 'personal',
  OTHER = 'other',
}

export interface RadioScript {
  title: string;
  date: Date;
  duration?: number;
  segments?: ScriptSegment[];
  dialogues: DialogueLine[];
}

export interface ScriptSegment {
  type: SegmentType;
  dialogues: DialogueLine[];
}

export enum SegmentType {
  OPENING = 'opening',
  MAIN = 'main',
  ENDING = 'ending',
}

export interface DialogueLine {
  speaker?: PersonalityType;
  personality: string;
  content: string;
  text?: string;
  emotion?: EmotionType;
  pause?: number;
}

export enum PersonalityType {
  AKARI = 'akari',
  KENTA = 'kenta',
}

export enum EmotionType {
  PROFESSIONAL = 'professional',
  ANALYTICAL = 'analytical',
  INFORMATIVE = 'informative',
  NEUTRAL = 'neutral',
}

export interface RadioConfig {
  duration: number;
  style: AnalysisStyle;
  personalities: {
    host1: PersonalityConfig;
    host2: PersonalityConfig;
  };
}

export interface PersonalityConfig {
  name: string;
  voiceName: string;
  character: string;
}

export enum AnalysisStyle {
  ANALYTICAL = 'analytical',
  COMPREHENSIVE = 'comprehensive',
}

// Legacy alias for backward compatibility
export { AnalysisStyle as PraiseStyle };

export interface VoiceConfig {
  languageCode: string;
  speakingRate: number;
  pitch: number;
  volumeGainDb: number;
}

export interface AudioBuffer {
  data: Buffer;
  duration: number;
}

export interface GenerationOptions {
  outputPath: string;
  type?: 'daily' | 'weekly';
  style?: 'analytical' | 'comprehensive';
  duration?: number;
  voiceSpeed?: number;
  bgm?: {
    path: string;
    volume?: number;
    ducking?: number;
    fadeIn?: number;
    fadeOut?: number;
    intro?: number;
    outro?: number;
  };
  onProgress?: (message: string) => void;
}
