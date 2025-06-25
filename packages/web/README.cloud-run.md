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

### 1. 手動でのデプロイ

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