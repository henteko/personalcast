import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ScriptGenerator } from '../ScriptGenerator';
import { GeminiAPIClient } from '../../../services/gemini-api/GeminiAPIClient';
import {
  ParsedMemo,
  ActivityCategory,
  SegmentType,
  PersonalityType,
  AnalysisStyle,
} from '../../../types';

jest.mock('../../../services/gemini-api/GeminiAPIClient');
jest.mock('../../../config', () => ({
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

      const mockResponse = `[オープニング]
あかり: こんにちは！Today's Youの時間です。私、あかりと
けんた: けんたがお送りします！

[メイン]
あかり: 今日はプロジェクトを完了させたんですね。
けんた: 重要な達成として記録されました。

[エンディング]
あかり: 明日の活動も注目していきます。
けんた: それでは、また明日！`;

      mockGeminiClient.generateContentWithRetry.mockResolvedValue(mockResponse);

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

      mockGeminiClient.generateContentWithRetry.mockResolvedValue('[オープニング]\nあかり: テスト');

      await generator.generateScript(memo, { style: AnalysisStyle.COMPREHENSIVE });

      const callArgs = mockGeminiClient.generateContentWithRetry.mock.calls[0][0];
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
      expect(prompt).toContain('[オープニング]');
      expect(prompt).toContain('[メイン]');
      expect(prompt).toContain('[エンディング]');
      expect(prompt).toContain('プロフェッショナルなニュース番組');
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

  describe('parseGeminiResponse', () => {
    it('should parse valid Gemini response into NewsScript', () => {
      const response = `[オープニング]
あかり: こんにちは！
けんた: 本日の活動レポートです。

[メイン]
あかり: プロジェクトの完成が確認されました。
けんた: 重要な成果として記録されます。

[エンディング]
あかり: 明日の活動も注目です。
けんた: また明日！`;

      const script = generator.parseGeminiResponse(response);

      expect(script.segments!).toHaveLength(3);
      expect(script.segments![0].dialogues).toHaveLength(2);
      expect(script.segments![0].dialogues[0].speaker).toBe(PersonalityType.AKARI);
      expect(script.segments![0].dialogues[0].text).toBe('こんにちは！');
      expect(script.segments![0].dialogues[1].speaker).toBe(PersonalityType.KENTA);
    });

    it('should handle responses with irregular formatting', () => {
      const response = `[オープニング]
あかり:こんにちは！
けんた :  今日も頑張りましたね！

[メイン]
あかり：プロジェクトの完成、おめでとうございます！`;

      const script = generator.parseGeminiResponse(response);

      expect(script.segments![0].dialogues[0].text).toBe('こんにちは！');
      expect(script.segments![0].dialogues[1].text).toBe('今日も頑張りましたね！');
      expect(script.segments![1].dialogues[0].text).toBe(
        'プロジェクトの完成、おめでとうございます！',
      );
    });

    it('should throw error for invalid response format', () => {
      const invalidResponse = 'This is not a valid script format';

      expect(() => generator.parseGeminiResponse(invalidResponse)).toThrow('Invalid script format');
    });
  });
});
