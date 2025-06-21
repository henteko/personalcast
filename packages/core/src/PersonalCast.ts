import { MemoParser } from './parser/MemoParser';
import { ScriptGenerator } from './generator/ScriptGenerator';
import { GeminiVoiceGenerator } from './voice/GeminiVoiceGenerator';
import { AudioMixer } from './mixer/AudioMixer';
import { FFmpegService } from './services/ffmpeg/FFmpegService';
import {
  RadioScript,
  AnalysisStyle,
  ParsedMemo,
  AudioBuffer,
} from './types';
import * as fs from 'fs/promises';

export class PersonalCast {
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
   * Parse memo file
   */
  async parseMemoFile(filePath: string): Promise<ParsedMemo> {
    return await this.memoParser.parseTextFile(filePath);
  }

  /**
   * Generate script from parsed memo
   */
  async generateScriptFromMemo(
    memo: ParsedMemo,
    options: { style?: AnalysisStyle; duration?: number }
  ): Promise<RadioScript> {
    return await this.scriptGenerator.generateScript(memo, options);
  }

  /**
   * Generate speech from script
   */
  async generateSpeechFromScript(
    script: RadioScript,
    options: { speed?: number }
  ): Promise<AudioBuffer[]> {
    return await this.voiceGenerator.generateSpeech(script, options);
  }

  /**
   * Combine audio buffers
   */
  async combineAudioBuffers(audioBuffers: AudioBuffer[]): Promise<Buffer> {
    return await this.audioMixer.combineAudio(audioBuffers);
  }

  /**
   * Normalize audio volume
   */
  async normalizeAudioVolume(audio: Buffer): Promise<Buffer> {
    return await this.audioMixer.normalizeVolume(audio);
  }

  /**
   * Export audio to MP3
   */
  async exportAudioToMP3(audio: Buffer, outputPath: string): Promise<void> {
    await this.audioMixer.exportToMP3(audio, outputPath);
  }

  /**
   * Add BGM to audio file
   */
  async addBGMToAudio(
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
    }
  ): Promise<string> {
    const tempOutput = (options.output || audioPath).replace('.mp3', '_temp_bgm.mp3');
    
    await this.ffmpegService.addBackgroundMusic(audioPath, bgmPath, {
      output: tempOutput,
      bgmVolume: options.bgmVolume,
      ducking: options.ducking,
      fadeIn: options.fadeIn,
      fadeOut: options.fadeOut,
      intro: options.intro,
      outro: options.outro,
    });

    // If overwriting original, rename temp file
    if (!options.output || options.output === audioPath) {
      await fs.rename(tempOutput, audioPath);
      return audioPath;
    }

    return tempOutput;
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

}
