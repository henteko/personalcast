import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AudioMixer } from '../AudioMixer';
import { FFmpegService } from '../../../services/ffmpeg';
import { AudioBuffer } from '../../../types';
import * as fs from 'fs/promises';

jest.mock('../../../services/ffmpeg');
jest.mock('fs/promises');

describe('AudioMixer', () => {
  let mixer: AudioMixer;
  let mockFFmpegService: jest.Mocked<FFmpegService>;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFFmpegService = new FFmpegService() as jest.Mocked<FFmpegService>;
    mockFs = fs as jest.Mocked<typeof fs>;
    mixer = new AudioMixer();
    // @ts-expect-error - Accessing private property for testing
    mixer.ffmpegService = mockFFmpegService;
  });

  describe('combineAudio', () => {
    it('should combine multiple audio buffers into one', async () => {
      const audioBuffers: AudioBuffer[] = [
        { data: Buffer.from('audio1'), duration: 2.0 },
        { data: Buffer.from('audio2'), duration: 3.0 },
        { data: Buffer.from('audio3'), duration: 1.5 },
      ];

      const mockCombinedPath = '/tmp/combined.mp3';
      mockFFmpegService.concatenateAudio.mockResolvedValue(mockCombinedPath);
      mockFs.readFile.mockResolvedValue(Buffer.from('combined audio'));

      const result = await mixer.combineAudio(audioBuffers);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockFFmpegService.concatenateAudio).toHaveBeenCalledWith(
        audioBuffers,
        expect.objectContaining({
          outputPath: expect.stringContaining('.mp3'),
        }),
      );
      expect(result).toEqual(Buffer.from('combined audio'));
    });

    it('should handle empty audio buffers array', async () => {
      await expect(mixer.combineAudio([])).rejects.toThrow('No audio buffers to combine');
    });
  });

  describe('addBackgroundMusic', () => {
    it('should add background music to audio', async () => {
      const mainAudio = Buffer.from('main audio');
      const bgmPath = '/path/to/bgm.mp3';
      const mockOutputPath = '/tmp/with_bgm.mp3';

      mockFFmpegService.mixWithBGM.mockResolvedValue(mockOutputPath);
      mockFs.readFile.mockResolvedValue(Buffer.from('audio with bgm'));

      const result = await mixer.addBackgroundMusic(mainAudio, bgmPath);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockFFmpegService.mixWithBGM).toHaveBeenCalled();
      expect(result).toEqual(Buffer.from('audio with bgm'));
    });

    it('should use default BGM volume if not specified', async () => {
      const mainAudio = Buffer.from('main audio');
      const bgmPath = '/path/to/bgm.mp3';

      mockFFmpegService.mixWithBGM.mockResolvedValue('/tmp/output.mp3');
      mockFs.readFile.mockResolvedValue(Buffer.from('result'));

      await mixer.addBackgroundMusic(mainAudio, bgmPath);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockFFmpegService.mixWithBGM).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bgmPath,
          bgmVolume: 0.15, // Default volume
        }),
      );
    });

    it('should allow custom BGM volume', async () => {
      const mainAudio = Buffer.from('main audio');
      const bgmPath = '/path/to/bgm.mp3';
      const customVolume = 0.3;

      mockFFmpegService.mixWithBGM.mockResolvedValue('/tmp/output.mp3');
      mockFs.readFile.mockResolvedValue(Buffer.from('result'));

      await mixer.addBackgroundMusic(mainAudio, bgmPath, customVolume);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockFFmpegService.mixWithBGM).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bgmVolume: customVolume,
        }),
      );
    });
  });

  describe('normalizeVolume', () => {
    it('should normalize audio volume', async () => {
      const audio = Buffer.from('audio data');
      const mockNormalizedPath = '/tmp/normalized.mp3';

      mockFFmpegService.normalizeAudio.mockResolvedValue(mockNormalizedPath);
      mockFs.readFile.mockResolvedValue(Buffer.from('normalized audio'));

      const result = await mixer.normalizeVolume(audio);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockFFmpegService.normalizeAudio).toHaveBeenCalled();
      expect(result).toEqual(Buffer.from('normalized audio'));
    });

    it('should use default loudness target', async () => {
      const audio = Buffer.from('audio');

      mockFFmpegService.normalizeAudio.mockResolvedValue('/tmp/normalized.mp3');
      mockFs.readFile.mockResolvedValue(Buffer.from('result'));

      await mixer.normalizeVolume(audio);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockFFmpegService.normalizeAudio).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          targetLoudness: -16, // Default LUFS
        }),
      );
    });
  });

  describe('exportToMP3', () => {
    it('should export audio buffer to MP3 file', async () => {
      const audio = Buffer.from('final audio');
      const outputPath = '/output/radio.mp3';

      mockFs.writeFile.mockResolvedValue(undefined);

      await mixer.exportToMP3(audio, outputPath);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockFs.writeFile).toHaveBeenCalledWith(outputPath, audio);
    });

    it('should create directory if it does not exist', async () => {
      const audio = Buffer.from('audio');
      const outputPath = '/new/dir/output.mp3';

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await mixer.exportToMP3(audio, outputPath);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockFs.mkdir).toHaveBeenCalledWith('/new/dir', { recursive: true });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockFs.writeFile).toHaveBeenCalledWith(outputPath, audio);
    });

    it('should handle write errors', async () => {
      const audio = Buffer.from('audio');
      const outputPath = '/output/radio.mp3';

      mockFs.writeFile.mockRejectedValue(new Error('Write failed'));

      await expect(mixer.exportToMP3(audio, outputPath)).rejects.toThrow('Failed to export audio');
    });
  });
});
