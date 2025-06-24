import { FFmpegService } from '../ffmpeg/FFmpegService';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';

// Mock dependencies
jest.mock('fluent-ffmpeg');
jest.mock('fs/promises');

interface MockFfmpegCommand {
  input: jest.Mock;
  inputOptions: jest.Mock;
  audioFilters: jest.Mock;
  audioCodec: jest.Mock;
  audioBitrate: jest.Mock;
  output: jest.Mock;
  outputOptions: jest.Mock;
  complexFilter: jest.Mock;
  format: jest.Mock;
  on: jest.Mock;
  run: jest.Mock;
}

describe('FFmpegService', () => {
  let service: FFmpegService;
  let mockFfmpeg: MockFfmpegCommand;
  let mockFfprobe: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.log to prevent output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    // Create mock ffmpeg command chain
    const createMockFfmpeg = (): MockFfmpegCommand => {
      const mock: MockFfmpegCommand = {
        input: jest.fn(),
        inputOptions: jest.fn(),
        audioFilters: jest.fn(),
        audioCodec: jest.fn(),
        audioBitrate: jest.fn(),
        output: jest.fn(),
        outputOptions: jest.fn(),
        complexFilter: jest.fn(),
        format: jest.fn(),
        on: jest.fn(),
        run: jest.fn(),
      };

      // Make all methods return the mock for chaining
      const mockKeys = Object.keys(mock) as Array<keyof MockFfmpegCommand>;
      mockKeys.forEach((key) => {
        if (key !== 'on') {
          const method = mock[key];
          if (typeof method.mockReturnValue === 'function') {
            method.mockReturnValue(mock);
          }
        }
      });

      mock.on.mockImplementation((event: string, callback: (err?: Error) => void) => {
        if (event === 'end') {
          // Simulate successful completion
          setTimeout(() => callback(), 0);
        }
        return mock;
      });

      return mock;
    };

    mockFfmpeg = createMockFfmpeg();

    // Mock ffmpeg constructor
    (ffmpeg as unknown as jest.Mock).mockReturnValue(mockFfmpeg);

    // Mock ffprobe
    mockFfprobe = jest.fn();
    (ffmpeg as unknown as { ffprobe: jest.Mock }).ffprobe = mockFfprobe;

    // Mock fs methods
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    service = new FFmpegService();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('addBackgroundMusic', () => {
    const audioPath = '/path/to/audio.mp3';
    const bgmPath = '/path/to/bgm.mp3';
    const outputPath = '/path/to/audio_with_bgm.mp3';

    beforeEach(() => {
      // Mock getDuration to return 60 seconds
      mockFfprobe.mockImplementation(
        (
          _path: string,
          callback: (err: Error | null, data?: { format: { duration?: number } }) => void,
        ) => {
          callback(null, { format: { duration: 60 } });
        },
      );
    });

    it('should successfully add background music with default options', async () => {
      const result = await service.addBackgroundMusic(audioPath, bgmPath);

      expect(result).toBe('/path/to/audio_with_bgm.mp3');
      expect(mockFfmpeg.input).toHaveBeenCalledWith(audioPath);
      expect(mockFfmpeg.input).toHaveBeenCalledWith(bgmPath);
      expect(mockFfmpeg.complexFilter).toHaveBeenCalled();
      expect(mockFfmpeg.outputOptions).toHaveBeenCalledWith([
        '-map',
        '[final]',
        '-acodec',
        'libmp3lame',
        '-b:a',
        '192k',
      ]);
    });

    it('should use custom options when provided', async () => {
      const result = await service.addBackgroundMusic(audioPath, bgmPath, '/custom/output.mp3');

      expect(result).toBe('/custom/output.mp3');
      expect(mockFfmpeg.output).toHaveBeenCalledWith('/custom/output.mp3');

      // Check that complex filter includes custom values
      const calls = mockFfmpeg.complexFilter.mock.calls as Array<[string]>;
      const filterCall = calls[0][0];
      expect(filterCall).toContain('volume=0.3');
      expect(filterCall).toContain('afade=t=in:st=0:d=3');
      expect(filterCall).toContain('afade=t=out:st=63:d=5');
    });

    it('should create proper filter graph for BGM mixing', async () => {
      await service.addBackgroundMusic(audioPath, bgmPath, outputPath);

      const calls = mockFfmpeg.complexFilter.mock.calls as Array<[string]>;
      const filterGraph = calls[0][0];

      // Check key components of the filter graph
      expect(filterGraph).toContain('[1:a]aloop=loop=-1:size=2e+09[bgm_loop]');
      expect(filterGraph).toContain('[bgm_loop]asplit=3[bgm1][bgm2][bgm3]');
      expect(filterGraph).toContain('[bgm1]atrim=0:3,volume=0.3,afade=t=in:st=0:d=3[bgm_intro]');
      expect(filterGraph).toContain('[bgm2]atrim=3:63,volume=0.15[bgm_main]');
      expect(filterGraph).toContain('[bgm3]atrim=63:68,volume=0.3,afade=t=out:st=63:d=5[bgm_outro]');
      expect(filterGraph).toContain('[0:a]adelay=3000[voice_delayed]');
      expect(filterGraph).toContain(
        '[voice_delayed][bgm_final]amix=inputs=2:duration=longest:dropout_transition=2[mixed]',
      );
      expect(filterGraph).toContain('[mixed]loudnorm=I=-16:TP=-1.5:LRA=11[final]');
    });

    it('should handle getDuration errors', async () => {
      mockFfprobe.mockImplementation(
        (
          _path: string,
          callback: (err: Error | null, data?: { format: { duration?: number } }) => void,
        ) => {
          callback(new Error('Failed to get duration'));
        },
      );

      await expect(service.addBackgroundMusic(audioPath, bgmPath)).rejects.toThrow(
        'Failed to add background music: Error: Error: Failed to get duration',
      );
    });

    it('should handle ffmpeg processing errors', async () => {
      mockFfmpeg.on.mockImplementation(
        (event: string, callback: (err?: Error | { percent?: number }) => void) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('FFmpeg processing failed')), 0);
          }
          return mockFfmpeg;
        },
      );

      await expect(service.addBackgroundMusic(audioPath, bgmPath)).rejects.toThrow(
        'Failed to add background music: Error: FFmpeg processing failed',
      );
    });

    it('should log progress updates', async () => {
      const processStdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

      mockFfmpeg.on.mockImplementation(
        (event: string, callback: (err?: Error | { percent?: number }) => void) => {
          if (event === 'progress') {
            callback({ percent: 50 } as { percent?: number });
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
          return mockFfmpeg;
        },
      );

      await service.addBackgroundMusic(audioPath, bgmPath);

      expect(processStdoutSpy).toHaveBeenCalledWith('\r進捗: 50%');

      processStdoutSpy.mockRestore();
    });
  });

  describe('getDuration', () => {
    it('should successfully get audio duration', async () => {
      mockFfprobe.mockImplementation(
        (
          _path: string,
          callback: (err: Error | null, data?: { format: { duration?: number } }) => void,
        ) => {
          callback(null, { format: { duration: 123.45 } });
        },
      );

      const duration = await service.getDuration('/path/to/audio.mp3');
      expect(duration).toBe(123.45);
    });

    it('should return 0 for undefined duration', async () => {
      mockFfprobe.mockImplementation(
        (
          _path: string,
          callback: (err: Error | null, data?: { format: { duration?: number } }) => void,
        ) => {
          callback(null, { format: {} });
        },
      );

      const duration = await service.getDuration('/path/to/audio.mp3');
      expect(duration).toBe(0);
    });

    it('should handle ffprobe errors', async () => {
      mockFfprobe.mockImplementation(
        (
          _path: string,
          callback: (err: Error | null, data?: { format: { duration?: number } }) => void,
        ) => {
          callback(new Error('FFprobe failed'));
        },
      );

      await expect(service.getDuration('/path/to/audio.mp3')).rejects.toThrow('FFprobe failed');
    });
  });
});
