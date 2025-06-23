# PersonalCast 📺

毎日のメモから2人のキャスターがあなたの活動を分析・紹介するパーソナルニュース番組を自動生成するCLIツール

## 🎯 概要

PersonalCastは、日記やライフログから、AIが2人のキャスター（あかり＆けんた）によるニュース番組を自動生成します。あなたの日々の活動を客観的に分析し、トレンドや継続的な取り組みをプロフェッショナルな視点でレポートします。

## ✨ 特徴

- 📝 様々な形式のメモファイルに対応（.txt, .md, .json, .csv）
- 🤖 Google Gemini APIによる客観的な分析とニュース台本生成
- 🎙️ Gemini 2.5 Flash Preview TTSによる高品質なアナウンサー音声
- 🎵 BGM追加機能（自動ダッキング、フェード処理対応）
- 📊 活動の統計分析とトレンド把握
- ⚡ シンプルなCLIインターフェース
- 🔄 自動リトライ機能付きのAPI呼び出し
- ✅ 入力検証とエラーハンドリング
- 📈 進捗表示機能

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

PersonalCastはモノレポ構造で開発されており、CLIツールとして利用できます。

### 必要な環境
- Node.js 18以上
- npm 8以上
- FFmpeg（音声処理に必要）

### インストール手順

リポジトリをクローン：
```bash
git clone https://github.com/henteko/cheercast.git personalcast
cd personalcast
```

依存関係をインストール：
```bash
npm install
```

全パッケージをビルド：
```bash
npm run build
```

### CLIツールの使用

```bash
cd packages/cli

# 開発モード
npm run dev

# CLIインストール
npm link
```

## ⚙️ 設定

### 環境変数の設定

`.env`ファイルを作成し、Gemini APIキーを設定：
```bash
GEMINI_API_KEY=your-api-key-here
```

### 設定ファイル（オプション）

`personalcast.config.json`を作成して詳細設定をカスタマイズできます：

```json
{
  "radioShowName": "Today's You",
  "personalities": {
    "host1": {
      "name": "あかり",
      "voiceName": "Kore",
      "character": "冷静で分析的なメインキャスター"
    },
    "host2": {
      "name": "けんた",
      "voiceName": "Puck",
      "character": "洞察力のあるコメンテーター"
    }
  },
  "praise": {
    "style": "analytical",
    "focusAreas": ["work", "learning", "health"]
  },
  "audio": {
    "duration": 10,
    "speed": 1.0
  }
}
```

## 📖 使用方法

### 基本的な使い方

メモファイルからニュース番組を生成：
```bash
personalcast generate -i memo.txt
```

### コマンドオプション

#### generateコマンド
```bash
personalcast generate [options]
```

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-i, --input <path>` | 入力ファイルまたはディレクトリのパス | (必須) |
| `-o, --output <path>` | 出力ファイル名 | `news_YYYY-MM-DD.mp3` |
| `-t, --type <type>` | 番組タイプ | `daily` |
| `-s, --style <style>` | 分析スタイル (analytical/comprehensive) | `analytical` |
| `-d, --duration <minutes>` | 番組の長さ（分） | `10` |
| `-b, --bgm <path>` | BGMファイルのパス | なし |
| `--bgm-volume <number>` | BGMの基本音量 (0-1) | `0.3` |
| `--ducking <number>` | 音声時のBGM音量低下率 (0-1) | `0.15` |

### 使用例

#### 日次レポート生成
```bash
personalcast generate -i today.txt -o today_news.mp3
```


#### BGM付きニュース生成
```bash
personalcast generate -i memo.txt -b bgm.mp3 --bgm-volume 0.2
```

#### 詳細な分析レポート
```bash
personalcast generate -i memo.txt -s comprehensive -d 15
```

### 台本プレビュー

音声を生成せずに台本だけ確認：
```bash
personalcast preview -i memo.txt
```

### BGMを後から追加

既存の音声ファイルにBGMを追加：
```bash
personalcast add-bgm -a news_2025-01-01.mp3 -b bgm.mp3 -o news_with_bgm.mp3
```

## 📝 入力ファイル形式

### テキストファイル（.txt）
```
2025年1月1日

今日の活動：
- プロジェクトの設計ドキュメントを完成
- TypeScriptの学習を2時間実施
- 新しいAPIエンドポイントを3つ実装
- チームミーティングで技術共有
```

### Markdownファイル（.md）
```markdown
# 2025年1月1日の記録

## 完了タスク
- [ ] ドキュメント作成
- [x] コードレビュー 5件
- [x] バグ修正 #123

## 学習記録
- React Hooksの深掘り学習
- パフォーマンス最適化手法の研究
```

### JSONファイル（.json）
```json
{
  "date": "2025-01-01",
  "activities": [
    {
      "category": "development",
      "description": "認証システムの実装",
      "duration": "3 hours"
    },
    {
      "category": "learning",
      "description": "AWS認定試験の勉強",
      "progress": "Chapter 5 completed"
    }
  ]
}
```

### CSVファイル（.csv）
```csv
時刻,カテゴリ,活動内容,成果
09:00,開発,リファクタリング,コード行数30%削減
14:00,会議,スプリント計画,次スプリントのタスク決定
16:00,学習,Kubernetes入門,基本概念を理解
```

## 🎯 番組の構成

PersonalCastが生成するニュース番組は以下の構成になっています：

1. **オープニング** - 番組の開始と本日のハイライト
2. **トップニュース** - 最も重要な3つの活動を詳細に分析
3. **継続報道** - 前日からの継続的な取り組みの進捗
4. **特集コーナー** - 特に注目すべき成果の深掘り分析
5. **エンディング** - 本日のまとめと明日への展望

## 🛠️ 開発者向け情報

### 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/henteko/cheercast.git personalcast
cd personalcast

# 依存関係をインストール
npm install

# 全パッケージをビルド
npm run build

# CLIの開発モードで実行
npm run dev:cli

# Webアプリの開発サーバー起動
npm run dev:web

# テストを実行
npm run test

# リントチェック
npm run lint

# 型チェック
npm run typecheck
```

### モノレポ管理

各パッケージは独立してビルド・テストできます：

```bash
# コアライブラリのみビルド
npm run build:core

# CLIパッケージのみテスト
npm run test:cli

# CLIパッケージの開発モード起動
npm run dev:cli
```

### プロジェクト構造

```
personalcast/
├── packages/
│   ├── core/         # コアライブラリ (@personalcast/core)
│   │   ├── src/
│   │   │   ├── parser/   # メモファイル解析
│   │   │   ├── generator/# ニュース台本生成
│   │   │   ├── voice/    # 音声合成
│   │   │   ├── mixer/    # 音声ミキシング
│   │   │   ├── services/ # 外部サービス連携
│   │   │   └── utils/    # ユーティリティ
│   │   └── dist/     # ビルド済みファイル
│   └── cli/          # CLIアプリケーション (personalcast)
│       ├── src/
│       │   ├── commands/ # CLIコマンド実装
│       │   └── index.ts  # エントリーポイント
│       └── dist/     # ビルド済みファイル
├── docs/             # ドキュメント
└── .github/          # GitHub Actions ワークフロー
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- Google Gemini APIチーム
- FFmpegプロジェクト
- すべてのコントリビューターとユーザーの皆様

## 📮 お問い合わせ

- Issue: [GitHub Issues](https://github.com/henteko/cheercast/issues)
- Discussion: [GitHub Discussions](https://github.com/henteko/cheercast/discussions)

---

**PersonalCast** - あなたの毎日を客観的に分析し、成長を可視化するパーソナルニュース番組 📺