# PersonalCast Web

PersonalCastのWebアプリケーション版です。ブラウザから活動記録を入力し、AIによる分析レポートを音声で受け取ることができます。

## 開発環境のセットアップ

1. 環境変数の設定
   ```bash
   cp .env.local.example .env.local
   # .env.localを編集してGEMINI_API_KEYを設定
   ```

2. 依存関係のインストール
   ```bash
   npm install
   ```

3. 開発サーバーの起動
   ```bash
   npm run dev
   ```

   http://localhost:3000 でアプリケーションにアクセスできます。

## 主な機能

- 📝 **活動記録入力**: テキストエリアまたはファイルアップロードで活動を記録
- 🤖 **AI分析**: Gemini APIを使用した活動分析と台本生成
- 🎙️ **音声生成**: 2人のAIパーソナリティによる音声レポート
- 📊 **進捗表示**: リアルタイムな生成進捗の表示
- 🎵 **音声再生**: ブラウザ内での音声再生と台本表示

## ディレクトリ構造

```
packages/web/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── analyze/       # 分析開始エンドポイント
│   │   ├── jobs/          # ジョブ管理エンドポイント
│   │   └── files/         # ファイルサービング
│   ├── jobs/[jobId]/      # ジョブ詳細ページ
│   └── page.tsx           # ホームページ
├── components/            # Reactコンポーネント
│   ├── forms/            # フォームコンポーネント
│   └── analysis/         # 分析関連コンポーネント
├── lib/                   # ライブラリコード
│   ├── storage/          # ストレージアダプター
│   └── types/            # TypeScript型定義
├── public/               # 静的ファイル
├── temp/                 # 一時ファイル（gitignore）
└── output/               # 出力ファイル（gitignore）
```

## API仕様

### POST /api/analyze
活動記録の分析を開始します。

### GET /api/jobs/{jobId}
ジョブの進捗状況を取得します。

### GET /api/jobs/{jobId}/script
生成された台本を取得します。

### GET /api/jobs/{jobId}/result
完成した音声ファイルのURLを取得します。

## 環境変数

- `GEMINI_API_KEY`: Gemini APIキー（必須）
- `LOCAL_TEMP_DIR`: 一時ファイルディレクトリ（デフォルト: ./temp）
- `LOCAL_OUTPUT_DIR`: 出力ファイルディレクトリ（デフォルト: ./output）

## スクリプト

- `npm run dev`: 開発サーバー起動
- `npm run build`: プロダクションビルド
- `npm run start`: プロダクションサーバー起動
- `npm run lint`: ESLint実行
- `npm run typecheck`: TypeScriptの型チェック