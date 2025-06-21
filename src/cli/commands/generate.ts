import { CheerCast } from '../../CheerCast';
import { ProgressReporter } from '../../utils';
import { GenerationOptions } from '../../types';
import {
  validateInputPath,
  validateProgramType,
  validatePraiseStyle,
  validateDuration,
  validateOutputPath,
  validateEnvironmentVariables,
  validateBgmPath,
} from '../../utils/validation';

interface GenerateOptions {
  input: string;
  output: string;
  type: string;
  style: string;
  duration: string;
  voiceSpeed?: number;
  preview?: boolean;
  bgm?: string;
  bgmVolume?: number;
  ducking?: number;
  fadeIn?: number;
  fadeOut?: number;
  intro?: number;
  outro?: number;
}

export async function executeGenerateCommand(options: GenerateOptions): Promise<void> {
  const progress = new ProgressReporter(7); // 7 steps total

  try {
    // Validate inputs
    const inputValidation = await validateInputPath(options.input);
    if (!inputValidation.valid) {
      throw new Error(inputValidation.error);
    }

    const programTypeValidation = validateProgramType(options.type);
    if (!programTypeValidation.valid) {
      throw new Error(programTypeValidation.error);
    }

    const outputValidation = await validateOutputPath(options.output);
    if (!outputValidation.valid) {
      throw new Error(outputValidation.error);
    }

    const praiseStyleValidation = validatePraiseStyle(options.style);
    if (!praiseStyleValidation.valid) {
      throw new Error(praiseStyleValidation.error);
    }

    const durationValidation = validateDuration(options.duration);
    if (!durationValidation.valid) {
      throw new Error(durationValidation.error);
    }

    const envValidation = validateEnvironmentVariables();
    if (!envValidation.valid) {
      throw new Error(envValidation.error);
    }

    // Validate BGM if provided
    if (options.bgm) {
      const bgmValidation = await validateBgmPath(options.bgm);
      if (!bgmValidation.valid) {
        throw new Error(bgmValidation.error);
      }
    }
  } catch (error) {
    progress.error(error instanceof Error ? error.message : '不明なエラーが発生しました');
    process.exit(1);
  }

  try {
    progress.start('CheerCast ラジオ番組生成を開始します...');

    // Create CheerCast instance
    const cheerCast = new CheerCast();

    // Create generation options with progress callback
    const generationOptions: GenerationOptions = {
      outputPath: options.output,
      style: options.style as 'gentle' | 'energetic',
      duration: parseInt(options.duration),
      voiceSpeed: options.voiceSpeed,
      onProgress: (message: string) => progress.update(message),
    };

    // Add BGM options if specified
    if (options.bgm) {
      generationOptions.bgm = {
        path: options.bgm,
        volume: options.bgmVolume,
        ducking: options.ducking,
        fadeIn: options.fadeIn,
        fadeOut: options.fadeOut,
        intro: options.intro,
        outro: options.outro,
      };
    }

    // Generate using CheerCast based on input type
    if (options.type === 'weekly') {
      await cheerCast.generateFromDirectory(options.input, generationOptions);
    } else {
      await cheerCast.generateFromFile(options.input, generationOptions);
    }

    progress.complete(`ラジオ番組の生成が完了しました: ${options.output}`);
  } catch (error) {
    progress.error(error instanceof Error ? error.message : '不明なエラーが発生しました');
    process.exit(1);
  }
}
