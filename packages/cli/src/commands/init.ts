import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';

const DEFAULT_CONFIG = {
  radioShowName: "Today's You",
  personalities: {
    host1: {
      name: 'あかり',
      voiceName: 'Zephyr',
      character: '冷静で分析的なメインキャスター',
    },
    host2: {
      name: 'けんた',
      voiceName: 'Charon',
      character: '洞察力のあるコメンテーター',
    },
  },
  praise: {
    style: 'analytical',
    focusAreas: ['work', 'learning', 'health'],
  },
  audio: {
    duration: 10,
    speed: 1.0,
  },
  gemini: {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
  },
};

export async function initCommand(): Promise<void> {
  console.log('🎙️  PersonalCast 初期設定ウィザード');
  console.log('='.repeat(50));
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  };

  try {
    // Check for existing config
    const configPath = path.join(process.cwd(), 'personalcast.config.json');

    try {
      await fs.access(configPath);
      const overwrite = await question(
        '既存の設定ファイルが見つかりました。上書きしますか？ (y/N): ',
      );
      if (overwrite.toLowerCase() !== 'y') {
        console.log('設定を中止しました。');
        rl.close();
        return;
      }
    } catch {
      // No existing config
    }

    // Create .env.example if it doesn't exist
    const envExamplePath = path.join(process.cwd(), '.env.example');
    const envContent = `# Gemini API設定（必須）
GEMINI_API_KEY=your-gemini-api-key

# オプション設定
DEFAULT_DURATION=10
DEFAULT_STYLE=analytical`;

    await fs.writeFile(envExamplePath, envContent);
    console.log('✅ .env.example を作成しました');

    // Create config file
    await fs.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    console.log('✅ personalcast.config.json を作成しました');

    // Create sample memo
    const sampleMemoPath = path.join(process.cwd(), 'sample_memo.txt');
    const sampleMemo = `2024-01-20 の活動記録

【業務活動】
- 新規プロジェクトの要件定義レビューを完了
- 設計ドキュメントを作成し、チームで共有
- TypeScriptでの実装を開始（進捗: 約30%）
- コードレビューを2件実施

【学習・研究】
- TypeScriptの高度な型システムについて学習（2時間）
- 技術記事を3本読了（テーマ: マイクロサービス、CI/CD、クリーンアーキテクチャ）

【健康・運動】
- 昼休みに30分のウォーキングを実施
- 歩数: 7,250歩

【本日の成果】
- 重要タスクの完了率: 100%
- 新たに習得したスキル: TypeScriptの条件型
- 継続的な取り組み: 毎日のウォーキング（5日連続達成）`;

    await fs.writeFile(sampleMemoPath, sampleMemo);
    console.log('✅ sample_memo.txt を作成しました');

    console.log();
    console.log('📋 次のステップ:');
    console.log('1. .env ファイルを作成し、Gemini APIキーを設定してください');
    console.log('   cp .env.example .env');
    console.log('2. Gemini APIキーを取得してください');
    console.log('   https://aistudio.google.com/app/apikey');
    console.log('3. personalcast generate -i sample_memo.txt でテスト実行できます');
    console.log();
    console.log('詳細は README.md をご覧ください。');

    rl.close();
  } catch (error) {
    console.error(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    rl.close();
    process.exit(1);
  }
}
