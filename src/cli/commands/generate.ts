import { MemoParser } from '../../core/parser';
import { ScriptGenerator } from '../../core/generator';
import { GeminiVoiceGenerator } from '../../core/voice/GeminiVoiceGenerator';
import { AudioMixer } from '../../core/mixer';
import { ProgressReporter } from '../../utils';
import { PraiseStyle } from '../../types';
import {
  validateInputPath,
  validateProgramType,
  validatePraiseStyle,
  validateDuration,
  validateOutputPath,
  validateEnvironmentVariables,
} from '../../utils/validation';

interface GenerateOptions {
  input: string;
  output: string;
  type: string;
  style: string;
  duration: string;
}

export async function generateCommand(options: GenerateOptions): Promise<void> {
  // Validate environment variables first
  const envValidation = validateEnvironmentVariables();
  if (!envValidation.valid) {
    console.error(`❌ ${envValidation.error}`);
    process.exit(1);
  }

  // Validate all inputs
  const validations = [
    await validateInputPath(options.input),
    validateProgramType(options.type),
    validatePraiseStyle(options.style),
    validateDuration(options.duration),
    await validateOutputPath(options.output),
  ];

  const invalidValidation = validations.find((v) => !v.valid);
  if (invalidValidation) {
    console.error(`❌ ${invalidValidation.error}`);
    process.exit(1);
  }

  const progress = new ProgressReporter(5);

  try {
    progress.start('CheerCast ラジオ番組生成を開始します...');

    // Step 1: Parse memo
    progress.update('メモファイルを解析中...');
    const parser = new MemoParser();
    const memo = await parser.parseTextFile(options.input);
    progress.info(`${memo.activities.length}個の活動を検出しました`);

    // Step 2: Generate script
    progress.update('AI台本を生成中...');
    const generator = new ScriptGenerator();
    const script = await generator.generateScript(memo, {
      style: options.style as PraiseStyle,
      duration: parseInt(options.duration),
    });
    progress.info(
      `${script.segments?.length ?? script.dialogues.length}セグメントの台本を生成しました`,
    );

    // Step 3: Generate voice
    progress.update('音声を生成中...');
    progress.info('音声エンジン: Gemini 2.5 Flash TTS');

    const voiceGenerator = new GeminiVoiceGenerator({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const audioBuffers = await voiceGenerator.generateSpeech(script);
    progress.info(`${audioBuffers.length}個の音声クリップを生成しました`);

    // Step 4: Combine audio
    progress.update('音声を結合中...');
    const mixer = new AudioMixer();
    const combinedAudio = await mixer.combineAudio(audioBuffers);

    // Step 5: Normalize and export
    progress.update('音声を正規化してエクスポート中...');
    const normalizedAudio = await mixer.normalizeVolume(combinedAudio);
    await mixer.exportToMP3(normalizedAudio, options.output);

    progress.complete(`ラジオ番組の生成が完了しました: ${options.output}`);
  } catch (error) {
    progress.error(error instanceof Error ? error.message : '不明なエラーが発生しました');
    process.exit(1);
  }
}
