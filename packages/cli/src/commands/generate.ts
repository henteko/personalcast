import { PersonalCast, CLIGenerationOptions } from '../PersonalCast';
import { 
  validateInputPath,
  validateProgramType,
  validatePraiseStyle,
  validateDuration,
  validateOutputPath,
  validateEnvironmentVariables,
  validateBgmPath,
} from '@personalcast/core';

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

    // Create PersonalCast instance
    const personalCast = new PersonalCast();

    // Create generation options
    const generationOptions: CLIGenerationOptions = {
      outputPath: options.output,
      style: options.style as 'analytical' | 'comprehensive',
      duration: parseInt(options.duration),
      voiceSpeed: options.voiceSpeed,
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

    // Generate using PersonalCast
    await personalCast.generateFromFileWithCLIProgress(options.input, generationOptions);

  } catch (error) {
    console.error('❌ エラー:', error instanceof Error ? error.message : '不明なエラーが発生しました');
    process.exit(1);
  }
}
