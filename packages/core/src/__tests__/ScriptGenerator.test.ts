import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ScriptGenerator } from '../generator/ScriptGenerator';
import { GeminiAPIClient } from '../services/gemini-api/GeminiAPIClient';
import {
  ParsedMemo,
  ActivityCategory,
  SegmentType,
  PersonalityType,
  AnalysisStyle,
} from '../types';

jest.mock('../services/gemini-api/GeminiAPIClient');
jest.mock('../config', () => ({
  config: {
    get: () => ({
      personalities: {
        host1: { name: 'あかり', character: '冷静で分析的なメインキャスター' },
        host2: { name: 'けんた', character: '洞察力のあるコメンテーター' },
      },
      praise: { style: 'analytical' },
      audio: { duration: 10 },
    }),
  },
}));

describe('ScriptGenerator', () => {
  let generator: ScriptGenerator;
  let mockGeminiClient: jest.Mocked<GeminiAPIClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGeminiClient = new GeminiAPIClient() as jest.Mocked<GeminiAPIClient>;
    generator = new ScriptGenerator();
    // @ts-expect-error - Accessing private property for testing
    generator.geminiClient = mockGeminiClient;
  });

  describe('generateScript', () => {
    it('should generate a news script from parsed memo', async () => {
      const memo: ParsedMemo = {
        date: new Date('2024-01-20'),
        content: '今日はプロジェクトを完了させた。',
        activities: [
          {
            category: ActivityCategory.WORK,
            description: 'プロジェクトを完了させた',
            achievement: '完了させた',
          },
        ],
        positiveElements: ['完了させた'],
      };

      const mockResponse = {
        segments: [
          {
            type: 'opening',
            dialogues: [
              { speaker: 'あかり', text: 'こんにちは！Today\'s Youの時間です。私、あかりと' },
              { speaker: 'けんた', text: 'けんたがお送りします！' }
            ]
          },
          {
            type: 'main',
            dialogues: [
              { speaker: 'あかり', text: '今日はプロジェクトを完了させたんですね。' },
              { speaker: 'けんた', text: '重要な達成として記録されました。' }
            ]
          },
          {
            type: 'ending',
            dialogues: [
              { speaker: 'あかり', text: '明日の活動も注目していきます。' },
              { speaker: 'けんた', text: 'それでは、また明日！' }
            ]
          }
        ]
      };

      (mockGeminiClient as any).generateStructuredContent = jest.fn(() => Promise.resolve(mockResponse));

      const result = await generator.generateScript(memo);

      expect(result.title).toContain('2024年1月20日');
      expect(result.date).toEqual(memo.date);
      expect(result.segments).toHaveLength(3);
      expect(result.segments![0].type).toBe(SegmentType.OPENING);
      expect(result.segments![1].type).toBe(SegmentType.MAIN);
      expect(result.segments![2].type).toBe(SegmentType.ENDING);
    });

    it('should handle different praise styles', async () => {
      const memo: ParsedMemo = {
        date: new Date(),
        content: 'テスト',
        activities: [],
        positiveElements: [],
      };

      const mockResponse = {
        segments: [
          {
            type: 'opening',
            dialogues: [
              { speaker: 'あかり', text: 'テスト' }
            ]
          }
        ]
      };

      (mockGeminiClient as any).generateStructuredContent = jest.fn(() => Promise.resolve(mockResponse));

      await generator.generateScript(memo, { style: AnalysisStyle.COMPREHENSIVE });

      const callArgs = ((mockGeminiClient as any).generateStructuredContent as jest.Mock).mock.calls[0][0];
      expect(callArgs).toContain('包括的');
    });
  });

  describe('createPrompt', () => {
    it('should create appropriate prompt for memo content', () => {
      const memo: ParsedMemo = {
        date: new Date('2024-01-20'),
        content: '今日は勉強を頑張った',
        activities: [
          {
            category: ActivityCategory.LEARNING,
            description: '英語の勉強を3時間',
          },
        ],
        positiveElements: ['頑張った'],
      };

      const prompt = generator.createPrompt(memo, AnalysisStyle.ANALYTICAL);

      expect(prompt).toContain('あかり');
      expect(prompt).toContain('けんた');
      expect(prompt).toContain('分析的');
      expect(prompt).toContain('英語の勉強を3時間');
      expect(prompt).toContain('オープニング');
      expect(prompt).toContain('メイン');
      expect(prompt).toContain('エンディング');
      expect(prompt).toContain('プロフェッショナルなニュース番組');
      expect(prompt).toContain('JSON形式で台本を作成してください');
    });

    it('should include all activities in the prompt', () => {
      const memo: ParsedMemo = {
        date: new Date(),
        content: 'multiple activities',
        activities: [
          { category: ActivityCategory.WORK, description: '仕事' },
          { category: ActivityCategory.HEALTH, description: '運動' },
          { category: ActivityCategory.PERSONAL, description: '趣味' },
        ],
        positiveElements: [],
      };

      const prompt = generator.createPrompt(memo, AnalysisStyle.ANALYTICAL);

      expect(prompt).toContain('仕事');
      expect(prompt).toContain('運動');
      expect(prompt).toContain('趣味');
    });
  });
});
