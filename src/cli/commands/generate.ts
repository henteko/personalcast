import { MemoParser } from '../../core/parser';
import { ScriptGenerator } from '../../core/generator';
import { VoiceGenerator } from '../../core/voice';
import { AudioMixer } from '../../core/mixer';
import { ProgressReporter } from '../../utils';
import { PraiseStyle } from '../../types';
import {
  validateInputPath,
  validateProgramType,
  validatePraiseStyle,
  validateDuration,
  validateBGMVolume,
  validateOutputPath,
  validateEnvironmentVariables,
} from '../../utils/validation';

interface GenerateOptions {
  input: string;
  output: string;
  type: string;
  style: string;
  duration: string;
  bgm: boolean;
  bgmVolume: string;
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
    options.bgm ? validateBGMVolume(options.bgmVolume) : { valid: true },
    await validateOutputPath(options.output),
  ];

  const invalidValidation = validations.find((v) => !v.valid);
  if (invalidValidation) {
    console.error(`❌ ${invalidValidation.error}`);
    process.exit(1);
  }

  const progress = new ProgressReporter(6);

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
    progress.info(`${script.segments.length}セグメントの台本を生成しました`);

    // Step 3: Generate voice
    progress.update('音声を生成中...');
    const voiceGenerator = new VoiceGenerator();
    const audioBuffers = await voiceGenerator.generateSpeech(script);
    progress.info(`${audioBuffers.length}個の音声クリップを生成しました`);

    // Step 4: Combine audio
    progress.update('音声を結合中...');
    const mixer = new AudioMixer();
    let combinedAudio = await mixer.combineAudio(audioBuffers);

    // Step 5: Add BGM if enabled
    if (options.bgm) {
      progress.update('BGMを追加中...');
      const bgmPath = await findBGMFile();
      if (bgmPath) {
        combinedAudio = await mixer.addBackgroundMusic(
          combinedAudio,
          bgmPath,
          parseFloat(options.bgmVolume),
        );
      } else {
        progress.info('BGMファイルが見つかりません。BGMなしで続行します。');
      }
    }

    // Step 6: Normalize and export
    progress.update('音声を正規化してエクスポート中...');
    const normalizedAudio = await mixer.normalizeVolume(combinedAudio);
    await mixer.exportToMP3(normalizedAudio, options.output);

    progress.complete(`ラジオ番組の生成が完了しました: ${options.output}`);
  } catch (error) {
    progress.error(error instanceof Error ? error.message : '不明なエラーが発生しました');
    process.exit(1);
  }
}

function findBGMFile(): Promise<string | null> {
  // TODO: Implement BGM file search logic
  // For now, return null
  return Promise.resolve(null);
}
