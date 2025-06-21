import { AddBgmCommand } from '../add-bgm';
import { FFmpegService } from '../../../services/ffmpeg/FFmpegService';
import * as fs from 'fs/promises';

// Mock dependencies
jest.mock('../../../services/ffmpeg/FFmpegService');
jest.mock('fs/promises');

describe('AddBgmCommand', () => {
  let command: AddBgmCommand;
  let mockFFmpegService: jest.Mocked<FFmpegService>;
  let addBackgroundMusicMock: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock FFmpeg service
    addBackgroundMusicMock = jest.fn().mockResolvedValue('/path/to/output.mp3');
    mockFFmpegService = {
      addBackgroundMusic: addBackgroundMusicMock,
    } as unknown as jest.Mocked<FFmpegService>;

    // Mock the FFmpegService constructor
    (FFmpegService as jest.MockedClass<typeof FFmpegService>).mockImplementation(
      () => mockFFmpegService,
    );

    // Create command instance
    command = new AddBgmCommand();

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Mock fs.access to succeed by default
    (fs.access as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('execute', () => {
    const validOptions = {
      bgm: '/path/to/bgm.mp3',
      audio: '/path/to/audio.mp3',
    };

    it('should successfully add BGM with default options', async () => {
      await command.execute(validOptions);

      expect(consoleLogSpy).toHaveBeenCalledWith('BGMを追加中...');
      expect(consoleLogSpy).toHaveBeenCalledWith('BGMを処理中...');
      expect(addBackgroundMusicMock).toHaveBeenCalledWith(
        '/path/to/audio.mp3',
        '/path/to/bgm.mp3',
        {
          output: '/path/to/audio_with_bgm.mp3',
          bgmVolume: 0.3,
          ducking: 0.15,
          fadeIn: 3,
          fadeOut: 3,
          intro: 3,
          outro: 2,
        },
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ BGMの追加が完了しました！');
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ 出力ファイル: /path/to/output.mp3');
    });

    it('should use custom options when provided', async () => {
      const customOptions = {
        ...validOptions,
        output: '/custom/output.mp3',
        bgmVolume: 0.5,
        ducking: 0.2,
        fadeIn: 5,
        fadeOut: 4,
        intro: 4,
        outro: 3,
      };

      await command.execute(customOptions);

      expect(addBackgroundMusicMock).toHaveBeenCalledWith(
        '/path/to/audio.mp3',
        '/path/to/bgm.mp3',
        {
          output: '/custom/output.mp3',
          bgmVolume: 0.5,
          ducking: 0.2,
          fadeIn: 5,
          fadeOut: 4,
          intro: 4,
          outro: 3,
        },
      );
    });

    it('should handle missing BGM file path', async () => {
      const invalidOptions = {
        bgm: '',
        audio: '/path/to/audio.mp3',
      };

      await expect(async () => {
        await command.execute(invalidOptions);
      }).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: BGMファイルのパスを指定してください (--bgm)',
      );
    });

    it('should handle missing audio file path', async () => {
      const invalidOptions = {
        bgm: '/path/to/bgm.mp3',
        audio: '',
      };

      await expect(async () => {
        await command.execute(invalidOptions);
      }).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: 音声ファイルのパスを指定してください (--audio)',
      );
    });

    it('should handle non-existent BGM file', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      await expect(async () => {
        await command.execute(validOptions);
      }).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: BGMファイルが見つかりません: /path/to/bgm.mp3',
      );
    });

    it('should handle non-MP3 BGM file', async () => {
      const invalidOptions = {
        bgm: '/path/to/bgm.wav',
        audio: '/path/to/audio.mp3',
      };

      await expect(async () => {
        await command.execute(invalidOptions);
      }).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: BGMファイルはMP3形式である必要があります',
      );
    });

    it('should handle invalid BGM volume', async () => {
      const invalidOptions = {
        ...validOptions,
        bgmVolume: 1.5,
      };

      await expect(async () => {
        await command.execute(invalidOptions);
      }).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith('エラー: BGM音量は0から1の間で指定してください');
    });

    it('should handle invalid ducking value', async () => {
      const invalidOptions = {
        ...validOptions,
        ducking: -0.1,
      };

      await expect(async () => {
        await command.execute(invalidOptions);
      }).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: ダッキング音量は0から1の間で指定してください',
      );
    });

    it('should handle negative fade-in time', async () => {
      const invalidOptions = {
        ...validOptions,
        fadeIn: -1,
      };

      await expect(async () => {
        await command.execute(invalidOptions);
      }).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: フェードイン時間は0以上で指定してください',
      );
    });

    it('should handle FFmpeg service errors', async () => {
      addBackgroundMusicMock.mockRejectedValueOnce(new Error('FFmpeg error'));

      await expect(async () => {
        await command.execute(validOptions);
      }).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith('エラー: FFmpeg error');
    });
  });
});
