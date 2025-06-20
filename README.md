# CheerCast 🎙️

毎日のメモから2人のパーソナリティがあなたの頑張りを褒めてくれるラジオ番組を自動生成するCLIツール

## 🎯 概要

CheerCastは、日記やライフログから、AIが2人のパーソナリティ（あかり＆けんた）による応援ラジオ番組を自動生成します。毎日の小さな成果や努力を見つけて褒めることで、継続的なモチベーション向上を支援します。

## ✨ 特徴

- 📝 様々な形式のメモファイルに対応（.txt, .md, .json, .csv）
- 🤖 Google Gemini APIによる自然な対話台本生成
- 🎙️ Gemini 2.5 Flash Preview TTSによる高品質な音声合成
- 🔊 Google Cloud Text-to-Speech（オプション）にも対応
- 🎵 BGM付きの本格的なラジオ番組形式
- ⚡ シンプルなCLIインターフェース
- 🔄 自動リトライ機能付きのAPI呼び出し
- ✅ 入力検証とエラーハンドリング
- 📊 進捗表示機能

## 📋 必要要件

- Node.js 18以上
- npm 8以上
- FFmpeg（システムにインストール済み）
- Google Gemini API キー
- Google Cloud Platform アカウント（Google Cloud TTSを使用する場合のみ）

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

### 2. Google Cloud Platform の設定（オプション）

Google Cloud TTSを使用する場合のみ必要：

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Cloud Text-to-Speech APIを有効化
3. サービスアカウントを作成し、Cloud Text-to-Speech ユーザーロールを付与
4. サービスアカウントのキーファイル（JSON）をダウンロード

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して以下の環境変数を設定：

```
# Gemini API設定（必須）
GEMINI_API_KEY=your-gemini-api-key

# Google Cloud TTS設定（オプション）
# GOOGLE_CLOUD_PROJECT_ID=your-project-id
# GOOGLE_CLOUD_KEYFILE=path/to/keyfile.json
# GOOGLE_CLOUD_LOCATION=asia-northeast1

# オプション設定
DEFAULT_DURATION=10
DEFAULT_STYLE=gentle
BGM_ENABLED=true
```

### 4. 初期設定

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

# BGMなしで生成
cheercast generate -i memo.txt --no-bgm

# エネルギッシュなスタイルで生成
cheercast generate -i memo.txt -s energetic

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
| `--no-bgm` | BGMを無効にする | false |
| `--bgm-volume <volume>` | BGM音量 (0.0-1.0) | `0.15` |

#### preview コマンド
```bash
cheercast preview [options]
```

| オプション | 説明 | デフォルト |
|----------|------|----------|
| `-i, --input <path>` | 入力ファイル（必須） | - |
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
│   │   ├── gemini/          # Google Gemini API
│   │   ├── gcp-tts/         # Google Cloud TTS
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
  "personas": {
    "main": {
      "name": "あかり",
      "voiceId": "ja-JP-Neural2-B",
      "personality": "明るく元気な女性。聞き手を励まし、小さな成果も見逃さない。"
    },
    "sub": {
      "name": "けんた",
      "voiceId": "ja-JP-Neural2-C",
      "personality": "落ち着いた男性。的確なアドバイスと温かい励ましを提供。"
    }
  },
  "radioConfig": {
    "style": "gentle",
    "openingMessage": "今日も一日お疲れ様でした！",
    "closingMessage": "明日も素敵な一日になりますように！"
  },
  "audio": {
    "defaultDuration": 10,
    "bgmVolume": 0.15,
    "voiceSpeed": 1.0
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

#### Google Cloud認証エラー
```bash
# 認証情報が正しく設定されているか確認
echo $GOOGLE_CLOUD_KEYFILE

# ファイルの存在確認
ls -la $GOOGLE_CLOUD_KEYFILE
```

#### Vertex AI APIエラー
- プロジェクトIDが正しいか確認
- Vertex AI APIが有効化されているか確認
- サービスアカウントに適切な権限があるか確認
- ネットワーク接続を確認

#### 音声生成が遅い
- `--duration` オプションで短い番組を生成してテスト
- BGMを無効化（`--no-bgm`）して処理時間を短縮

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