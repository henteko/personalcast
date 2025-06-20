import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface AppConfig {
  gemini: {
    apiKey: string;
    model: string;
    temperature: number;
  };
  personalities: {
    host1: {
      name: string;
      voiceName: string;
      character: string;
    };
    host2: {
      name: string;
      voiceName: string;
      character: string;
    };
  };
  praise: {
    style: string;
    focusAreas: string[];
  };
  audio: {
    duration: number;
    bgm: boolean;
    speed: number;
  };
}

class Config {
  private static instance: Config;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private loadConfig(): AppConfig {
    const defaultConfig: AppConfig = {
      gemini: {
        apiKey: process.env.GEMINI_API_KEY ?? '',
        model: 'gemini-1.5-pro',
        temperature: 0.7,
      },
      personalities: {
        host1: {
          name: 'あかり',
          voiceName: 'ja-JP-Wavenet-A',
          character: '優しくて励まし上手',
        },
        host2: {
          name: 'けんた',
          voiceName: 'ja-JP-Wavenet-C',
          character: '明るくて分析好き',
        },
      },
      praise: {
        style: 'gentle',
        focusAreas: ['work', 'learning', 'health'],
      },
      audio: {
        duration: 10,
        bgm: true,
        speed: 1.0,
      },
    };

    // Check for config file
    const configPath = path.join(process.cwd(), 'cheercast.config.json');
    if (fs.existsSync(configPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Partial<AppConfig>;
        return this.mergeConfig(defaultConfig, userConfig);
      } catch {
        console.warn('Failed to load config file, using defaults');
      }
    }

    return defaultConfig;
  }

  private mergeConfig(defaultConfig: AppConfig, userConfig: Partial<AppConfig>): AppConfig {
    return {
      gemini: { ...defaultConfig.gemini, ...userConfig.gemini },
      personalities: {
        host1: { ...defaultConfig.personalities.host1, ...userConfig.personalities?.host1 },
        host2: { ...defaultConfig.personalities.host2, ...userConfig.personalities?.host2 },
      },
      praise: { ...defaultConfig.praise, ...userConfig.praise },
      audio: { ...defaultConfig.audio, ...userConfig.audio },
    };
  }

  get(): AppConfig {
    return this.config;
  }

  getGeminiApiKey(): string {
    const apiKey = this.config.gemini.apiKey;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    return apiKey;
  }
}

export const config = Config.getInstance();
