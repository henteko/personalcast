# PersonalCast プロジェクト概要とアーキテクチャ

このドキュメントは、PersonalCastプロジェクトの現在の設計、アーキテクチャ、および開発ガイドラインを記載しています。

## 🎯 プロジェクト概要

PersonalCastは、日々のメモから2人のAIパーソナリティがユーザーの活動を客観的に分析・紹介するニュース番組を自動生成するツールです。CLIツールとWebアプリケーションの両方で利用可能です。

### 主な特徴
- 📝 様々な形式のメモファイルに対応（.txt, .md, .json, .csv）
- 🤖 Google Gemini API (@google/genai)による自然な対話台本生成
- 🎙️ Gemini 2.5 Flash Preview TTSによる高品質な音声合成（Zephyr、Charon等の音声プリセット対応）
- 🎵 BGM追加機能（自動ダッキング、フェード処理対応）
- ⚡ シンプルなCLIインターフェース
- 🌐 Webアプリケーション対応（ブラウザから利用可能）
- 🏗️ モノレポ構造による保守性の高い設計
- 🔄 自動リトライ機能付きのAPI呼び出し
- ✅ 入力検証とエラーハンドリング
- 📊 客観的な活動分析とパターン認識
- 🔗 Convexによるリアルタイムデータ同期（Web版）

## 🏗️ アーキテクチャ

### ディレクトリ構造（モノレポ）
```
personalcast/
├── packages/
│   ├── core/                # コアライブラリ (@personalcast/core)
│   │   ├── src/
│   │   │   ├── parser/      # メモファイルパーサー
│   │   │   ├── generator/   # 台本生成
│   │   │   ├── voice/       # 音声合成
│   │   │   ├── mixer/       # 音声ミキシング
│   │   │   ├── services/    # 外部サービス統合
│   │   │   │   ├── gemini-api/  # Google Gemini API (@google/genai)
│   │   │   │   └── ffmpeg/      # FFmpeg処理
│   │   │   ├── utils/       # ユーティリティ関数
│   │   │   ├── config/      # 設定管理
│   │   │   ├── types/       # TypeScript型定義
│   │   │   └── PersonalCast.ts # メインオーケストレーター
│   │   ├── dist/            # ビルド済みファイル
│   │   └── package.json
│   ├── cli/                 # CLIアプリケーション (personalcast)
│   │   ├── src/
│   │   │   ├── commands/    # CLIコマンド実装
│   │   │   │   ├── generate.ts  # メイン生成コマンド
│   │   │   │   ├── preview.ts   # プレビューコマンド
│   │   │   │   ├── init.ts      # 初期設定コマンド
│   │   │   │   └── add-bgm.ts   # BGM追加コマンド
│   │   │   ├── PersonalCast.ts  # CLI固有のPersonalCast
│   │   │   └── index.ts     # メインCLIエントリーポイント
│   │   ├── dist/            # ビルド済みファイル
│   │   └── package.json
│   └── web/                 # Webアプリケーション (@personalcast/web)
│       ├── app/             # Next.js App Router
│       │   ├── api/         # APIルート
│       │   │   ├── analyze/ # 分析API
│       │   │   ├── jobs/    # ジョブ管理API
│       │   │   └── files/   # ファイルサービング
│       │   ├── generate/    # 生成ページ
│       │   ├── jobs/[jobId]/ # ジョブ詳細ページ
│       │   └── page.tsx     # ランディングページ
│       ├── components/      # Reactコンポーネント
│       │   ├── forms/       # フォームコンポーネント
│       │   ├── analysis/    # 分析関連コンポーネント
│       │   └── landing/     # ランディングページコンポーネント
│       ├── convex/          # Convexデータベース設定
│       │   ├── schema.ts    # データスキーマ定義
│       │   ├── jobs.ts      # ジョブ管理ミューテーション
│       │   ├── files.ts     # ファイル管理
│       │   └── actions.ts   # サーバーアクション
│       ├── lib/             # ライブラリコード
│       │   ├── constants/   # 定数定義
│       │   └── types/       # TypeScript型定義
│       ├── public/          # 静的ファイル
│       │   └── audio/       # BGM・サンプル音声ファイル
│       └── package.json
├── docs/                    # ドキュメント（GitHub Pages）
│   └── index.html          # PersonalCast CLIランディングページ
├── .github/                 # GitHub Actions ワークフロー
└── package.json             # ワークスペース設定
```

### 主要コンポーネント

#### 1. **PersonalCast** (メインオーケストレーター)
- 全体の処理フローを制御
- 各コンポーネントの連携を管理

#### 2. **MemoParser**
- メモファイルの読み込みと解析
- 複数フォーマット対応（.txt, .md, .json, .csv）
- 日付と活動内容の抽出

#### 3. **ScriptGenerator**
- Gemini APIを使用した台本生成
- カスタマイズ可能なラジオ番組名（デフォルト: "Today's You"）
- パーソナリティ設定に基づく対話生成

#### 4. **GeminiVoiceGenerator**
- Gemini 2.5 Flash Preview TTSを使用
- 設定可能な音声名（voiceName）
- マルチスピーカー対応

#### 5. **AudioMixer**
- FFmpegを使用した音声処理
- 複数音声の結合
- 音量正規化

#### 6. **AddBgmCommand**
- 生成された音声にBGMを追加
- 自動ダッキング（音声検出時にBGM音量を下げる）
- フェードイン/アウト処理
- BGMの自動ループ

#### 7. **Webアプリケーション**
- Next.js 15によるモダンなWebインターフェース
- Convexによるリアルタイムデータ同期
- リアルタイム進捗表示
- ブラウザ内音声再生
- レスポンシブデザイン
- ランディングページとサンプル音声

#### 8. **Convex統合** (Web版)
- リアルタイムジョブステータス管理
- クラウドファイルストレージ
- 非同期処理とエラーハンドリング
- 24時間後の自動クリーンアップ

## 🔧 設定システム

### CLIの設定ファイル (personalcast.config.json)
```json
{
  "radioShowName": "Today's You",
  "personalities": {
    "host1": {
      "name": "あかり",
      "voiceName": "Zephyr",
      "character": "冷静で分析的なメインキャスター"
    },
    "host2": {
      "name": "けんた",
      "voiceName": "Charon",
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
  },
  "gemini": {
    "model": "gemini-2.5-flash",
    "temperature": 0.7
  }
}
```

### 環境変数

#### CLI環境変数
```bash
# 必須
GEMINI_API_KEY=your-gemini-api-key

# オプション
DEFAULT_DURATION=10
DEFAULT_STYLE=analytical
GEMINI_MODEL=gemini-2.5-flash  # モデルのオーバーライド
```

#### Web環境変数 (.env.local)
```bash
# 必須
GEMINI_API_KEY=your-gemini-api-key

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# ローカルディレクトリ（開発時）
LOCAL_TEMP_DIR=./temp
LOCAL_OUTPUT_DIR=./output

# API設定
API_RATE_LIMIT=10
API_DAILY_LIMIT=100
```

## 🛠️ 開発環境

### 開発コマンド
```bash
# 全パッケージのビルド
npm run build

# コアライブラリのみビルド
npm run build:core

# CLIパッケージのみビルド
npm run build:cli

# Webパッケージのみビルド
npm run build:web

# CLIの開発モード
npm run dev:cli

# Webの開発モード（http://localhost:3000）
npm run dev:web

# Convexの開発モード
npx convex dev

# 全パッケージのテスト
npm run test

# 全パッケージのリント
npm run lint

# 全パッケージの型チェック
npm run typecheck
```

## 🚀 処理フロー

### Web版の処理フロー

1. **ジョブ作成**
   - ユーザーがメモを入力
   - Convexでジョブレコードを作成
   - リアルタイムでステータス更新

2. **入力解析**
   - メモファイルを読み込み、ParsedMemo形式に変換
   - 日付、活動内容、ポジティブ要素を抽出

3. **台本生成**
   - Gemini APIにプロンプトを送信
   - 設定されたラジオ番組名を使用（デフォルト: "Today's You"）
   - 3つのセクション（オープニング、メイン、エンディング）で構成
   - 客観的な分析と建設的なフィードバック

4. **音声生成**
   - 各パーソナリティの設定されたvoiceNameを使用（Zephyr、Charon等）
   - マルチスピーカー合成を試行、失敗時は個別合成

5. **音声処理**
   - FFmpegで音声を結合
   - 音量を正規化
   - BGMを自動追加
   - MP3形式でエクスポート

6. **ファイル保存**
   - Convexストレージに音声ファイルを保存
   - URLを生成してジョブレコードに記録

## 📋 開発ガイドライン

### コーディング規約
- TypeScript strict mode必須
- ESLint + Prettierでコードフォーマット
- 型定義は`types/`ディレクトリに集約

### テスト戦略
- ユニットテスト: 各コンポーネントの個別機能
- 統合テスト: エンドツーエンドのワークフロー
- カバレッジ: 報告のみ、閾値による失敗なし

### エラーハンドリング
- API呼び出し: 3回までの自動リトライ
- ユーザーフレンドリーな日本語エラーメッセージ
- 詳細なログ出力（デバッグモード）

### コミット規約
```
<type>: <subject>

<body>

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🔒 セキュリティ考慮事項

- APIキーは環境変数で管理
- ローカルファイルのみ処理（ネットワーク経由のファイルは非対応）
- 一時ファイルは処理後に自動削除
- Convexによるセキュアなデータ管理

## ⚡ パフォーマンス最適化

- 大きなメモファイル: ストリーミング処理を検討
- 音声生成: 並列処理の活用
- キャッシュ: 将来的な実装を検討
- Convex: リアルタイム更新による効率的な状態管理

## 🤝 コントリビューション

1. Issueで機能提案や不具合報告
2. フォークしてフィーチャーブランチで開発
3. テストを追加/更新
4. プルリクエストを作成

## 🏗️ モノレポ構造の利点

PersonalCastはモノレポ構造を採用しており、以下の利点があります：

### 構造上の利点
- **コード共有**: コアロジックを複数のアプリケーションで再利用
- **一貫性**: 共通の型定義、設定、ツールチェーン
- **保守性**: 依存関係の管理が簡単
- **開発効率**: 統一されたビルド・テスト・リントプロセス

### パッケージ構成
- **@personalcast/core**: 共有ライブラリ（Node.js環境）
- **personalcast**: CLIアプリケーション（coreライブラリを使用）
- **@personalcast/web**: Webアプリケーション（Next.js + coreライブラリ + Convex）

### リポジトリ情報
- **GitHubリポジトリ**: https://github.com/henteko/personalcast
- **プロジェクト名**: PersonalCast
- **ワークスペース名**: personalcast-monorepo
- **CLIドキュメント**: https://henteko.github.io/personalcast/

### 将来の拡張
- **デスクトップアプリ**: ElectronでCLIをGUIラップ
- **モバイルアプリ**: React Native + API経由でcoreライブラリ使用
- **クラウド対応**: Vercel + Convexによるスケーラブルなホスティング

## 📊 今後の拡張可能性

- 追加の音声合成エンジン対応
- カスタムパーソナリティの追加
- 多言語対応
- バッチ処理機能
- リアルタイム音声ストリーミング
- デスクトップ・モバイル版の開発
- ユーザー認証とデータ管理機能
- ソーシャル機能（生成した番組の共有）
- 統計ダッシュボード