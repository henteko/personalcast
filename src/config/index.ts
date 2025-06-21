import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface AppConfig {
  radioShowName?: string;
  gemini: {
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
      radioShowName: "Today's You",
      gemini: {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
      },
      personalities: {
        host1: {
          name: 'あかり',
          voiceName: 'Kore',
          character: '冷静で分析的なメインキャスター',
        },
        host2: {
          name: 'けんた',
          voiceName: 'Puck',
          character: '洞察力のあるコメンテーター',
        },
      },
      praise: {
        style: 'analytical',
        focusAreas: ['work', 'learning', 'health'],
      },
      audio: {
        duration: 10,
        speed: 1.0,
      },
    };

    // Check for config file
    const configPath = path.join(process.cwd(), 'personalcast.config.json');
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
      radioShowName: userConfig.radioShowName ?? defaultConfig.radioShowName,
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
}

export const config = Config.getInstance();
