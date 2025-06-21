import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { validateBgmPath } from '../../src/utils/validation';

describe('Generate Command with BGM', () => {
  const testDir = path.join(__dirname, '../fixtures');
  const testMemo = path.join(testDir, 'test-memo.txt');
  const testBgm = path.join(testDir, 'test-bgm.mp3');
  const testOutput = path.join(testDir, 'test-output.mp3');

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });

    // Create test memo file
    await fs.writeFile(
      testMemo,
      `2024-12-18

今日の活動:
- プロジェクトの設計を完了
- テストコードを追加
- ドキュメントを更新`,
    );

    // Create dummy BGM file (just an empty file for testing validation)
    await fs.writeFile(testBgm, Buffer.alloc(0));
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.unlink(testMemo);
      await fs.unlink(testBgm);
      await fs.unlink(testOutput);
    } catch {
      // Ignore errors
    }
  });

  it('should validate BGM path correctly for valid MP3 file', async () => {
    const result = await validateBgmPath(testBgm);
    expect(result.valid).toBe(true);
  });

  it('should pass validation when BGM is not provided', async () => {
    const result = await validateBgmPath(undefined);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid BGM file extension', async () => {
    const invalidBgm = path.join(testDir, 'test-bgm.wav');
    await fs.writeFile(invalidBgm, Buffer.alloc(0));

    const result = await validateBgmPath(invalidBgm);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BGMファイルはMP3形式である必要があります');

    await fs.unlink(invalidBgm);
  });

  it('should reject non-existent BGM file', async () => {
    const nonExistentBgm = path.join(testDir, 'non-existent.mp3');
    
    const result = await validateBgmPath(nonExistentBgm);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BGMファイルが見つかりません');
  });
});