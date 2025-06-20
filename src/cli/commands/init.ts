import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';

const DEFAULT_CONFIG = {
  personalities: {
    host1: {
      name: 'あかり',
      voiceName: 'ja-JP-Wavenet-A',
      character: '優しくて励まし上手',
    },
    host2: {
      name: 'けんた',
      voiceName: 'ja-JP-Wavenet-C',
      character: '明るくて分析好き',
    },
  },
  praise: {
    style: 'gentle',
    focusAreas: ['work', 'learning', 'health'],
  },
  audio: {
    duration: 10,
    bgm: true,
    speed: 1.0,
  },
  gemini: {
    model: 'gemini-1.5-pro',
    temperature: 0.7,
  },
};

export async function initCommand(): Promise<void> {
  console.log('🎙️  CheerCast 初期設定ウィザード');
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
    const configPath = path.join(process.cwd(), 'cheercast.config.json');

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
    const envContent = `# Google Cloud設定
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEYFILE=path/to/keyfile.json

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# オプション設定
DEFAULT_DURATION=10
DEFAULT_STYLE=gentle
BGM_ENABLED=true`;

    await fs.writeFile(envExamplePath, envContent);
    console.log('✅ .env.example を作成しました');

    // Create config file
    await fs.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    console.log('✅ cheercast.config.json を作成しました');

    // Create sample memo
    const sampleMemoPath = path.join(process.cwd(), 'sample_memo.txt');
    const sampleMemo = `2024-01-20 の日記

今日は新しいプロジェクトの設計を完了させた。
午前中は要件定義の見直しに時間をかけて、より良い設計ができたと思う。

午後からはコーディングを開始。TypeScriptの型定義で少し悩んだけど、
ドキュメントを読んで解決できた。

夕方には30分のウォーキングも達成！
明日も頑張ろう。`;

    await fs.writeFile(sampleMemoPath, sampleMemo);
    console.log('✅ sample_memo.txt を作成しました');

    console.log();
    console.log('📋 次のステップ:');
    console.log('1. .env ファイルを作成し、APIキーを設定してください');
    console.log('   cp .env.example .env');
    console.log('2. Google Cloud と Gemini API のキーを取得してください');
    console.log('3. cheercast generate -i sample_memo.txt でテスト実行できます');
    console.log();
    console.log('詳細は README.md をご覧ください。');

    rl.close();
  } catch (error) {
    console.error(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    rl.close();
    process.exit(1);
  }
}
