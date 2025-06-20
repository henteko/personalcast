#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// CLIファイルのパス
const cliPath = path.join(__dirname, '..', 'dist', 'src', 'cli', 'index.js');

// ファイルが存在するか確認
if (fs.existsSync(cliPath)) {
  // 実行権限を付与 (755 = rwxr-xr-x)
  fs.chmodSync(cliPath, '755');
  console.log('✅ CLIファイルに実行権限を付与しました:', cliPath);
} else {
  console.error('❌ CLIファイルが見つかりません:', cliPath);
  process.exit(1);
}