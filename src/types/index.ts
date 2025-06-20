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
  HAPPY = 'happy',
  EXCITED = 'excited',
  GENTLE = 'gentle',
  ENCOURAGING = 'encouraging',
}

export interface RadioConfig {
  duration: number;
  style: PraiseStyle;
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

export enum PraiseStyle {
  GENTLE = 'gentle',
  ENERGETIC = 'energetic',
}

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
  style?: 'gentle' | 'energetic';
  duration?: number;
  enableBGM?: boolean;
  bgmVolume?: number;
  voiceSpeed?: number;
}
