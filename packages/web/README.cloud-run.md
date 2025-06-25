# PersonalCast Web - Cloud Run デプロイガイド

## 環境変数の設定

Cloud Runにデプロイする際は、以下の環境変数を設定してください：

```bash
# 必須
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your-convex-deploy-key

# オプション（推奨）
NODE_ENV=production
PORT=8080
```

## デプロイ方法

### 1. Convex Production環境へのデプロイ

Cloud Runにデプロイする前に、必ずConvexをproduction環境にデプロイする必要があります：

```bash
# packages/webディレクトリに移動
cd packages/web

# production環境にデプロイ
npx convex deploy --yes
```

このコマンドにより以下が実行されます：
- テーブル（jobs, audioFiles, memoFiles）とインデックスの作成
- サーバー関数のデプロイ
- production URLの確認

重要: 初回デプロイ時はスキーマとインデックスが作成されるため、この手順を必ず実行してください。

### 2. 手動でのデプロイ

```bash
# プロジェクトルートから実行
cd /path/to/personalcast

# Google Cloudにログイン
gcloud auth login

# プロジェクトを設定
gcloud config set project cheercast

# DockerをGCRに対して認証
gcloud auth configure-docker

# Dockerイメージをビルド（Cloud Run用にAMD64を指定）
docker build --platform linux/amd64 -t gcr.io/cheercast/personalcast-web:latest -f packages/web/Dockerfile .

# イメージをプッシュ
docker push gcr.io/cheercast/personalcast-web:latest

# Cloud Runにデプロイ
gcloud run deploy personalcast-web \
  --image gcr.io/cheercast/personalcast-web:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 2 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 600 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars GEMINI_API_KEY=your-api-key \
  --set-env-vars NEXT_PUBLIC_CONVEX_URL=your-convex-url \
  --set-env-vars CONVEX_DEPLOY_KEY=your-deploy-key
```

## トラブルシューティング

### ビルドエラーが発生する場合

1. Node.jsのバージョンが18以上であることを確認
2. すべての依存関係が正しくインストールされているか確認
3. `packages/core`が先にビルドされているか確認

### 起動時にエラーが発生する場合

1. 環境変数が正しく設定されているか確認
2. Convexのデプロイが完了しているか確認
3. Cloud Runのログを確認：
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=personalcast-web" --limit 50
   ```

### パフォーマンスの最適化

- メモリを1GBに増やす: `--memory 1Gi`
- CPUを2に増やす: `--cpu 2`
- 最小インスタンス数を1に設定してコールドスタートを回避: `--min-instances 1`

### Convex関連のトラブルシューティング

1. **「Server Error」が発生する場合**
   - Convexがproduction環境にデプロイされているか確認
   - `NEXT_PUBLIC_CONVEX_URL`が正しいproduction URLを指しているか確認
   - `CONVEX_DEPLOY_KEY`が正しく設定されているか確認

2. **テーブルが見つからないエラーが発生する場合**
   ```bash
   cd packages/web
   npx convex deploy --yes
   ```

3. **環境変数の更新方法**
   ```bash
   # 特定の環境変数を更新
   gcloud run services update personalcast-web \
     --region asia-northeast1 \
     --update-env-vars "CONVEX_DEPLOY_KEY=新しいデプロイキー"
   
   # 複数の環境変数を一度に更新
   gcloud run services update personalcast-web \
     --region asia-northeast1 \
     --update-env-vars "GEMINI_API_KEY=新しいAPIキー,NEXT_PUBLIC_CONVEX_URL=新しいURL"
   ```