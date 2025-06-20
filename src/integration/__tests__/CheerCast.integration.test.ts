import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CheerCast } from '../../CheerCast';
import { ScriptGenerator } from '../../core/generator/ScriptGenerator';
import { VoiceGenerator } from '../../core/voice/VoiceGenerator';
import { AudioMixer } from '../../core/mixer/AudioMixer';
import * as utils from '../../utils';

jest.mock('../../core/generator/ScriptGenerator');
jest.mock('../../core/voice/VoiceGenerator');
jest.mock('../../core/mixer/AudioMixer');
jest.mock('../../utils', () => {
  const actualUtils = jest.requireActual('../../utils');
  return {
    ...(actualUtils as object),
    findBGMFile: jest.fn(),
  };
});

describe('CheerCast Integration Tests', () => {
  let cheerCast: CheerCast;
  let tempDir: string;
  let mockScriptGenerator: jest.Mocked<ScriptGenerator>;
  let mockVoiceGenerator: jest.Mocked<VoiceGenerator>;
  let mockAudioMixer: jest.Mocked<AudioMixer>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create temp directory for test files
    tempDir = path.join('/tmp', `cheercast-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Create mock instances
    const MockedScriptGenerator = ScriptGenerator as jest.MockedClass<typeof ScriptGenerator>;
    const MockedVoiceGenerator = VoiceGenerator as jest.MockedClass<typeof VoiceGenerator>;
    const MockedAudioMixer = AudioMixer as jest.MockedClass<typeof AudioMixer>;

    mockScriptGenerator = new MockedScriptGenerator() as jest.Mocked<ScriptGenerator>;
    mockVoiceGenerator = new MockedVoiceGenerator() as jest.Mocked<VoiceGenerator>;
    mockAudioMixer = new MockedAudioMixer() as jest.Mocked<AudioMixer>;

    cheerCast = new CheerCast();
    // @ts-expect-error - Accessing private property for testing
    cheerCast.scriptGenerator = mockScriptGenerator;
    // @ts-expect-error - Accessing private property for testing
    cheerCast.voiceGenerator = mockVoiceGenerator;
    // @ts-expect-error - Accessing private property for testing
    cheerCast.audioMixer = mockAudioMixer;
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('End-to-End Workflow', () => {
    it('should generate radio show from a single memo file', async () => {
      // Create test memo file
      const memoPath = path.join(tempDir, 'test_memo.txt');
      const memoContent = `2024-01-20 の日記

今日は新しい機能の実装を完了させた。
テストも全て通って、良い一日だった。`;
      await fs.writeFile(memoPath, memoContent);

      // Mock script generation
      const mockScript = {
        title: 'テストラジオ',
        date: new Date('2024-01-20'),
        dialogues: [
          { personality: 'あかり', content: 'こんにちは！' },
          { personality: 'けんた', content: '今日も頑張りましたね！' },
        ],
      };
      mockScriptGenerator.generateScript.mockResolvedValue(mockScript);

      // Mock voice generation
      const mockAudioBuffers = [
        { data: Buffer.from('audio1'), duration: 2.0 },
        { data: Buffer.from('audio2'), duration: 3.0 },
      ];
      mockVoiceGenerator.generateSpeech.mockResolvedValue(mockAudioBuffers);

      // Mock audio mixing
      const mockCombinedAudio = Buffer.from('combined audio');
      mockAudioMixer.combineAudio.mockResolvedValue(mockCombinedAudio);
      mockAudioMixer.normalizeVolume.mockResolvedValue(mockCombinedAudio);

      // Generate radio show
      const outputPath = path.join(tempDir, 'output.mp3');
      await cheerCast.generateFromFile(memoPath, {
        outputPath,
        style: 'gentle',
        enableBGM: false,
      });

      // Verify the workflow
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockScriptGenerator.generateScript).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.any(Date),
          activities: expect.arrayContaining([
            expect.objectContaining({
              description: expect.stringContaining('新しい機能の実装'),
            }),
          ]),
        }),
        expect.objectContaining({ style: 'gentle' }),
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockVoiceGenerator.generateSpeech).toHaveBeenCalledWith(
        mockScript,
        expect.any(Object),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockAudioMixer.combineAudio).toHaveBeenCalledWith(mockAudioBuffers);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockAudioMixer.normalizeVolume).toHaveBeenCalledWith(mockCombinedAudio);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockAudioMixer.exportToMP3).toHaveBeenCalledWith(mockCombinedAudio, outputPath);
    });

    it('should generate weekly summary from multiple memo files', async () => {
      // Create multiple test memo files
      const memos = [
        { date: '2024-01-15', content: '月曜日：プロジェクト開始' },
        { date: '2024-01-16', content: '火曜日：設計完了' },
        { date: '2024-01-17', content: '水曜日：実装開始' },
      ];

      for (const memo of memos) {
        const filePath = path.join(tempDir, `${memo.date}.txt`);
        await fs.writeFile(filePath, `${memo.date}\n\n${memo.content}`);
      }

      // Mock responses
      const mockScript = {
        title: '週間まとめラジオ',
        date: new Date('2024-01-17'),
        dialogues: [
          { personality: 'あかり', content: '今週もお疲れ様でした！' },
          { personality: 'けんた', content: '素晴らしい一週間でしたね！' },
        ],
      };
      mockScriptGenerator.generateScript.mockResolvedValue(mockScript);

      const mockAudioBuffers = [
        { data: Buffer.from('weekly1'), duration: 3.0 },
        { data: Buffer.from('weekly2'), duration: 4.0 },
      ];
      mockVoiceGenerator.generateSpeech.mockResolvedValue(mockAudioBuffers);

      const mockFinalAudio = Buffer.from('weekly audio');
      mockAudioMixer.combineAudio.mockResolvedValue(mockFinalAudio);
      mockAudioMixer.normalizeVolume.mockResolvedValue(mockFinalAudio);

      // Generate weekly radio show
      const outputPath = path.join(tempDir, 'weekly.mp3');
      await cheerCast.generateFromDirectory(tempDir, {
        outputPath,
        type: 'weekly',
        style: 'energetic',
      });

      // Verify weekly processing
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockScriptGenerator.generateScript).toHaveBeenCalledWith(
        expect.objectContaining({
          activities: expect.arrayContaining([
            expect.objectContaining({ description: expect.stringContaining('プロジェクト開始') }),
            expect.objectContaining({ description: expect.stringContaining('設計完了') }),
            expect.objectContaining({ description: expect.stringContaining('実装開始') }),
          ]),
        }),
        expect.objectContaining({ style: 'energetic' }),
      );
    });

    it('should handle BGM addition when enabled', async () => {
      // Create test memo
      const memoPath = path.join(tempDir, 'memo.txt');
      await fs.writeFile(memoPath, '2024-01-20\n\n今日も一日頑張った！');

      // Mock findBGMFile to return a BGM path
      const mockFindBGMFile = utils.findBGMFile as jest.MockedFunction<typeof utils.findBGMFile>;
      mockFindBGMFile.mockResolvedValue('/path/to/bgm.mp3');

      // Mock responses
      mockScriptGenerator.generateScript.mockResolvedValue({
        title: 'BGMテスト',
        date: new Date(),
        dialogues: [{ personality: 'あかり', content: 'BGMと一緒に！' }],
      });

      mockVoiceGenerator.generateSpeech.mockResolvedValue([
        { data: Buffer.from('voice'), duration: 2.0 },
      ]);

      const mockVoiceOnly = Buffer.from('voice only');
      const mockWithBGM = Buffer.from('voice with bgm');
      mockAudioMixer.combineAudio.mockResolvedValue(mockVoiceOnly);
      mockAudioMixer.addBackgroundMusic.mockResolvedValue(mockWithBGM);
      mockAudioMixer.normalizeVolume.mockResolvedValue(mockWithBGM);

      // Generate with BGM
      const outputPath = path.join(tempDir, 'with_bgm.mp3');
      await cheerCast.generateFromFile(memoPath, {
        outputPath,
        enableBGM: true,
        bgmVolume: 0.2,
      });

      // Verify BGM was added
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockAudioMixer.addBackgroundMusic).toHaveBeenCalledWith(
        mockVoiceOnly,
        '/path/to/bgm.mp3',
        0.2,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle script generation errors gracefully', async () => {
      const memoPath = path.join(tempDir, 'memo.txt');
      await fs.writeFile(memoPath, 'Test memo');

      mockScriptGenerator.generateScript.mockRejectedValue(new Error('Gemini API error'));

      await expect(
        cheerCast.generateFromFile(memoPath, { outputPath: 'output.mp3' }),
      ).rejects.toThrow('Gemini API error');
    });

    it('should handle voice generation errors gracefully', async () => {
      const memoPath = path.join(tempDir, 'memo.txt');
      await fs.writeFile(memoPath, 'Test memo');

      mockScriptGenerator.generateScript.mockResolvedValue({
        title: 'Test',
        date: new Date(),
        dialogues: [{ personality: 'あかり', content: 'Test' }],
      });

      mockVoiceGenerator.generateSpeech.mockRejectedValue(new Error('TTS API error'));

      await expect(
        cheerCast.generateFromFile(memoPath, { outputPath: 'output.mp3' }),
      ).rejects.toThrow('TTS API error');
    });

    it('should handle audio mixing errors gracefully', async () => {
      const memoPath = path.join(tempDir, 'memo.txt');
      await fs.writeFile(memoPath, 'Test memo');

      mockScriptGenerator.generateScript.mockResolvedValue({
        title: 'Test',
        date: new Date(),
        dialogues: [{ personality: 'あかり', content: 'Test' }],
      });

      mockVoiceGenerator.generateSpeech.mockResolvedValue([
        { data: Buffer.from('audio'), duration: 1.0 },
      ]);

      mockAudioMixer.combineAudio.mockRejectedValue(new Error('FFmpeg error'));

      await expect(
        cheerCast.generateFromFile(memoPath, { outputPath: 'output.mp3' }),
      ).rejects.toThrow('FFmpeg error');
    });
  });

  describe('Preview Mode', () => {
    it('should generate script without audio in preview mode', async () => {
      const memoPath = path.join(tempDir, 'memo.txt');
      await fs.writeFile(memoPath, '2024-01-20\n\nプレビューテスト');

      const mockScript = {
        title: 'プレビュー',
        date: new Date('2024-01-20'),
        dialogues: [
          { personality: 'あかり', content: 'これはプレビューです' },
          { personality: 'けんた', content: '音声は生成されません' },
        ],
      };
      mockScriptGenerator.generateScript.mockResolvedValue(mockScript);

      const result = await cheerCast.previewScript(memoPath, {
        style: 'gentle',
      });

      expect(result).toEqual(mockScript);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockVoiceGenerator.generateSpeech).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockAudioMixer.combineAudio).not.toHaveBeenCalled();
    });
  });
});
