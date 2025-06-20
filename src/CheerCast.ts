import { MemoParser } from './core/parser/MemoParser';
import { ScriptGenerator } from './core/generator/ScriptGenerator';
import { GeminiVoiceGenerator } from './core/voice/GeminiVoiceGenerator';
import { AudioMixer } from './core/mixer/AudioMixer';
import { ParsedMemo, RadioScript, GenerationOptions, PraiseStyle } from './types';

export class CheerCast {
  private memoParser: MemoParser;
  private scriptGenerator: ScriptGenerator;
  private voiceGenerator: GeminiVoiceGenerator;
  private audioMixer: AudioMixer;

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
  }

  /**
   * Generate radio show from a single memo file
   */
  async generateFromFile(filePath: string, options: GenerationOptions): Promise<void> {
    try {
      // Parse memo
      const memo = await this.memoParser.parseFile(filePath);

      // Generate script
      const script = await this.scriptGenerator.generateScript(memo, {
        style: options.style as PraiseStyle | undefined,
        duration: options.duration,
      });

      // Generate speech
      const audioBuffers = await this.voiceGenerator.generateSpeech(script, {
        speed: options.voiceSpeed,
      });

      // Combine audio
      let finalAudio = await this.audioMixer.combineAudio(audioBuffers);

      // Normalize volume
      finalAudio = await this.audioMixer.normalizeVolume(finalAudio);

      // Export to file
      await this.audioMixer.exportToMP3(finalAudio, options.outputPath);
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
      const memos = await this.memoParser.parseDirectory(directoryPath);

      // Combine memos for weekly summary
      const combinedMemo = this.combineMemos(memos);

      // Generate script
      const script = await this.scriptGenerator.generateScript(combinedMemo, {
        style: options.style as PraiseStyle | undefined,
        duration: options.duration,
      });

      // Generate speech
      const audioBuffers = await this.voiceGenerator.generateSpeech(script, {
        speed: options.voiceSpeed,
      });

      // Combine audio
      let finalAudio = await this.audioMixer.combineAudio(audioBuffers);

      // Normalize volume
      finalAudio = await this.audioMixer.normalizeVolume(finalAudio);

      // Export to file
      await this.audioMixer.exportToMP3(finalAudio, options.outputPath);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Preview script without generating audio
   */
  async previewScript(filePath: string, options: Partial<GenerationOptions>): Promise<RadioScript> {
    const memo = await this.memoParser.parseFile(filePath);
    return this.scriptGenerator.generateScript(memo, {
      style: options.style as PraiseStyle | undefined,
      duration: options.duration,
    });
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
