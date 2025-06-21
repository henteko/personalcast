# CheerCast 🎙️

毎日のメモから2人のパーソナリティがあなたの頑張りを褒めてくれるラジオ番組を自動生成するCLIツール

## 🎯 概要

CheerCastは、日記やライフログから、AIが2人のパーソナリティ（あかり＆けんた）による応援ラジオ番組を自動生成します。毎日の小さな成果や努力を見つけて褒めることで、継続的なモチベーション向上を支援します。

## ✨ 特徴

- 📝 様々な形式のメモファイルに対応（.txt, .md, .json, .csv）
- 🤖 Google Gemini APIによる自然な対話台本生成
- 🎙️ Gemini 2.5 Flash Preview TTSによる高品質な音声合成
- 🎵 BGM追加機能（自動ダッキング、フェード処理対応）
- ⚡ シンプルなCLIインターフェース
- 🔄 自動リトライ機能付きのAPI呼び出し
- ✅ 入力検証とエラーハンドリング
- 📊 進捗表示機能

## 📋 必要要件

- Node.js 18以上
- npm 8以上
- FFmpeg（システムにインストール済み）
- Google Gemini API キー

### FFmpegのインストール

macOS:
```bash
brew install ffmpeg
```

Ubuntu/Debian:
```bash
sudo apt update
sudo apt install ffmpeg
```

Windows:
[公式サイト](https://ffmpeg.org/download.html)からダウンロードしてインストール

## 🚀 インストール

### 必要な環境
- Node.js 18以上
- npm 8以上
- FFmpeg（音声処理に必要）

### インストール手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/henteko/cheercast.git
cd cheercast

# 2. 依存関係のインストール
npm install

# 3. ビルド
npm run build

# 4. CLIとして実行可能にする（グローバルインストール）
npm link
```

インストール後、ターミナルで `cheercast` コマンドが使用できるようになります。

```bash
# 動作確認
cheercast --version
cheercast --help
```

## 🔧 セットアップ

### 1. Gemini API の設定

1. [Google AI Studio](https://aistudio.google.com/apikey) でAPIキーを取得
2. 取得したAPIキーを環境変数に設定

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して以下の環境変数を設定：

```
# Gemini API設定（必須）
GEMINI_API_KEY=your-gemini-api-key

# オプション設定
DEFAULT_DURATION=10
DEFAULT_STYLE=gentle
```

### 3. 初期設定

```bash
cheercast init
```

このコマンドで以下のファイルが作成されます：
- `cheercast.config.json`: パーソナリティ設定
- `.env.example`: 環境変数のテンプレート
- `sample_memo.txt`: サンプルメモファイル

## 📖 使い方

### 基本的な使用方法

```bash
# 1日のメモからラジオ番組を生成
cheercast generate -i memo.txt -o today.mp3

# ディレクトリから週間まとめを生成
cheercast generate -i ./memos -o weekly.mp3 -t weekly

# プレビューモード（台本のみ生成）
cheercast preview -i memo.txt

# エネルギッシュなスタイルで生成
cheercast generate -i memo.txt -s energetic

# BGM付きで生成
cheercast generate -i memo.txt -b bgm.mp3

# BGM付きでカスタム設定
cheercast generate -i memo.txt -b bgm.mp3 --bgm-volume 0.2 --intro 5

# ヘルプ
cheercast --help
```

### コマンドオプション

#### generate コマンド
```bash
cheercast generate [options]
```

| オプション | 説明 | デフォルト |
|----------|------|----------|
| `-i, --input <path>` | 入力ファイルまたはディレクトリ（必須） | - |
| `-o, --output <path>` | 出力ファイル名 | `radio_YYYY-MM-DD.mp3` |
| `-t, --type <type>` | 番組タイプ (`daily` または `weekly`) | `daily` |
| `-s, --style <style>` | 褒めスタイル (`gentle` または `energetic`) | `gentle` |
| `-d, --duration <minutes>` | 番組の長さ（1-60分） | `10` |
| `-b, --bgm <path>` | BGMファイルのパス（MP3形式） | - |
| `--bgm-volume <number>` | BGMの基本音量 (0-1) | `0.3` |
| `--ducking <number>` | 音声時のBGM音量低下率 (0-1) | `0.15` |
| `--fade-in <seconds>` | BGMフェードイン時間 | `3` |
| `--fade-out <seconds>` | BGMフェードアウト時間 | `3` |
| `--intro <seconds>` | BGMのみの導入時間 | `3` |
| `--outro <seconds>` | BGMのみの終了時間 | `2` |

#### preview コマンド
```bash
cheercast preview [options]
```

| オプション | 説明 | デフォルト |
|----------|------|----------|
| `-i, --input <path>` | 入力ファイルまたはディレクトリ（必須） | - |
| `-t, --type <type>` | 番組タイプ (`daily` または `weekly`) | `daily` |
| `-s, --style <style>` | 褒めスタイル (`gentle` または `energetic`) | `gentle` |

#### add-bgm コマンド
```bash
cheercast add-bgm [options]
```

生成された音声ファイルにBGMを追加します。BGMは自動的にループし、音声に合わせて音量が調整されます。

| オプション | 説明 | デフォルト |
|----------|------|----------|
| `-b, --bgm <path>` | BGMファイルのパス（必須） | - |
| `-a, --audio <path>` | 音声ファイルのパス（必須） | - |
| `-o, --output <path>` | 出力ファイルパス | `{audio}_with_bgm.mp3` |
| `--bgm-volume <number>` | BGMの基本音量 (0-1) | `0.3` |
| `--ducking <number>` | 音声時のBGM音量低下率 (0-1) | `0.15` |
| `--fade-in <seconds>` | BGMフェードイン時間 | `3` |
| `--fade-out <seconds>` | BGMフェードアウト時間 | `3` |
| `--intro <seconds>` | BGMのみの導入時間 | `3` |
| `--outro <seconds>` | BGMのみの終了時間 | `2` |

**使用例:**
```bash
# 基本的な使用方法
cheercast add-bgm --bgm music.mp3 --audio radio_2025-01-20.mp3

# BGM音量を控えめに設定
cheercast add-bgm --bgm music.mp3 --audio radio.mp3 --bgm-volume 0.2 --ducking 0.1

# カスタムフェード設定
cheercast add-bgm --bgm music.mp3 --audio radio.mp3 --fade-in 5 --fade-out 5
```
| `-t, --type <type>` | 番組タイプ | `daily` |
| `-s, --style <style>` | 褒めスタイル | `gentle` |

### 入力ファイルの形式

#### テキストファイル (.txt / .md)

```markdown
# 2024-01-20 の日記

今日は新しいプロジェクトの設計を完了させた。
午前中は要件定義の見直しに時間をかけて、より良い設計ができたと思う。

午後からはコーディングを開始。TypeScriptの型定義で少し悩んだけど、
ドキュメントを読んで解決できた。

夕方には30分のウォーキングも達成！
明日も頑張ろう。
```

#### JSON ファイル (.json)

```json
{
  "date": "2024-01-20",
  "activities": [
    {
      "category": "work",
      "description": "新しいプロジェクトの設計を完了",
      "achievement": "要件定義の見直しで品質向上"
    },
    {
      "category": "learning",
      "description": "TypeScriptの型定義を学習",
      "achievement": "ドキュメントを読んで理解を深めた"
    },
    {
      "category": "health",
      "description": "30分のウォーキング",
      "achievement": "運動習慣の継続"
    }
  ],
  "positiveElements": ["設計完了", "問題解決", "運動達成"]
}
```

#### CSV ファイル (.csv)

```csv
日付,活動内容,達成度
2024-01-20,新しいプロジェクトの設計を完了,要件定義の見直しで品質向上
2024-01-20,TypeScriptの型定義を学習,ドキュメントを読んで理解を深めた
2024-01-20,30分のウォーキング,運動習慣の継続
```

## 🛠️ 開発

### 開発環境のセットアップ

```bash
# 開発モードで実行
npm run dev

# ビルド
npm run build

# ビルド（ウォッチモード）
npm run build:watch
```

### テスト

```bash
# 全てのテストを実行
npm test

# テスト（ウォッチモード）
npm run test:watch

# カバレッジレポート付きでテスト
npm run test:coverage

# 統合テストのみ実行
npm test -- src/integration
```

### コード品質

```bash
# ESLintでコードをチェック
npm run lint

# ESLintで自動修正
npm run lint:fix

# Prettierでフォーマット
npm run format

# 型チェック
npm run typecheck
```

## 📁 プロジェクト構造

```
cheercast/
├── src/
│   ├── cli/                  # CLIコマンドとエントリーポイント
│   │   ├── index.ts         # メインCLIエントリーポイント
│   │   └── commands/        # 各種コマンド実装
│   ├── core/                # コアビジネスロジック
│   │   ├── parser/          # メモファイルパーサー
│   │   ├── generator/       # 台本生成
│   │   ├── voice/           # 音声合成
│   │   └── mixer/           # 音声ミキシング
│   ├── services/            # 外部サービス統合
│   │   ├── gemini-api/      # Google Gemini API
│   │   └── ffmpeg/          # FFmpeg処理
│   ├── utils/               # ユーティリティ関数
│   │   ├── validation.ts    # 入力検証
│   │   └── logger.ts        # ロギング
│   ├── config/              # 設定管理
│   ├── types/               # TypeScript型定義
│   └── CheerCast.ts         # メインオーケストレーター
├── tests/                   # テストファイル
├── docs/                    # ドキュメント
├── templates/               # 設定テンプレート
└── package.json
```

## 🔧 設定ファイル

### cheercast.config.json

```json
{
  "radioShowName": "CheerCast",
  "personalities": {
    "host1": {
      "name": "あかり",
      "voiceName": "Kore",
      "character": "優しくて励まし上手"
    },
    "host2": {
      "name": "けんた",
      "voiceName": "Puck",
      "character": "明るくて分析好き"
    }
  },
  "praise": {
    "style": "gentle",
    "focusAreas": ["work", "learning", "health"]
  },
  "audio": {
    "duration": 10,
    "speed": 1.0
  },
  "gemini": {
    "model": "gemini-2.5-flash",
    "temperature": 0.7
  }
}
```

## 🐛 トラブルシューティング

### よくある問題

#### FFmpegが見つからない
```bash
# macOSの場合
brew install ffmpeg

# エラーが続く場合は、PATHを確認
which ffmpeg
```

#### Gemini APIエラー
- APIキーが正しく設定されているか確認
- APIキーの有効性を確認
- ネットワーク接続を確認

#### 音声生成が遅い
- `--duration` オプションで短い番組を生成してテスト

### デバッグモード

```bash
# 詳細なログを出力
DEBUG=cheercast:* cheercast generate -i memo.txt

# 特定のモジュールのみデバッグ
DEBUG=cheercast:parser cheercast generate -i memo.txt
```

## 🤝 コントリビューション

プルリクエストや Issue の作成を歓迎します！

### 開発の流れ

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コーディング規約

- TypeScript strictモードを使用
- ESLintとPrettierの設定に従う
- 全ての新機能にテストを追加
- テストカバレッジ80%以上を維持

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルをご覧ください。

---

Made with ❤️ by CheerCast Team