# PersonalCast プロジェクト概要とアーキテクチャ

このドキュメントは、PersonalCastプロジェクトの現在の設計、アーキテクチャ、および開発ガイドラインを記載しています。

## 🎯 プロジェクト概要

PersonalCastは、日々のメモから2人のAIパーソナリティがユーザーの活動を分析・紹介するニュース番組を自動生成するCLIツールです。

### 主な特徴
- 📝 様々な形式のメモファイルに対応（.txt, .md, .json, .csv）
- 🤖 Google Gemini API (@google/genai)による自然な対話台本生成
- 🎙️ Gemini 2.5 Flash Preview TTSによる高品質な音声合成
- 🎵 BGM追加機能（自動ダッキング、フェード処理対応）
- ⚡ シンプルなCLIインターフェース
- 🏗️ モノレポ構造による保守性の高い設計
- 🔄 自動リトライ機能付きのAPI呼び出し
- ✅ 入力検証とエラーハンドリング

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
│   └── cli/                 # CLIアプリケーション (personalcast)
│       ├── src/
│       │   ├── commands/    # CLIコマンド実装
│       │   │   ├── generate.ts  # メイン生成コマンド
│       │   │   ├── preview.ts   # プレビューコマンド
│       │   │   ├── init.ts      # 初期設定コマンド
│       │   │   └── add-bgm.ts   # BGM追加コマンド
│       │   ├── PersonalCast.ts  # CLI固有のPersonalCast
│       │   └── index.ts     # メインCLIエントリーポイント
│       ├── dist/            # ビルド済みファイル
│       └── package.json
├── docs/                    # ドキュメント
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
- カスタマイズ可能なラジオ番組名（デフォルト: PersonalCast）
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

## 🔧 設定システム

### 設定ファイル (personalcast.config.json)
```json
{
  "radioShowName": "PersonalCast",
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

### 環境変数
```bash
# 必須
GEMINI_API_KEY=your-gemini-api-key

# オプション
DEFAULT_DURATION=10
DEFAULT_STYLE=analytical
GEMINI_MODEL=gemini-2.5-flash  # モデルのオーバーライド
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

# CLIの開発モード
npm run dev:cli

# 全パッケージのテスト
npm run test

# 全パッケージのリント
npm run lint

# 全パッケージの型チェック
npm run typecheck
```

## 🚀 処理フロー

1. **入力解析**
   - メモファイルを読み込み、ParsedMemo形式に変換
   - 日付、活動内容、ポジティブ要素を抽出

2. **台本生成**
   - Gemini APIにプロンプトを送信
   - 設定されたラジオ番組名を使用
   - 3つのセクション（オープニング、メイン、エンディング）で構成

3. **音声生成**
   - 各パーソナリティの設定されたvoiceNameを使用
   - マルチスピーカー合成を試行、失敗時は個別合成

4. **音声処理**
   - FFmpegで音声を結合
   - 音量を正規化
   - MP3形式でエクスポート

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

## ⚡ パフォーマンス最適化

- 大きなメモファイル: ストリーミング処理を検討
- 音声生成: 並列処理の活用
- キャッシュ: 将来的な実装を検討

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

### 将来の拡張
- **Webアプリケーション**: バックエンドでcoreライブラリを使用するAPI
- **デスクトップアプリ**: ElectronでCLIをGUIラップ
- **モバイルアプリ**: React Native + API経由でcoreライブラリ使用

## 📊 今後の拡張可能性

- Web版の開発（Next.js + API Routes）
- 追加の音声合成エンジン対応
- カスタムパーソナリティの追加
- 多言語対応
- バッチ処理機能
- リアルタイム音声ストリーミング
- デスクトップ・モバイル版の開発