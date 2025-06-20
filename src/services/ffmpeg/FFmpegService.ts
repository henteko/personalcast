import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs/promises';
import { AudioBuffer } from '../../types';

export interface ConcatOptions {
  outputPath: string;
  format?: string;
}

export interface MixOptions {
  outputPath: string;
  format?: string;
}

export interface NormalizeOptions {
  targetLoudness?: number; // in LUFS
  peakNormalization?: boolean;
}

export class FFmpegService {
  private tempDir: string;

  constructor(tempDir = '/tmp/cheercast') {
    this.tempDir = tempDir;
  }

  async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create temp directory: ${String(error)}`);
    }
  }

  async concatenateAudio(audioBuffers: AudioBuffer[], options: ConcatOptions): Promise<string> {
    await this.ensureTempDir();

    if (audioBuffers.length === 0) {
      throw new Error('No audio buffers to concatenate');
    }

    // If only one buffer, convert from PCM to MP3
    if (audioBuffers.length === 1) {
      const tempPath = path.join(this.tempDir, `pcm_${Date.now()}.raw`);
      await fs.writeFile(tempPath, audioBuffers[0].data);

      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(tempPath)
            .inputOptions([
              '-f',
              's16le', // 16-bit signed little-endian PCM
              '-ar',
              '24000', // Sample rate 24kHz
              '-ac',
              '1', // Mono audio
            ])
            .audioCodec('libmp3lame')
            .audioBitrate('192k')
            .output(options.outputPath)
            .on('end', () => resolve())
            .on('error', (err: Error) => reject(err))
            .run();
        });

        await this.cleanupTempFiles([tempPath]);
        return options.outputPath;
      } catch (error) {
        await this.cleanupTempFiles([tempPath]);
        throw new Error(`Failed to convert PCM to MP3: ${String(error)}`);
      }
    }

    // Save audio buffers as temporary files with unique names
    const tempFiles: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < audioBuffers.length; i++) {
      const pcmPath = path.join(this.tempDir, `pcm_${timestamp}_${i}.raw`);
      const mp3Path = path.join(this.tempDir, `audio_${timestamp}_${i}.mp3`);
      await fs.writeFile(pcmPath, audioBuffers[i].data);

      // Convert PCM to MP3
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(pcmPath)
          .inputOptions([
            '-f',
            's16le', // 16-bit signed little-endian PCM
            '-ar',
            '24000', // Sample rate 24kHz
            '-ac',
            '1', // Mono audio
          ])
          .audioCodec('libmp3lame')
          .audioBitrate('192k')
          .output(mp3Path)
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
          .run();
      });

      await this.cleanupTempFiles([pcmPath]);
      tempFiles.push(mp3Path);
    }

    // Create concat list file with proper formatting
    const listPath = path.join(this.tempDir, `concat_list_${timestamp}.txt`);
    const listContent = tempFiles
      .map(
        (file) => `file '${file.replace(/'/g, "'\\''")}'
`,
      )
      .join('');
    await fs.writeFile(listPath, listContent, 'utf8');

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(listPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .audioCodec('libmp3lame')
          .audioBitrate('192k')
          .output(options.outputPath)
          .outputOptions(['-y']) // Overwrite output file
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
          .run();
      });

      // Cleanup temp files
      await this.cleanupTempFiles([...tempFiles, listPath]);

      return options.outputPath;
    } catch (error) {
      // Cleanup on error
      await this.cleanupTempFiles([...tempFiles, listPath]);
      throw new Error(`Failed to concatenate audio: ${String(error)}`);
    }
  }

  async normalizeAudio(
    inputPath: string,
    outputPath: string,
    options?: NormalizeOptions,
  ): Promise<string> {
    const targetLoudness = options?.targetLoudness ?? -16; // Default -16 LUFS

    try {
      // First pass: analyze audio
      const loudnessData = await this.analyzeLoudness(inputPath);

      // Calculate normalization parameters
      const loudnessDiff = targetLoudness - loudnessData.integrated;

      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg()
          .input(inputPath)
          .audioFilters([
            `volume=${loudnessDiff}dB`,
            'loudnorm=I=-16:TP=-1.5:LRA=11', // EBU R128 normalization
          ])
          .audioCodec('libmp3lame')
          .audioBitrate('192k')
          .output(outputPath);

        command
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
          .run();
      });

      return outputPath;
    } catch (error) {
      throw new Error(`Failed to normalize audio: ${String(error)}`);
    }
  }

  async analyzeLoudness(
    audioPath: string,
  ): Promise<{ integrated: number; range: number; peak: number }> {
    return new Promise((resolve, reject) => {
      let loudnessData = '';

      ffmpeg(audioPath)
        .audioFilters('ebur128=peak=true')
        .format('null')
        .output('-')
        .on('stderr', (stderrLine: string) => {
          loudnessData += stderrLine;
        })
        .on('end', () => {
          // Parse loudness data from ffmpeg output
          const integratedMatch = loudnessData.match(/I:\s+([-\d.]+)\s+LUFS/);
          const rangeMatch = loudnessData.match(/LRA:\s+([-\d.]+)\s+LU/);
          const peakMatch = loudnessData.match(/Peak:\s+([-\d.]+)\s+dBFS/);

          resolve({
            integrated: integratedMatch ? parseFloat(integratedMatch[1]) : -23,
            range: rangeMatch ? parseFloat(rangeMatch[1]) : 7,
            peak: peakMatch ? parseFloat(peakMatch[1]) : -1,
          });
        })
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }

  async getDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          reject(new Error(String(err)));
        } else {
          resolve(metadata.format.duration ?? 0);
        }
      });
    });
  }

  private async cleanupTempFiles(files: string[]): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        try {
          await fs.unlink(file);
        } catch {
          // Ignore cleanup errors
        }
      }),
    );
  }
}
