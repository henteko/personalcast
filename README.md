# CheerCast

毎日のメモから2人のパーソナリティがあなたの頑張りを褒めてくれるラジオ番組を自動生成するCLIツール

## 🎯 概要

CheerCastは、日記やライフログから、AIが2人のパーソナリティ（あかり＆けんた）による応援ラジオ番組を自動生成します。毎日の小さな成果や努力を見つけて褒めることで、継続的なモチベーション向上を支援します。

## ✨ 特徴

- 📝 様々な形式のメモファイルに対応（.txt, .md, .json, .csv）
- 🤖 Google Gemini APIによる自然な対話台本生成
- 🎙️ Google Cloud Text-to-Speechによる高品質な音声合成
- 🎵 BGM付きの本格的なラジオ番組形式
- ⚡ シンプルなCLIインターフェース

## 📋 必要要件

- Node.js 18以上
- FFmpeg（システムにインストール済み）
- Google Cloud アカウント
- Google Gemini API キー

## 🚀 インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/cheercast.git
cd cheercast

# 依存関係のインストール
npm install

# ビルド
npm run build

# グローバルインストール（オプション）
npm link
```

## 🔧 セットアップ

1. 環境変数の設定

```bash
cp .env.example .env
```

以下の環境変数を設定してください：

```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEYFILE=path/to/keyfile.json
GEMINI_API_KEY=your-gemini-api-key
```

2. 初期設定

```bash
cheercast init
```

## 📖 使い方

### 基本的な使用方法

```bash
# メモからラジオ番組を生成
cheercast generate -i memo.txt -o today.mp3

# プレビューモード（台本のみ生成）
cheercast preview -i memo.txt

# ヘルプ
cheercast --help
```

### オプション

- `-i, --input <path>`: 入力ファイルまたはディレクトリ（必須）
- `-o, --output <path>`: 出力ファイル名（デフォルト: radio_{date}.mp3）
- `-t, --type <type>`: 番組タイプ（daily|weekly）
- `-s, --style <style>`: 褒めスタイル（gentle|energetic）
- `-d, --duration <minutes>`: 番組の長さ（5|10|15）

### 入力ファイルの例

```markdown
# 2024-01-20 の日記

今日は新しいプロジェクトの設計を完了させた。
午前中は要件定義の見直しに時間をかけて、より良い設計ができたと思う。

午後からはコーディングを開始。TypeScriptの型定義で少し悩んだけど、
ドキュメントを読んで解決できた。

夕方には30分のウォーキングも達成！
```

## 🛠️ 開発

```bash
# 開発モード
npm run dev

# テスト
npm test

# テスト（ウォッチモード）
npm run test:watch

# カバレッジ
npm run test:coverage

# リント
npm run lint

# フォーマット
npm run format
```

## 🤝 コントリビューション

プルリクエストや Issue の作成を歓迎します！詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルをご覧ください。