import { Command } from 'commander';
import { PersonalCast } from '../PersonalCast';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AddBgmOptions {
  bgm: string;
  audio: string;
  output?: string;
  bgmVolume?: number;
  ducking?: number;
  fadeIn?: number;
  fadeOut?: number;
  intro?: number;
  outro?: number;
}

export class AddBgmCommand {
  private personalCast: PersonalCast;

  constructor() {
    this.personalCast = new PersonalCast();
  }

  async execute(options: AddBgmOptions): Promise<void> {
    try {
      // Validate input files
      await this.validateInputs(options);

      // Set default values
      const config = this.normalizeOptions(options);

      // Add BGM using PersonalCast
      const outputPath = await this.personalCast.addBackgroundMusicWithCLI(config.audio, config.bgm, {
        output: config.output,
        bgmVolume: config.bgmVolume,
        ducking: config.ducking,
        fadeIn: config.fadeIn,
        fadeOut: config.fadeOut,
        intro: config.intro,
        outro: config.outro,
      });

      console.log('✓ BGMの追加が完了しました！');
      console.log(`✓ 出力ファイル: ${outputPath}`);
    } catch (error) {
      console.error('✗ BGMの追加に失敗しました');
      if (error instanceof Error) {
        console.error(`エラー: ${error.message}`);
      }
      process.exit(1);
    }
  }

  private async validateInputs(options: AddBgmOptions): Promise<void> {
    // Validate BGM file
    if (!options.bgm) {
      throw new Error('BGMファイルのパスを指定してください (--bgm)');
    }
    try {
      await fs.access(options.bgm);
    } catch {
      throw new Error(`BGMファイルが見つかりません: ${options.bgm}`);
    }

    // Check if BGM is MP3
    if (!options.bgm.toLowerCase().endsWith('.mp3')) {
      throw new Error('BGMファイルはMP3形式である必要があります');
    }

    // Validate audio file
    if (!options.audio) {
      throw new Error('音声ファイルのパスを指定してください (--audio)');
    }
    try {
      await fs.access(options.audio);
    } catch {
      throw new Error(`音声ファイルが見つかりません: ${options.audio}`);
    }

    // Check if audio is MP3
    if (!options.audio.toLowerCase().endsWith('.mp3')) {
      throw new Error('音声ファイルはMP3形式である必要があります');
    }

    // Validate numeric options
    if (options.bgmVolume !== undefined) {
      if (options.bgmVolume < 0 || options.bgmVolume > 1) {
        throw new Error('BGM音量は0から1の間で指定してください');
      }
    }

    if (options.ducking !== undefined) {
      if (options.ducking < 0 || options.ducking > 1) {
        throw new Error('ダッキング音量は0から1の間で指定してください');
      }
    }

    if (options.fadeIn !== undefined && options.fadeIn < 0) {
      throw new Error('フェードイン時間は0以上で指定してください');
    }

    if (options.fadeOut !== undefined && options.fadeOut < 0) {
      throw new Error('フェードアウト時間は0以上で指定してください');
    }

    if (options.intro !== undefined && options.intro < 0) {
      throw new Error('イントロ時間は0以上で指定してください');
    }

    if (options.outro !== undefined && options.outro < 0) {
      throw new Error('アウトロ時間は0以上で指定してください');
    }
  }

  private normalizeOptions(options: AddBgmOptions): Required<AddBgmOptions> {
    const audioDir = path.dirname(options.audio);
    const audioName = path.basename(options.audio, '.mp3');

    return {
      bgm: options.bgm,
      audio: options.audio,
      output: options.output ?? path.join(audioDir, `${audioName}_with_bgm.mp3`),
      bgmVolume: options.bgmVolume ?? 0.3,
      ducking: options.ducking ?? 0.15,
      fadeIn: options.fadeIn ?? 3,
      fadeOut: options.fadeOut ?? 3,
      intro: options.intro ?? 3,
      outro: options.outro ?? 2,
    };
  }
}

export function createAddBgmCommand(): Command {
  const command = new Command('add-bgm');

  return command
    .description('生成された音声ファイルにBGMを追加します')
    .requiredOption('-b, --bgm <path>', 'BGMファイルのパス')
    .requiredOption('-a, --audio <path>', '音声ファイルのパス')
    .option('-o, --output <path>', '出力ファイルパス')
    .option('--bgm-volume <number>', 'BGMの基本音量 (0-1)', parseFloat)
    .option('--ducking <number>', '音声時のBGM音量低下率 (0-1)', parseFloat)
    .option('--fade-in <seconds>', 'フェードイン時間（秒）', parseFloat)
    .option('--fade-out <seconds>', 'フェードアウト時間（秒）', parseFloat)
    .option('--intro <seconds>', 'BGMのみの導入時間（秒）', parseFloat)
    .option('--outro <seconds>', 'BGMのみの終了時間（秒）', parseFloat)
    .action(async (options: AddBgmOptions) => {
      const command = new AddBgmCommand();
      await command.execute(options);
    });
}
