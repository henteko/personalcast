# PersonalCast Cloud Run 開発計画書

## 📋 エグゼクティブサマリー

PersonalCastをGoogle Cloud Run上でWebアプリケーションとして動作させるための開発計画です。ローカルファースト開発アプローチを採用し、まずローカル環境で完全に動作するWebアプリケーションを構築してから、最後にクラウド環境へ移行します。

### 開発期間
- **総期間**: 6-8週間
- **Phase 1-4**: 4-5週間（ローカル環境での完全動作・機能実装）
- **Phase 5**: 2-3週間（Cloud Run移行・本番対応）

### 主要な成果物
1. Next.jsベースのWebアプリケーション
2. 非同期処理対応のAPIサーバー
3. 統計ダッシュボードと同期再生機能
4. Cloud Run対応のコンテナイメージ

## 🏗️ 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **データ可視化**: Chart.js / Recharts
- **音声再生**: HTML5 Audio API
- **リアルタイム通信**: Server-Sent Events (SSE)

### バックエンド
- **フレームワーク**: Next.js API Routes
- **言語**: TypeScript
- **ジョブキュー**: Bull (Redis)
- **ファイルストレージ**: 
  - ローカル: ファイルシステム
  - 本番: Google Cloud Storage
- **音声処理**: FFmpeg

### インフラ
- **ローカル開発**: Node.js + Redis (Docker)
- **本番環境**: 
  - Google Cloud Run
  - Cloud Storage
  - Cloud Tasks (Phase 3)
  - Redis (Memorystore)

### 開発ツール
- **パッケージマネージャー**: npm
- **ビルドツール**: Next.js built-in
- **コンテナ**: Docker
- **CI/CD**: GitHub Actions

## 📊 フェーズ別開発計画

### Phase 1: ローカル環境での基本Web実装（2週間）

#### Week 1: 基盤構築
1. **プロジェクトセットアップ**
   ```bash
   # Next.jsプロジェクト作成
   npx create-next-app@latest personalcast-web --typescript --app
   
   # 依存関係のインストール
   npm install @google/generative-ai fluent-ffmpeg bull redis
   npm install -D @types/fluent-ffmpeg @types/bull
   ```

2. **ディレクトリ構造**
   ```
   personalcast-web/
   ├── app/
   │   ├── api/
   │   │   ├── analyze/
   │   │   │   └── route.ts
   │   │   ├── jobs/
   │   │   │   └── [jobId]/
   │   │   │       ├── route.ts
   │   │   │       ├── statistics/
   │   │   │       │   └── route.ts
   │   │   │       └── report/
   │   │   │           └── route.ts
   │   │   └── health/
   │   │       └── route.ts
   │   ├── components/
   │   │   ├── ActivityInput.tsx
   │   │   ├── ProgressBar.tsx
   │   │   └── AudioPlayer.tsx
   │   └── page.tsx
   ├── lib/
   │   ├── adapters/
   │   │   ├── storage.ts
   │   │   └── queue.ts
   │   ├── personalcast/
   │   │   └── (既存コードを統合)
   │   └── utils/
   └── public/
   ```

3. **アダプターパターン実装**
   ```typescript
   // lib/adapters/storage.ts
   export interface StorageAdapter {
     save(path: string, data: Buffer): Promise<string>;
     load(path: string): Promise<Buffer>;
     delete(path: string): Promise<void>;
     getUrl(path: string): string;
   }

   export class LocalStorageAdapter implements StorageAdapter {
     private basePath = './storage';
     
     async save(path: string, data: Buffer): Promise<string> {
       const fullPath = join(this.basePath, path);
       await fs.writeFile(fullPath, data);
       return fullPath;
     }
     
     getUrl(path: string): string {
       return `/api/files/${path}`;
     }
   }
   ```

4. **既存PersonalCastコードの統合**
   - CLIコードをライブラリとして再利用
   - Web用のインターフェース追加
   - ファイルI/Oの抽象化

#### Week 2: 基本UI/API実装

1. **入力画面の実装**
   ```typescript
   // app/components/ActivityInput.tsx
   export function ActivityInput() {
     const [activityLog, setActivityLog] = useState('');
     const [options, setOptions] = useState<GenerationOptions>({
       analysisStyle: 'analytical',
       duration: 5,
       speed: 1.0
     });
     
     const handleSubmit = async () => {
       const response = await fetch('/api/analyze', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ activityLog, options })
       });
       const { jobId } = await response.json();
       router.push(`/jobs/${jobId}`);
     };
   }
   ```

2. **APIエンドポイント実装**
   ```typescript
   // app/api/analyze/route.ts
   export async function POST(request: Request) {
     const { activityLog, options } = await request.json();
     
     // ジョブIDの生成
     const jobId = crypto.randomUUID();
     
     // ローカルファイルに保存
     const storage = new LocalStorageAdapter();
     await storage.save(`jobs/${jobId}/input.json`, 
       Buffer.from(JSON.stringify({ activityLog, options }))
     );
     
     // 同期処理として実行（Phase 1）
     processJob(jobId);
     
     return Response.json({ jobId, status: 'processing' });
   }
   ```

3. **進捗表示とポーリング**
   ```typescript
   // app/jobs/[jobId]/page.tsx
   export default function JobPage({ params }: { params: { jobId: string } }) {
     const [job, setJob] = useState<Job>();
     
     useEffect(() => {
       const interval = setInterval(async () => {
         const res = await fetch(`/api/jobs/${params.jobId}`);
         const data = await res.json();
         setJob(data);
         
         if (data.status === 'completed' || data.status === 'failed') {
           clearInterval(interval);
         }
       }, 1000);
       
       return () => clearInterval(interval);
     }, [params.jobId]);
   }
   ```

### Phase 2: 非同期処理とUI拡張（1週間）

1. **Redisセットアップ（Docker）**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
   ```

2. **Bullキュー実装**
   ```typescript
   // lib/queue/processor.ts
   import Bull from 'bull';
   
   const analysisQueue = new Bull('analysis', {
     redis: { port: 6379, host: 'localhost' }
   });
   
   analysisQueue.process(async (job) => {
     const { jobId, activityLog, options } = job.data;
     
     // 進捗更新
     await job.progress(10);
     
     // 1. メモ解析
     const parsedMemo = await parser.parse(activityLog);
     await job.progress(20);
     
     // 2. 統計分析
     const statistics = analyzeStatistics(parsedMemo);
     await storage.save(`jobs/${jobId}/statistics.json`, 
       Buffer.from(JSON.stringify(statistics))
     );
     await job.progress(40);
     
     // 3. 台本生成
     const script = await generator.generate(parsedMemo, options);
     await storage.save(`jobs/${jobId}/report.json`,
       Buffer.from(JSON.stringify(script))
     );
     await job.progress(60);
     
     // 4. 音声生成
     const audioBuffer = await voiceGenerator.generate(script);
     await storage.save(`jobs/${jobId}/audio.mp3`, audioBuffer);
     await job.progress(100);
   });
   ```

3. **Server-Sent Events実装**
   ```typescript
   // app/api/jobs/[jobId]/events/route.ts
   export async function GET(
     request: Request,
     { params }: { params: { jobId: string } }
   ) {
     const stream = new ReadableStream({
       start(controller) {
         const job = await analysisQueue.getJob(params.jobId);
         
         job.on('progress', (progress) => {
           controller.enqueue(
             `data: ${JSON.stringify({ progress })}\n\n`
           );
         });
         
         job.on('completed', () => {
           controller.enqueue(
             `data: ${JSON.stringify({ status: 'completed' })}\n\n`
           );
           controller.close();
         });
       }
     });
     
     return new Response(stream, {
       headers: {
         'Content-Type': 'text/event-stream',
         'Cache-Control': 'no-cache',
         'Connection': 'keep-alive'
       }
     });
   }
   ```

### Phase 3: UX改善と統計ダッシュボード（1週間）

1. **統計ダッシュボード実装**
   ```typescript
   // app/components/StatisticsDashboard.tsx
   import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
   import { Doughnut } from 'react-chartjs-2';
   
   export function StatisticsDashboard({ statistics }: { statistics: Statistics }) {
     const chartData = {
       labels: ['業務', '学習', '健康', '個人', 'その他'],
       datasets: [{
         data: Object.values(statistics.categoryDistribution),
         backgroundColor: [
           '#3182ce', '#63b3ed', '#90cdf4', '#bee3f8', '#e0e7ff'
         ]
       }]
     };
     
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
           <CardHeader>活動カテゴリー分布</CardHeader>
           <CardBody>
             <Doughnut data={chartData} />
           </CardBody>
         </Card>
         
         <Card>
           <CardHeader>頻出キーワード</CardHeader>
           <CardBody>
             <WordCloud keywords={statistics.topKeywords} />
           </CardBody>
         </Card>
       </div>
     );
   }
   ```

2. **同期再生ビュー実装**
   ```typescript
   // app/components/SyncedPlayback.tsx
   export function SyncedPlayback({ audioUrl, report }: PlaybackProps) {
     const audioRef = useRef<HTMLAudioElement>(null);
     const [currentSection, setCurrentSection] = useState<string>('');
     
     useEffect(() => {
       const audio = audioRef.current;
       if (!audio) return;
       
       const handleTimeUpdate = () => {
         const currentTime = audio.currentTime;
         const section = report.sections.find(
           s => currentTime >= s.startTime && currentTime < s.endTime
         );
         
         if (section) {
           setCurrentSection(section.id);
           // スムーズスクロール
           document.getElementById(section.id)?.scrollIntoView({
             behavior: 'smooth',
             block: 'center'
           });
         }
       };
       
       audio.addEventListener('timeupdate', handleTimeUpdate);
       return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
     }, [report]);
     
     return (
       <div className="flex flex-col lg:flex-row gap-6">
         <div className="lg:w-2/3">
           <audio ref={audioRef} src={audioUrl} controls className="w-full" />
           
           <div className="mt-6 space-y-4">
             {report.sections.map(section => (
               <div
                 key={section.id}
                 id={section.id}
                 className={`p-4 rounded-lg transition-colors ${
                   currentSection === section.id 
                     ? 'bg-blue-50 border-l-4 border-blue-500' 
                     : 'bg-gray-50'
                 }`}
                 onClick={() => {
                   if (audioRef.current) {
                     audioRef.current.currentTime = section.startTime;
                   }
                 }}
               >
                 <div className="flex items-center gap-2 mb-2">
                   <span className={`font-semibold ${
                     section.speaker === 'あかり' ? 'text-blue-600' : 'text-gray-700'
                   }`}>
                     {section.speaker}
                   </span>
                   <span className="text-sm text-gray-500">
                     {formatTime(section.startTime)}
                   </span>
                 </div>
                 <p className="text-gray-700">{section.text}</p>
               </div>
             ))}
           </div>
         </div>
         
         <div className="lg:w-1/3">
           <StatisticsSummary statistics={report.statistics} />
         </div>
       </div>
     );
   }
   ```

3. **レスポンシブデザイン対応**
   - モバイル優先のレイアウト設計
   - タブレット・デスクトップ対応
   - アニメーション実装（フェードイン、スムーズスクロール）

### Phase 4: 最適化とローカル環境での完成（1週間）

1. **キャッシュ実装**
   ```typescript
   // lib/cache/index.ts
   import { Redis } from 'ioredis';
   
   export class CacheManager {
     private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
     
     async get<T>(key: string): Promise<T | null> {
       const value = await this.redis.get(key);
       return value ? JSON.parse(value) : null;
     }
     
     async set(key: string, value: any, ttl = 3600): Promise<void> {
       await this.redis.setex(key, ttl, JSON.stringify(value));
     }
   }
   ```

2. **パフォーマンス最適化**
   - 画像最適化（next/image）
   - コード分割（dynamic imports）
   - API応答のキャッシュ
   - ローカルCDN（静的ファイルの最適化）

3. **ローカル環境での完全動作確認**
   - 全機能の統合テスト
   - パフォーマンステスト
   - エラーハンドリングの確認
   - ドキュメント整備

### Phase 5: Cloud Run移行と本番対応（2-3週間）

1. **統計ダッシュボード実装**
   ```typescript
   // app/components/StatisticsDashboard.tsx
   import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
   import { Doughnut } from 'react-chartjs-2';
   
   export function StatisticsDashboard({ statistics }: { statistics: Statistics }) {
     const chartData = {
       labels: ['業務', '学習', '健康', '個人', 'その他'],
       datasets: [{
         data: Object.values(statistics.categoryDistribution),
         backgroundColor: [
           '#3182ce', '#63b3ed', '#90cdf4', '#bee3f8', '#e0e7ff'
         ]
       }]
     };
     
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
           <CardHeader>活動カテゴリー分布</CardHeader>
           <CardBody>
             <Doughnut data={chartData} />
           </CardBody>
         </Card>
         
         <Card>
           <CardHeader>頻出キーワード</CardHeader>
           <CardBody>
             <WordCloud keywords={statistics.topKeywords} />
           </CardBody>
         </Card>
       </div>
     );
   }
   ```

2. **同期再生ビュー実装**
   ```typescript
   // app/components/SyncedPlayback.tsx
   export function SyncedPlayback({ audioUrl, report }: PlaybackProps) {
     const audioRef = useRef<HTMLAudioElement>(null);
     const [currentSection, setCurrentSection] = useState<string>('');
     
     useEffect(() => {
       const audio = audioRef.current;
       if (!audio) return;
       
       const handleTimeUpdate = () => {
         const currentTime = audio.currentTime;
         const section = report.sections.find(
           s => currentTime >= s.startTime && currentTime < s.endTime
         );
         
         if (section) {
           setCurrentSection(section.id);
           // スムーズスクロール
           document.getElementById(section.id)?.scrollIntoView({
             behavior: 'smooth',
             block: 'center'
           });
         }
       };
       
       audio.addEventListener('timeupdate', handleTimeUpdate);
       return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
     }, [report]);
     
     return (
       <div className="flex flex-col lg:flex-row gap-6">
         <div className="lg:w-2/3">
           <audio ref={audioRef} src={audioUrl} controls className="w-full" />
           
           <div className="mt-6 space-y-4">
             {report.sections.map(section => (
               <div
                 key={section.id}
                 id={section.id}
                 className={`p-4 rounded-lg transition-colors ${
                   currentSection === section.id 
                     ? 'bg-blue-50 border-l-4 border-blue-500' 
                     : 'bg-gray-50'
                 }`}
                 onClick={() => {
                   if (audioRef.current) {
                     audioRef.current.currentTime = section.startTime;
                   }
                 }}
               >
                 <div className="flex items-center gap-2 mb-2">
                   <span className={`font-semibold ${
                     section.speaker === 'あかり' ? 'text-blue-600' : 'text-gray-700'
                   }`}>
                     {section.speaker}
                   </span>
                   <span className="text-sm text-gray-500">
                     {formatTime(section.startTime)}
                   </span>
                 </div>
                 <p className="text-gray-700">{section.text}</p>
               </div>
             ))}
           </div>
         </div>
         
         <div className="lg:w-1/3">
           <StatisticsSummary statistics={report.statistics} />
         </div>
       </div>
     );
   }
   ```

#### Week 1: コンテナ化とCloud Storage統合

1. **Dockerfile作成**
   ```dockerfile
   FROM node:20-alpine AS base
   RUN apk add --no-cache ffmpeg
   
   FROM base AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   EXPOSE 8080
   ENV PORT 8080
   
   CMD ["node", "server.js"]
   ```

2. **Cloud Storageアダプター実装**
   ```typescript
   // lib/adapters/cloud-storage.ts
   import { Storage } from '@google-cloud/storage';
   
   export class CloudStorageAdapter implements StorageAdapter {
     private storage = new Storage();
     private bucket = this.storage.bucket(process.env.GCS_BUCKET!);
     
     async save(path: string, data: Buffer): Promise<string> {
       const file = this.bucket.file(path);
       await file.save(data);
       return `gs://${process.env.GCS_BUCKET}/${path}`;
     }
     
     async getUrl(path: string): Promise<string> {
       const file = this.bucket.file(path);
       const [url] = await file.getSignedUrl({
         action: 'read',
         expires: Date.now() + 24 * 60 * 60 * 1000 // 24時間
       });
       return url;
     }
   }
   ```

3. **環境変数による切り替え**
   ```typescript
   // lib/adapters/index.ts
   export function getStorageAdapter(): StorageAdapter {
     if (process.env.NODE_ENV === 'production') {
       return new CloudStorageAdapter();
     }
     return new LocalStorageAdapter();
   }
   ```

#### Week 2-3: Cloud Tasks統合とデプロイ

1. **Cloud Tasksアダプター**
   ```typescript
   // lib/adapters/cloud-tasks.ts
   import { CloudTasksClient } from '@google-cloud/tasks';
   
   export class CloudTasksAdapter implements QueueAdapter {
     private client = new CloudTasksClient();
     
     async enqueue(jobId: string, data: any): Promise<void> {
       const parent = this.client.queuePath(
         process.env.GCP_PROJECT!,
         process.env.GCP_LOCATION!,
         'analysis-queue'
       );
       
       await this.client.createTask({
         parent,
         task: {
           httpRequest: {
             url: `${process.env.APP_URL}/api/process/${jobId}`,
             httpMethod: 'POST',
             body: Buffer.from(JSON.stringify(data)).toString('base64')
           }
         }
       });
     }
   }
   ```

2. **GitHub Actions設定**
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
       - uses: actions/checkout@v3
       
       - id: 'auth'
         uses: 'google-github-actions/auth@v1'
         with:
           credentials_json: '${{ secrets.GCP_SA_KEY }}'
       
       - name: 'Set up Cloud SDK'
         uses: 'google-github-actions/setup-gcloud@v1'
       
       - name: 'Configure Docker'
         run: gcloud auth configure-docker
       
       - name: 'Build and Push'
         run: |
           docker build -t gcr.io/$PROJECT_ID/personalcast-web .
           docker push gcr.io/$PROJECT_ID/personalcast-web
       
       - name: 'Deploy to Cloud Run'
         run: |
           gcloud run deploy personalcast-web \
             --image gcr.io/$PROJECT_ID/personalcast-web \
             --platform managed \
             --region asia-northeast1 \
             --allow-unauthenticated
   ```

3. **監視設定**
   ```typescript
   // lib/monitoring/index.ts
   export function trackEvent(name: string, properties?: any) {
     if (process.env.NODE_ENV === 'production') {
       // Google Analytics or similar
       gtag('event', name, properties);
     }
   }
   
   export function trackError(error: Error, context?: any) {
     console.error(error, context);
     if (process.env.NODE_ENV === 'production') {
       // Sentry or similar
       Sentry.captureException(error, { extra: context });
     }
   }
   ```

## 🚀 実装優先順位

### 必須機能（MVP）
1. ✅ 活動記録の入力（テキスト）
2. ✅ 基本的な分析レポート生成
3. ✅ 音声ファイルの生成とダウンロード
4. ✅ 進捗表示
5. ✅ エラーハンドリング

### 追加機能（Phase 3-4）
1. ⬜ ファイルアップロード対応
2. ⬜ 統計ダッシュボード
3. ⬜ 同期再生ビュー
4. ⬜ カスタム設定
5. ⬜ 共有機能

### 将来機能
1. ⬜ ユーザー認証
2. ⬜ 履歴管理
3. ⬜ BGM追加
4. ⬜ 多言語対応
5. ⬜ API公開

## 📝 開発チェックリスト

### Phase 1
- [ ] Next.jsプロジェクトセットアップ
- [ ] 基本UIコンポーネント作成
- [ ] APIエンドポイント実装
- [ ] 既存PersonalCastコード統合
- [ ] ローカルストレージ実装
- [ ] 基本的なエラーハンドリング

### Phase 2
- [ ] Redisセットアップ
- [ ] Bullキュー実装
- [ ] 非同期処理対応
- [ ] SSE実装
- [ ] 進捗表示UI改善

### Phase 3
- [ ] 統計ダッシュボード実装
- [ ] 同期再生ビュー実装
- [ ] データビジュアライゼーション
- [ ] レスポンシブデザイン対応
- [ ] アニメーション実装

### Phase 4
- [ ] キャッシュ実装
- [ ] パフォーマンス最適化
- [ ] ローカル環境での完全動作確認
- [ ] ドキュメント整備

### Phase 5
- [ ] Dockerfile作成
- [ ] Cloud Storageアダプター実装
- [ ] Cloud Tasks統合
- [ ] 環境変数管理
- [ ] CI/CDパイプライン構築
- [ ] Cloud Runデプロイ
- [ ] 監視・ログ設定
- [ ] セキュリティ強化

## 🎯 成功指標

### 技術指標
- ページロード時間: < 3秒
- API応答時間: < 500ms
- 分析処理時間: < 60秒（5分番組）
- エラー率: < 1%

### ユーザビリティ指標
- 初回利用完了率: > 80%
- 平均セッション時間: > 5分
- リピート率: > 30%

## 🔗 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)

## 📅 マイルストーン

| フェーズ | 期間 | 主要成果物 |
|---------|------|-----------|
| Phase 1 | 2週間 | ローカルで動作する基本Web版 |
| Phase 2 | 1週間 | 非同期処理対応版 |
| Phase 3 | 1週間 | UX改善版（統計ダッシュボード、同期再生） |
| Phase 4 | 1週間 | ローカル環境での完成版 |
| Phase 5 | 2-3週間 | Cloud Run対応・本番版 |

これにより、段階的にPersonalCastをWebアプリケーションとして進化させ、より多くのユーザーが簡単にアクセスできるサービスを実現します。