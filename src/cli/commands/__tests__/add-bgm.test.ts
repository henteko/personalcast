import { AddBgmCommand } from '../add-bgm';
import { CheerCast } from '../../../CheerCast';
import * as fs from 'fs/promises';

// Mock dependencies
jest.mock('../../../CheerCast');
jest.mock('fs/promises');

describe('AddBgmCommand', () => {
  let command: AddBgmCommand;
  let mockCheerCast: jest.Mocked<CheerCast>;
  let addBackgroundMusicMock: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock CheerCast
    addBackgroundMusicMock = jest.fn().mockResolvedValue('/path/to/output.mp3');
    mockCheerCast = {
      addBackgroundMusic: addBackgroundMusicMock,
    } as unknown as jest.Mocked<CheerCast>;

    // Mock the CheerCast constructor
    (CheerCast as jest.MockedClass<typeof CheerCast>).mockImplementation(() => mockCheerCast);

    // Mock fs.access to simulate file existence
    (fs.access as jest.Mock).mockResolvedValue(undefined);

    // Create command instance
    command = new AddBgmCommand();

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
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
      output: '/path/to/output.mp3',
      bgmVolume: 0.3,
      ducking: 0.15,
      fadeIn: 3,
      fadeOut: 3,
      intro: 3,
      outro: 2,
    };

    it('should successfully add BGM with default options', async () => {
      const options = {
        bgm: '/path/to/bgm.mp3',
        audio: '/path/to/audio.mp3',
      };

      await command.execute(options);

      expect(addBackgroundMusicMock).toHaveBeenCalledWith(
        options.audio,
        options.bgm,
        expect.objectContaining({
          output: '/path/to/audio_with_bgm.mp3',
          bgmVolume: 0.3,
          ducking: 0.15,
          fadeIn: 3,
          fadeOut: 3,
          intro: 3,
          outro: 2,
          onProgress: expect.any(Function) as (message: string) => void,
        }),
      );

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ BGMの追加が完了しました！');
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ 出力ファイル: /path/to/output.mp3');
    });

    it('should use custom options when provided', async () => {
      await command.execute(validOptions);

      expect(addBackgroundMusicMock).toHaveBeenCalledWith(
        validOptions.audio,
        validOptions.bgm,
        expect.objectContaining({
          output: validOptions.output,
          bgmVolume: validOptions.bgmVolume,
          ducking: validOptions.ducking,
          fadeIn: validOptions.fadeIn,
          fadeOut: validOptions.fadeOut,
          intro: validOptions.intro,
          outro: validOptions.outro,
          onProgress: expect.any(Function) as (message: string) => void,
        }),
      );
    });

    it('should handle missing BGM file path', async () => {
      const options = {
        bgm: '',
        audio: '/path/to/audio.mp3',
      };

      await expect(command.execute(options)).rejects.toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: BGMファイルのパスを指定してください (--bgm)',
      );
    });

    it('should handle missing audio file path', async () => {
      const options = {
        bgm: '/path/to/bgm.mp3',
        audio: '',
      };

      await expect(command.execute(options)).rejects.toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: 音声ファイルのパスを指定してください (--audio)',
      );
    });

    it('should handle non-existent BGM file', async () => {
      (fs.access as jest.Mock).mockImplementation((path: string) => {
        if (path === '/path/to/bgm.mp3') {
          throw new Error('File not found');
        }
      });

      const options = {
        bgm: '/path/to/bgm.mp3',
        audio: '/path/to/audio.mp3',
      };

      await expect(command.execute(options)).rejects.toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: BGMファイルが見つかりません: /path/to/bgm.mp3',
      );
    });

    it('should handle non-MP3 BGM file', async () => {
      const options = {
        bgm: '/path/to/bgm.wav',
        audio: '/path/to/audio.mp3',
      };

      await expect(command.execute(options)).rejects.toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: BGMファイルはMP3形式である必要があります',
      );
    });

    it('should handle invalid BGM volume', async () => {
      const options = {
        bgm: '/path/to/bgm.mp3',
        audio: '/path/to/audio.mp3',
        bgmVolume: 1.5,
      };

      await expect(command.execute(options)).rejects.toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalledWith('エラー: BGM音量は0から1の間で指定してください');
    });

    it('should handle invalid ducking value', async () => {
      const options = {
        bgm: '/path/to/bgm.mp3',
        audio: '/path/to/audio.mp3',
        ducking: -0.1,
      };

      await expect(command.execute(options)).rejects.toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: ダッキング音量は0から1の間で指定してください',
      );
    });

    it('should handle negative fade-in time', async () => {
      const options = {
        bgm: '/path/to/bgm.mp3',
        audio: '/path/to/audio.mp3',
        fadeIn: -1,
      };

      await expect(command.execute(options)).rejects.toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'エラー: フェードイン時間は0以上で指定してください',
      );
    });

    it('should handle FFmpeg service errors', async () => {
      addBackgroundMusicMock.mockRejectedValue(new Error('FFmpeg error'));

      const options = {
        bgm: '/path/to/bgm.mp3',
        audio: '/path/to/audio.mp3',
      };

      await expect(command.execute(options)).rejects.toThrow('process.exit');
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ BGMの追加に失敗しました');
      expect(consoleErrorSpy).toHaveBeenCalledWith('エラー: FFmpeg error');
    });
  });
});
