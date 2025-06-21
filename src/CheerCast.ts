import { MemoParser } from './core/parser/MemoParser';
import { ScriptGenerator } from './core/generator/ScriptGenerator';
import { GeminiVoiceGenerator } from './core/voice/GeminiVoiceGenerator';
import { AudioMixer } from './core/mixer/AudioMixer';
import { FFmpegService } from './services/ffmpeg/FFmpegService';
import { ParsedMemo, RadioScript, GenerationOptions, AnalysisStyle } from './types';
import * as fs from 'fs/promises';

export class CheerCast {
  private memoParser: MemoParser;
  private scriptGenerator: ScriptGenerator;
  private voiceGenerator: GeminiVoiceGenerator;
  private audioMixer: AudioMixer;
  private ffmpegService: FFmpegService;

  constructor() {
    this.memoParser = new MemoParser();

    // Initialize with Gemini API
    this.scriptGenerator = new ScriptGenerator({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    });

    // Use Gemini TTS
    this.voiceGenerator = new GeminiVoiceGenerator({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.audioMixer = new AudioMixer();
    this.ffmpegService = new FFmpegService();
  }

  /**
   * Generate radio show from a single memo file
   */
  async generateFromFile(filePath: string, options: GenerationOptions): Promise<void> {
    try {
      // Parse memo
      options.onProgress?.('メモファイルを解析中...');
      const memo = await this.memoParser.parseTextFile(filePath);

      // Generate script
      options.onProgress?.('ニュース台本を生成中...');
      const script = await this.scriptGenerator.generateScript(memo, {
        style: options.style as AnalysisStyle | undefined,
        duration: options.duration,
      });

      // Generate speech
      options.onProgress?.('音声を生成中...');
      const audioBuffers = await this.voiceGenerator.generateSpeech(script, {
        speed: options.voiceSpeed,
      });

      // Combine audio
      options.onProgress?.('音声を結合中...');
      let finalAudio = await this.audioMixer.combineAudio(audioBuffers);

      // Normalize volume
      options.onProgress?.('音声を正規化してエクスポート中...');
      finalAudio = await this.audioMixer.normalizeVolume(finalAudio);

      // Export to file
      await this.audioMixer.exportToMP3(finalAudio, options.outputPath);

      // Add BGM if specified
      if (options.bgm) {
        options.onProgress?.('BGMを追加中...');
        // Create temporary output file to avoid FFmpeg in-place editing error
        const tempOutput = options.outputPath.replace('.mp3', '_temp_bgm.mp3');

        await this.ffmpegService.addBackgroundMusic(options.outputPath, options.bgm.path, {
          output: tempOutput,
          bgmVolume: options.bgm.volume,
          ducking: options.bgm.ducking,
          fadeIn: options.bgm.fadeIn,
          fadeOut: options.bgm.fadeOut,
          intro: options.bgm.intro,
          outro: options.bgm.outro,
        });

        // Replace original file with BGM version
        await fs.rename(tempOutput, options.outputPath);
        options.onProgress?.('BGMの追加が完了しました');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate weekly summary from multiple memo files
   */
  async generateFromDirectory(directoryPath: string, options: GenerationOptions): Promise<void> {
    try {
      // Parse all memos in directory
      options.onProgress?.('メモファイルを解析中...');
      const memos = await this.memoParser.parseDirectory(directoryPath);

      // Combine memos for weekly summary
      const combinedMemo = this.combineMemos(memos);

      // Generate script
      options.onProgress?.('ニュース台本を生成中...');
      const script = await this.scriptGenerator.generateScript(combinedMemo, {
        style: options.style as AnalysisStyle | undefined,
        duration: options.duration,
      });

      // Generate speech
      options.onProgress?.('音声を生成中...');
      const audioBuffers = await this.voiceGenerator.generateSpeech(script, {
        speed: options.voiceSpeed,
      });

      // Combine audio
      options.onProgress?.('音声を結合中...');
      let finalAudio = await this.audioMixer.combineAudio(audioBuffers);

      // Normalize volume
      options.onProgress?.('音声を正規化してエクスポート中...');
      finalAudio = await this.audioMixer.normalizeVolume(finalAudio);

      // Export to file
      await this.audioMixer.exportToMP3(finalAudio, options.outputPath);

      // Add BGM if specified
      if (options.bgm) {
        options.onProgress?.('BGMを追加中...');
        // Create temporary output file to avoid FFmpeg in-place editing error
        const tempOutput = options.outputPath.replace('.mp3', '_temp_bgm.mp3');

        await this.ffmpegService.addBackgroundMusic(options.outputPath, options.bgm.path, {
          output: tempOutput,
          bgmVolume: options.bgm.volume,
          ducking: options.bgm.ducking,
          fadeIn: options.bgm.fadeIn,
          fadeOut: options.bgm.fadeOut,
          intro: options.bgm.intro,
          outro: options.bgm.outro,
        });

        // Replace original file with BGM version
        await fs.rename(tempOutput, options.outputPath);
        options.onProgress?.('BGMの追加が完了しました');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Preview script without generating audio
   */
  async previewScript(filePath: string, options: Partial<GenerationOptions>): Promise<RadioScript> {
    options.onProgress?.('メモファイルを解析中...');
    const memo = await this.memoParser.parseTextFile(filePath);

    options.onProgress?.('ラジオ台本を生成中...');
    return this.scriptGenerator.generateScript(memo, {
      style: options.style as AnalysisStyle | undefined,
      duration: options.duration,
    });
  }

  /**
   * Preview weekly script without generating audio
   */
  async previewWeeklyScript(
    directoryPath: string,
    options: Partial<GenerationOptions>,
  ): Promise<RadioScript> {
    options.onProgress?.('メモファイルを解析中...');
    const memos = await this.memoParser.parseDirectory(directoryPath);
    const combinedMemo = this.combineMemos(memos);

    options.onProgress?.('ラジオ台本を生成中...');
    return this.scriptGenerator.generateScript(combinedMemo, {
      style: options.style as AnalysisStyle | undefined,
      duration: options.duration,
    });
  }

  /**
   * Add background music to existing audio file
   */
  async addBackgroundMusic(
    audioPath: string,
    bgmPath: string,
    options: {
      output?: string;
      bgmVolume?: number;
      ducking?: number;
      fadeIn?: number;
      fadeOut?: number;
      intro?: number;
      outro?: number;
      onProgress?: (message: string) => void;
    },
  ): Promise<string> {
    try {
      options.onProgress?.('BGMを処理中...');

      // Create temporary output file to avoid FFmpeg in-place editing error
      const tempOutput = (options.output ?? audioPath).replace('.mp3', '_temp_bgm.mp3');

      const outputPath = await this.ffmpegService.addBackgroundMusic(audioPath, bgmPath, {
        output: tempOutput,
        bgmVolume: options.bgmVolume,
        ducking: options.ducking,
        fadeIn: options.fadeIn,
        fadeOut: options.fadeOut,
        intro: options.intro,
        outro: options.outro,
      });

      // If we're overwriting the original file, rename the temp file
      if (!options.output || options.output === audioPath) {
        await fs.rename(tempOutput, audioPath);
        return audioPath;
      }

      return outputPath;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Combine multiple memos into one for weekly summary
   */
  private combineMemos(memos: ParsedMemo[]): ParsedMemo {
    // Sort by date
    const sortedMemos = memos.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Get date range
    const startDate = sortedMemos[0]?.date || new Date();
    const endDate = sortedMemos[sortedMemos.length - 1]?.date || new Date();

    // Combine all activities
    const allActivities = sortedMemos.flatMap((memo) => memo.activities);

    // Combine all positive elements
    const allPositiveElements = sortedMemos.flatMap((memo) => memo.positiveElements);

    return {
      date: endDate,
      dateRange: { start: startDate, end: endDate },
      activities: allActivities,
      positiveElements: [...new Set(allPositiveElements)], // Remove duplicates
      summary: `${startDate.toLocaleDateString('ja-JP')} から ${endDate.toLocaleDateString('ja-JP')} までの活動`,
    };
  }
}
