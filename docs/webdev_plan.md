# CheerCast Web開発計画書

## プロジェクト概要

CheerCastをWebアプリケーションとしてGoogle Cloud Run上で提供するための開発計画書です。

### 開発期間
- **総期間**: 8週間（2ヶ月）
- **開始日**: 2025年2月1日（想定）
- **完了日**: 2025年3月31日（想定）

### 開発チーム構成（推奨）
- フルスタックエンジニア: 1-2名
- UI/UXデザイナー: 1名（パートタイム）
- インフラエンジニア: 1名（パートタイム）

## フェーズ別開発計画

### 🚀 Phase 0: 準備・設計（1週間）

#### Week 1: アーキテクチャ設計と環境構築

**タスク一覧:**

1. **技術スタック決定**
   - フロントエンド: Next.js 14 (App Router) + TypeScript
   - バックエンド: Express.js or Fastify
   - スタイリング: Tailwind CSS + Framer Motion
   - 状態管理: Zustand or TanStack Query
   - リアルタイム通信: Socket.io or SSE

2. **開発環境構築**
   ```bash
   # モノレポ構造
   cheercast/
   ├── apps/
   │   ├── web/          # Next.js フロントエンド
   │   └── api/          # バックエンドAPI
   ├── packages/
   │   ├── core/         # 既存のCheerCastコア
   │   ├── ui/           # 共有UIコンポーネント
   │   └── types/        # 共有型定義
   └── infrastructure/   # Terraform/Docker設定
   ```

3. **GCP環境準備**
   - プロジェクト作成
   - Cloud Run有効化
   - Cloud Storage バケット作成
   - Secret Manager設定
   - CI/CD (Cloud Build) 設定

4. **デザインシステム作成**
   - Figmaでのワイヤーフレーム作成
   - コンポーネントライブラリの基礎
   - カラーパレット・タイポグラフィ定義

**成果物:**
- [ ] アーキテクチャ設計書
- [ ] 開発環境（ローカル）
- [ ] GCPプロジェクト設定
- [ ] デザインシステムv1

---

### 🛠️ Phase 1: MVP実装（3週間）

#### Week 2: バックエンドAPI基礎

**実装タスク:**

1. **APIサーバー構築**
   ```typescript
   // src/api/server.ts
   - Express/Fastifyセットアップ
   - ミドルウェア設定（CORS, ヘルスチェック）
   - エラーハンドリング
   - ロギング設定
   ```

2. **コア機能の統合**
   ```typescript
   // src/api/services/
   - CheerCastコアのラッパー作成
   - ファイルアップロード処理
   - Cloud Storage連携
   ```

3. **基本エンドポイント実装**
   ```typescript
   POST /api/generate       // 生成開始
   GET  /api/jobs/:id      // ステータス確認
   GET  /api/health        // ヘルスチェック
   ```

**テスト:**
- [ ] ユニットテスト（既存テストの流用）
- [ ] 統合テスト
- [ ] ローカルでのE2Eテスト

#### Week 3: フロントエンド基礎

**実装タスク:**

1. **基本レイアウト**
   ```typescript
   // app/layout.tsx
   - ヘッダー/フッター
   - レスポンシブ対応
   - エラーバウンダリ
   ```

2. **入力画面**
   ```typescript
   // app/page.tsx
   - テキストエリアコンポーネント
   - ファイルアップロード
   - オプション設定フォーム
   - バリデーション
   ```

3. **生成処理画面**
   ```typescript
   // app/generate/[jobId]/page.tsx
   - 進捗表示
   - ローディングアニメーション
   - エラーハンドリング
   ```

**UIコンポーネント:**
- [ ] Button, Input, TextArea
- [ ] ProgressBar
- [ ] Card, Modal
- [ ] Toast通知

#### Week 4: MVP統合とデプロイ

**統合タスク:**

1. **フロントエンド・バックエンド連携**
   - API通信の実装
   - エラーハンドリング
   - ローディング状態管理

2. **Docker化**
   ```dockerfile
   # apps/api/Dockerfile
   FROM node:20-alpine
   RUN apk add --no-cache ffmpeg
   # ...
   ```

3. **Cloud Runデプロイ**
   ```yaml
   # cloud-run.yaml
   apiVersion: serving.knative.dev/v1
   kind: Service
   metadata:
     name: cheercast-api
   spec:
     template:
       spec:
         containers:
         - image: gcr.io/PROJECT/cheercast-api
           resources:
             limits:
               cpu: "2"
               memory: "4Gi"
   ```

**成果物:**
- [ ] 動作するMVP（Web UI + API）
- [ ] Cloud Run上で稼働
- [ ] 基本的な音声生成が可能

---

### 🎨 Phase 2: 非同期処理とUX基礎（2週間）

#### Week 5: 非同期処理実装

**実装タスク:**

1. **ジョブ管理システム**
   ```typescript
   // JobManager実装
   - Cloud Tasksまたはインメモリキュー
   - ジョブステータス管理
   - タイムアウト処理
   ```

2. **リアルタイム通信**
   ```typescript
   // WebSocket/SSE実装
   - 進捗通知
   - ステータス更新
   - エラー通知
   ```

3. **台本プレビュー機能**
   ```typescript
   // 台本生成完了時の即時表示
   GET /api/jobs/:id/script
   ```

**データベース設計:**
```sql
-- ジョブ管理（Cloud Firestore or PostgreSQL）
jobs {
  id: string
  status: GenerationStatus
  script?: RadioScript
  audioUrl?: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Week 6: UX改善 - 台本表示と音声同期

**実装タスク:**

1. **台本プレビュー画面**
   ```typescript
   // components/ScriptPreview.tsx
   - チャット風UI
   - キャラクターアイコン
   - アニメーション
   ```

2. **音声再生画面**
   ```typescript
   // components/AudioPlayer.tsx
   - カスタム音声プレイヤー
   - 台本同期機能
   - タイムスタンプ管理
   ```

3. **同期再生ロジック**
   ```typescript
   // hooks/useSyncedPlayback.ts
   - currentTime監視
   - 自動スクロール
   - ハイライト制御
   ```

**アニメーション実装:**
- [ ] ページ遷移（Framer Motion）
- [ ] 要素の出現エフェクト
- [ ] スムーズスクロール

---

### 🎮 Phase 3: エンターテイメント機能（1週間）

#### Week 7: ミニゲーム実装

**実装タスク:**

1. **褒めワードキャッチャー**
   ```typescript
   // components/MiniGame/WordCatcher.tsx
   - Canvas/SVGベースの実装
   - 物理演算（落下）
   - スコア計算
   - エフェクト
   ```

2. **ゲーム状態管理**
   ```typescript
   // stores/gameStore.ts
   - スコア管理
   - ハイスコア保存
   - ランキング機能
   ```

3. **待機画面統合**
   ```typescript
   // app/generate/[jobId]/waiting/page.tsx
   - ゲーム埋め込み
   - 進捗表示との併存
   - 台本完成通知
   ```

**ゲームアセット:**
- [ ] 褒め言葉リスト作成
- [ ] 効果音素材
- [ ] パーティクルエフェクト

---

### 🚀 Phase 4: 本番対応（1週間）

#### Week 8: 最適化とローンチ準備

**最適化タスク:**

1. **パフォーマンス最適化**
   - 画像最適化（WebP対応）
   - コード分割
   - キャッシュ戦略
   - CDN設定

2. **セキュリティ強化**
   ```typescript
   // セキュリティ実装
   - レート制限
   - 入力サニタイゼーション
   - CSRFトークン
   - セキュリティヘッダー
   ```

3. **監視・ログ設定**
   ```yaml
   # monitoring.yaml
   - Cloud Logging設定
   - Error Reporting
   - Uptime Checks
   - アラート設定
   ```

4. **ドキュメント整備**
   - API仕様書
   - 運用マニュアル
   - トラブルシューティングガイド

**負荷テスト:**
- [ ] k6/JMeterでの負荷テスト
- [ ] 同時接続数の確認
- [ ] オートスケーリング検証

---

## 技術的な実装詳細

### フォルダ構造

```
cheercast-web/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── page.tsx              # 入力画面
│   │   │   ├── generate/
│   │   │   │   └── [jobId]/
│   │   │   │       ├── page.tsx      # 生成状況
│   │   │   │       ├── waiting/      # ミニゲーム
│   │   │   │       └── result/       # 再生画面
│   │   │   └── api/                  # API Routes
│   │   ├── components/
│   │   │   ├── forms/
│   │   │   ├── game/
│   │   │   └── player/
│   │   └── hooks/
│   └── api/
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   └── middleware/
│       └── Dockerfile
├── packages/
│   ├── core/                         # 既存CheerCast
│   ├── ui/                           # 共有UI
│   └── types/                        # 型定義
└── infrastructure/
    ├── terraform/
    └── k8s/
```

### 主要な依存関係

```json
{
  "dependencies": {
    // Frontend
    "next": "^14.0.0",
    "react": "^18.2.0",
    "framer-motion": "^10.16.0",
    "tailwindcss": "^3.4.0",
    "@tanstack/react-query": "^5.0.0",
    "socket.io-client": "^4.7.0",
    
    // Backend
    "express": "^4.18.0",
    "@google-cloud/storage": "^7.0.0",
    "@google-cloud/tasks": "^4.0.0",
    "socket.io": "^4.7.0",
    
    // Shared
    "zod": "^3.22.0",
    "winston": "^3.11.0"
  }
}
```

### デプロイメントパイプライン

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and Push
        run: |
          docker build -t gcr.io/$PROJECT/cheercast-api ./apps/api
          docker build -t gcr.io/$PROJECT/cheercast-web ./apps/web
          docker push gcr.io/$PROJECT/cheercast-api
          docker push gcr.io/$PROJECT/cheercast-web
          
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy cheercast-api --image gcr.io/$PROJECT/cheercast-api
          gcloud run deploy cheercast-web --image gcr.io/$PROJECT/cheercast-web
```

## リスク管理

### 技術的リスク

1. **音声生成の遅延**
   - 対策: 非同期処理、タイムアウト設定
   - 代替案: 事前生成キャッシュ

2. **スケーラビリティ**
   - 対策: Cloud Run自動スケーリング
   - 監視: レスポンスタイム監視

3. **コスト超過**
   - 対策: 使用量制限、アラート設定
   - 予算: 月額$100以内目標

### スケジュールリスク

1. **遅延要因**
   - Gemini API仕様変更
   - Cloud Run制限事項
   - FFmpeg互換性問題

2. **バッファ**
   - 各フェーズに20%のバッファ
   - 優先度による機能カット判断

## 成功指標

### 技術指標
- レスポンスタイム: < 500ms (API)
- 音声生成時間: < 60秒 (5分番組)
- 可用性: 99.5%以上
- エラー率: < 1%

### ユーザー指標
- 生成完了率: > 90%
- ミニゲーム参加率: > 70%
- 台本プレビュー利用率: > 80%
- 再訪率: > 50%

## まとめ

この開発計画に従って実装を進めることで、8週間でCheerCastのWeb版を完成させることができます。MVPから始めて段階的に機能を追加していくアプローチにより、早期にフィードバックを得ながら、リスクを最小限に抑えた開発が可能です。

特に重要なのは：
1. 既存のCLI機能を損なわないこと
2. ユーザー体験を最優先にすること
3. スケーラビリティを考慮した設計

これらを意識しながら、楽しく使えるWebサービスを目指します。