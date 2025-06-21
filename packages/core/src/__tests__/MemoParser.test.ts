import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import { MemoParser } from '../parser/MemoParser';
import { ActivityCategory } from '../types';

jest.mock('fs/promises');

describe('MemoParser', () => {
  let parser: MemoParser;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    parser = new MemoParser();
    jest.clearAllMocks();
  });

  describe('parseTextFile', () => {
    it('should parse a simple text file with date and activities', async () => {
      const content = `2024-01-20

今日は新しいプロジェクトの設計を完了させた。
午前中は要件定義の見直しに時間をかけて、より良い設計ができたと思う。

午後からはコーディングを開始。TypeScriptの型定義で少し悩んだけど、
ドキュメントを読んで解決できた。

夕方には30分のウォーキングも達成！`;

      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTextFile('/path/to/memo.txt');

      expect(result.date).toEqual(new Date(2024, 0, 20));
      expect(result.content).toBe(content);
      expect(result.activities.length).toBeGreaterThan(0);
      expect(result.activities[0].category).toBe(ActivityCategory.WORK);
      expect(result.activities[0].description).toContain('プロジェクトの設計');
      expect(result.positiveElements.some((el) => el.includes('完了'))).toBe(true);
      expect(result.positiveElements.some((el) => el.includes('より良い'))).toBe(true);
      expect(result.positiveElements.some((el) => el.includes('解決'))).toBe(true);
      expect(result.positiveElements.some((el) => el.includes('達成'))).toBe(true);
    });

    it('should throw error when file cannot be read', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(parser.parseTextFile('/invalid/path.txt')).rejects.toThrow(
        'Failed to read file: /invalid/path.txt',
      );
    });

    it('should handle files without explicit date', async () => {
      const content = `今日は良い一日だった。
朝から勉強を頑張った。`;

      mockFs.readFile.mockResolvedValue(content);

      const result = await parser.parseTextFile('/path/to/memo.txt');

      expect(result.date.toDateString()).toBe(new Date().toDateString());
    });
  });

  describe('parseDirectory', () => {
    it('should parse all text files in a directory', async () => {
      const mockDirents = [
        { name: 'memo1.txt', isFile: () => true, isDirectory: () => false },
        { name: 'memo2.md', isFile: () => true, isDirectory: () => false },
        { name: 'image.png', isFile: () => true, isDirectory: () => false },
        { name: 'subfolder', isFile: () => false, isDirectory: () => true },
      ];
      // @ts-expect-error - Mocking fs.Dirent for testing
      mockFs.readdir.mockResolvedValue(mockDirents);

      mockFs.readFile.mockResolvedValueOnce('2024-01-20\n今日の活動をした。');
      mockFs.readFile.mockResolvedValueOnce('2024-01-21\n今日も活動をした。');

      const result = await parser.parseDirectory('/path/to/dir');

      expect(mockFs.readdir).toHaveBeenCalledWith('/path/to/dir', { withFileTypes: true });
      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].activities).toBeDefined();
      expect(result[1].activities).toBeDefined();
    });

    it('should throw error for empty directory', async () => {
      mockFs.readdir.mockResolvedValue([]);

      await expect(parser.parseDirectory('/empty/dir')).rejects.toThrow(
        'No valid memo files found in directory',
      );
    });
  });

  describe('extractDailyActivities', () => {
    it('should categorize activities correctly', () => {
      const content = `
仕事でプレゼンテーションを成功させた。
英語の勉強を1時間やった。
ジムで筋トレをした。
友達と映画を見に行った。
`;

      const activities = parser.extractDailyActivities(content);

      expect(activities.length).toBeGreaterThanOrEqual(2);

      const hasWork = activities.some((a) => a.category === ActivityCategory.WORK);
      const hasLearning = activities.some((a) => a.category === ActivityCategory.LEARNING);

      expect(hasWork).toBe(true);
      expect(hasLearning).toBe(true);
    });

    it('should extract achievements from activities', () => {
      const content = '今日はTypeScriptの勉強を3時間も頑張った！';

      const activities = parser.extractDailyActivities(content);

      expect(activities).toHaveLength(1);
      expect(activities[0].achievement).toBe('3時間も頑張った');
    });
  });

  describe('categorizeContent', () => {
    it('should identify work-related content', () => {
      expect(parser.categorizeContent('会議でプレゼンした')).toBe(ActivityCategory.WORK);
      expect(parser.categorizeContent('仕事のタスクを完了')).toBe(ActivityCategory.WORK);
      expect(parser.categorizeContent('プロジェクトの設計')).toBe(ActivityCategory.WORK);
    });

    it('should identify learning-related content', () => {
      expect(parser.categorizeContent('英語の勉強をした')).toBe(ActivityCategory.LEARNING);
      expect(parser.categorizeContent('本を読んだ')).toBe(ActivityCategory.LEARNING);
      expect(parser.categorizeContent('新しい技術を学んだ')).toBe(ActivityCategory.LEARNING);
    });

    it('should identify health-related content', () => {
      expect(parser.categorizeContent('ランニングした')).toBe(ActivityCategory.HEALTH);
      expect(parser.categorizeContent('ジムで運動')).toBe(ActivityCategory.HEALTH);
      expect(parser.categorizeContent('ウォーキング達成')).toBe(ActivityCategory.HEALTH);
    });

    it('should default to OTHER for unmatched content', () => {
      expect(parser.categorizeContent('天気が良かった')).toBe(ActivityCategory.OTHER);
    });
  });
});
