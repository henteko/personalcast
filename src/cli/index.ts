#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/generate';
import { previewCommand } from './commands/preview';
import { initCommand } from './commands/init';

const program = new Command();

program
  .name('cheercast')
  .description(
    '毎日のメモから2人のパーソナリティがあなたの頑張りを褒めてくれるラジオ番組を自動生成',
  )
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .description('メモファイルからラジオ番組を生成')
  .requiredOption('-i, --input <path>', '入力ファイルまたはディレクトリのパス')
  .option(
    '-o, --output <path>',
    '出力ファイル名',
    `radio_${new Date().toISOString().split('T')[0]}.mp3`,
  )
  .option('-t, --type <type>', '番組タイプ (daily|weekly)', 'daily')
  .option('-s, --style <style>', '褒めスタイル (gentle|energetic)', 'gentle')
  .option('-d, --duration <minutes>', '番組の長さ（分）', '10')
  .action(generateCommand);

// Preview command
program
  .command('preview')
  .description('台本のプレビューを表示（音声生成なし）')
  .requiredOption('-i, --input <path>', '入力ファイルまたはディレクトリのパス')
  .option('-t, --type <type>', '番組タイプ (daily|weekly)', 'daily')
  .option('-s, --style <style>', '褒めスタイル (gentle|energetic)', 'gentle')
  .action(previewCommand);

// Init command
program.command('init').description('CheerCastの初期設定を行う').action(initCommand);

// Parse command line arguments
program.parse(process.argv);
