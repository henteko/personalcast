#!/usr/bin/env node

import { Command } from 'commander';
import { executeGenerateCommand } from './commands/generate';
import { previewCommand } from './commands/preview';
import { initCommand } from './commands/init';
import { createAddBgmCommand } from './commands/add-bgm';

const program = new Command();

program
  .name('personalcast')
  .description(
    '毎日のメモから2人のキャスターがあなたの活動を分析・紹介するパーソナルニュース番組を自動生成',
  )
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .description('メモファイルからニュース番組を生成')
  .requiredOption('-i, --input <path>', '入力ファイルまたはディレクトリのパス')
  .option(
    '-o, --output <path>',
    '出力ファイル名',
    `news_${new Date().toISOString().split('T')[0]}.mp3`,
  )
  .option('-t, --type <type>', '番組タイプ (daily|weekly)', 'daily')
  .option('-s, --style <style>', '分析スタイル (analytical|comprehensive)', 'analytical')
  .option('-d, --duration <minutes>', '番組の長さ（分）', '10')
  .option('-b, --bgm <path>', 'BGMファイルのパス')
  .option('--bgm-volume <number>', 'BGMの基本音量 (0-1)', parseFloat)
  .option('--ducking <number>', '音声時のBGM音量低下率 (0-1)', parseFloat)
  .option('--fade-in <seconds>', 'BGMフェードイン時間', parseFloat)
  .option('--fade-out <seconds>', 'BGMフェードアウト時間', parseFloat)
  .option('--intro <seconds>', 'BGMのみの導入時間', parseFloat)
  .option('--outro <seconds>', 'BGMのみの終了時間', parseFloat)
  .action(executeGenerateCommand);

// Preview command
program
  .command('preview')
  .description('台本のプレビューを表示（音声生成なし）')
  .requiredOption('-i, --input <path>', '入力ファイルまたはディレクトリのパス')
  .option('-t, --type <type>', '番組タイプ (daily|weekly)', 'daily')
  .option('-s, --style <style>', '分析スタイル (analytical|comprehensive)', 'analytical')
  .action(previewCommand);

// Init command
program.command('init').description('PersonalCastの初期設定を行う').action(initCommand);

// Add BGM command
program.addCommand(createAddBgmCommand());

// Parse command line arguments
program.parse(process.argv);
