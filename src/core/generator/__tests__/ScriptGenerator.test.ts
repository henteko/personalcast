import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ScriptGenerator } from '../ScriptGenerator';
import { GeminiClient } from '../../../services/gemini';
import {
  ParsedMemo,
  ActivityCategory,
  SegmentType,
  PersonalityType,
  PraiseStyle,
} from '../../../types';

jest.mock('../../../services/gemini');
jest.mock('../../../config', () => ({
  config: {
    get: () => ({
      personalities: {
        host1: { name: 'あかり', character: '優しくて励まし上手' },
        host2: { name: 'けんた', character: '明るくて分析好き' },
      },
      praise: { style: 'gentle' },
      audio: { duration: 10 },
    }),
  },
}));

describe('ScriptGenerator', () => {
  let generator: ScriptGenerator;
  let mockGeminiClient: jest.Mocked<GeminiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGeminiClient = new GeminiClient() as jest.Mocked<GeminiClient>;
    generator = new ScriptGenerator();
    // @ts-expect-error - Accessing private property for testing
    generator.geminiClient = mockGeminiClient;
  });

  describe('generateScript', () => {
    it('should generate a radio script from parsed memo', async () => {
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
あかり: こんにちは！CheerCastの時間です。私、あかりと
けんた: けんたがお送りします！

[メイン]
あかり: 今日はプロジェクトを完了させたんですね！
けんた: すごい！大きな達成ですね！

[エンディング]
あかり: 明日も素敵な一日になりますように！
けんた: また明日も頑張りましょう！`;

      mockGeminiClient.generateContentWithRetry.mockResolvedValue(mockResponse);

      const result = await generator.generateScript(memo);

      expect(result.title).toContain('2024年1月20日');
      expect(result.date).toEqual(memo.date);
      expect(result.segments).toHaveLength(3);
      expect(result.segments[0].type).toBe(SegmentType.OPENING);
      expect(result.segments[1].type).toBe(SegmentType.MAIN);
      expect(result.segments[2].type).toBe(SegmentType.ENDING);
    });

    it('should handle different praise styles', async () => {
      const memo: ParsedMemo = {
        date: new Date(),
        content: 'テスト',
        activities: [],
        positiveElements: [],
      };

      mockGeminiClient.generateContentWithRetry.mockResolvedValue('[オープニング]\nあかり: テスト');

      await generator.generateScript(memo, { style: PraiseStyle.ENERGETIC });

      const callArgs = mockGeminiClient.generateContentWithRetry.mock.calls[0][0];
      expect(callArgs).toContain('エネルギッシュ');
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

      const prompt = generator.createPrompt(memo, PraiseStyle.GENTLE);

      expect(prompt).toContain('あかり');
      expect(prompt).toContain('けんた');
      expect(prompt).toContain('優しく');
      expect(prompt).toContain('英語の勉強を3時間');
      expect(prompt).toContain('[オープニング]');
      expect(prompt).toContain('[メイン]');
      expect(prompt).toContain('[エンディング]');
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

      const prompt = generator.createPrompt(memo, PraiseStyle.GENTLE);

      expect(prompt).toContain('仕事');
      expect(prompt).toContain('運動');
      expect(prompt).toContain('趣味');
    });
  });

  describe('parseGeminiResponse', () => {
    it('should parse valid Gemini response into RadioScript', () => {
      const response = `[オープニング]
あかり: こんにちは！
けんた: 今日も頑張りましたね！

[メイン]
あかり: プロジェクトの完成、おめでとうございます！
けんた: 本当に素晴らしい成果ですね。

[エンディング]
あかり: 明日も応援しています！
けんた: また明日！`;

      const script = generator.parseGeminiResponse(response);

      expect(script.segments).toHaveLength(3);
      expect(script.segments[0].dialogues).toHaveLength(2);
      expect(script.segments[0].dialogues[0].speaker).toBe(PersonalityType.AKARI);
      expect(script.segments[0].dialogues[0].text).toBe('こんにちは！');
      expect(script.segments[0].dialogues[1].speaker).toBe(PersonalityType.KENTA);
    });

    it('should handle responses with irregular formatting', () => {
      const response = `[オープニング]
あかり:こんにちは！
けんた :  今日も頑張りましたね！

[メイン]
あかり：プロジェクトの完成、おめでとうございます！`;

      const script = generator.parseGeminiResponse(response);

      expect(script.segments[0].dialogues[0].text).toBe('こんにちは！');
      expect(script.segments[0].dialogues[1].text).toBe('今日も頑張りましたね！');
      expect(script.segments[1].dialogues[0].text).toBe(
        'プロジェクトの完成、おめでとうございます！',
      );
    });

    it('should throw error for invalid response format', () => {
      const invalidResponse = 'This is not a valid script format';

      expect(() => generator.parseGeminiResponse(invalidResponse)).toThrow('Invalid script format');
    });
  });
});
