import { FFmpegService } from '../../services/ffmpeg';
import { AudioBuffer } from '../../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class AudioMixer {
  private ffmpegService: FFmpegService;
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'cheercast');
    this.ffmpegService = new FFmpegService(this.tempDir);
  }

  async combineAudio(audioBuffers: AudioBuffer[]): Promise<Buffer> {
    if (audioBuffers.length === 0) {
      throw new Error('No audio buffers to combine');
    }

    const outputPath = path.join(this.tempDir, `combined_${Date.now()}.mp3`);

    try {
      await this.ffmpegService.concatenateAudio(audioBuffers, {
        outputPath,
        format: 'mp3',
      });

      const combinedAudio = await fs.readFile(outputPath);

      // Cleanup temp file
      await this.cleanupFile(outputPath);

      return combinedAudio;
    } catch (error) {
      await this.cleanupFile(outputPath);
      throw new Error(
        `Failed to combine audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async addBackgroundMusic(audio: Buffer, bgmPath: string, bgmVolume = 0.15): Promise<Buffer> {
    const inputPath = path.join(this.tempDir, `input_${Date.now()}.mp3`);
    const outputPath = path.join(this.tempDir, `with_bgm_${Date.now()}.mp3`);

    try {
      // Write input audio to temp file
      await fs.writeFile(inputPath, audio);

      await this.ffmpegService.mixWithBGM(inputPath, {
        outputPath,
        bgmPath,
        bgmVolume,
        format: 'mp3',
      });

      const result = await fs.readFile(outputPath);

      // Cleanup temp files
      await this.cleanupFile(inputPath);
      await this.cleanupFile(outputPath);

      return result;
    } catch (error) {
      await this.cleanupFile(inputPath);
      await this.cleanupFile(outputPath);
      throw new Error(
        `Failed to add background music: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async normalizeVolume(audio: Buffer, targetLoudness = -16): Promise<Buffer> {
    const inputPath = path.join(this.tempDir, `input_${Date.now()}.mp3`);
    const outputPath = path.join(this.tempDir, `normalized_${Date.now()}.mp3`);

    try {
      // Write input audio to temp file
      await fs.writeFile(inputPath, audio);

      await this.ffmpegService.normalizeAudio(inputPath, outputPath, {
        targetLoudness,
        peakNormalization: true,
      });

      const result = await fs.readFile(outputPath);

      // Cleanup temp files
      await this.cleanupFile(inputPath);
      await this.cleanupFile(outputPath);

      return result;
    } catch (error) {
      await this.cleanupFile(inputPath);
      await this.cleanupFile(outputPath);
      throw new Error(
        `Failed to normalize volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async exportToMP3(audio: Buffer, outputPath: string): Promise<void> {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Write the audio buffer to the output file
      await fs.writeFile(outputPath, audio);
    } catch (error) {
      throw new Error(
        `Failed to export audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
