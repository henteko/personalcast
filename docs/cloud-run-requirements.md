# PersonalCast Cloud Run 要件定義書

## 概要

PersonalCastをGoogle Cloud Run上でWebアプリケーションとして動作させるための要件を定義します。現在のCLIベースの機能をWebブラウザから利用可能にすることで、より多くのユーザーが簡単にアクセスできるようになります。

## システム構成

### アーキテクチャ概要

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Browser    │────▶│  Cloud Run      │────▶│  Gemini API     │
│                 │     │  (PersonalCast) │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  Cloud Storage  │
                        │                 │
                        └─────────────────┘
```

### 主要コンポーネント

1. **Web フロントエンド**
   - React/Vue.js/Next.js によるSPA
   - 活動記録入力フォーム
   - 分析進捗表示
   - レポートプレイヤー

2. **バックエンドAPI (Cloud Run)**
   - REST API エンドポイント
   - 非同期処理対応
   - ファイルアップロード/ダウンロード

3. **ストレージ (Cloud Storage)**
   - 一時ファイル保存
   - 生成済みMP3ファイル保存
   - 有効期限付きURL生成

## 機能要件

### 1. ユーザー認証（Phase 1: オプション）

- **匿名利用**: 初期バージョンでは認証なしで利用可能
- **将来拡張**: Google認証、使用制限管理

### 2. 活動記録入力

#### 入力方法
- **テキストエリア**: 構造化された形式で入力
- **ファイルアップロード**: txt, md, json, csv対応
- **テンプレート**: 入力例の提供

#### 入力バリデーション
- 最大文字数: 10,000文字
- ファイルサイズ: 最大1MB
- 文字エンコーディング: UTF-8

### 3. 生成オプション

```typescript
interface GenerationOptions {
  // プログラムタイプ
  programType: 'daily' | 'weekly';
  
  // 分析スタイル
  analysisStyle: 'analytical' | 'comprehensive';
  
  // 番組の長さ（分）
  duration: number; // 1-10
  
  // 音声速度
  speed?: number; // 0.5-2.0
  
  // カスタムニュース番組名
  newsShowName?: string;
}
```

### 4. 分析レポート生成プロセス

#### 非同期処理フロー
1. **ジョブ作成**: 分析リクエスト受付、ジョブID発行
2. **統計分析完了通知**: データ分析が完成したら即座に表示可能に
3. **進捗通知**: WebSocket or Server-Sent Events
4. **音声生成完了**: 完了通知とダウンロードURL

#### 進捗段階
```typescript
enum GenerationStatus {
  QUEUED = 'queued',
  PARSING = 'parsing',
  ANALYZING_DATA = 'analyzing_data',
  GENERATING_SCRIPT = 'generating_script',
  SCRIPT_READY = 'script_ready',  // レポート閲覧可能
  SYNTHESIZING_VOICE = 'synthesizing_voice',
  MIXING_AUDIO = 'mixing_audio',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

### 5. 結果表示・ダウンロード

#### 統計レポート表示（音声生成前）
- **即座に表示**: データ分析完了後すぐに閲覧可能
- **統計ダッシュボード**: グラフやチャートで可視化
- **カテゴリー別分析**: 活動の分布表示
- **共有機能**: レポートのみの共有URL

#### 音声再生画面
- **同期再生**: 音声とレポートが同期してスクロール
- **ハイライト表示**: 現在再生中のセクションをハイライト
- **インタラクティブ**: レポートクリックで該当箇所から再生
- **タイムスタンプ**: 各セクションの開始時刻表示

```typescript
interface PlaybackView {
  audioUrl: string;
  report: {
    sections: Array<{
      title: string;
      speaker: string;
      text: string;
      statistics?: StatisticsData;
      startTime: number;  // 秒
      endTime: number;    // 秒
    }>;
  };
  currentTime: number;
  isPlaying: boolean;
}
```

### 6. データビジュアライゼーション

#### 統計ダッシュボード仕様
分析完了後、音声生成を待たずに統計情報を表示。

**表示項目**:
- **活動サマリー**: 総活動数、カテゴリー別分布
- **時系列グラフ**: 日別・時間別の活動パターン
- **キーワードクラウド**: 頻出キーワードの視覚化
- **進捗トラッキング**: 継続的な取り組みの可視化

```typescript
interface StatisticsData {
  totalActivities: number;
  categoryDistribution: {
    work: number;
    learning: number;
    health: number;
    personal: number;
    other: number;
  };
  topKeywords: Array<{ word: string; count: number }>;
  continuityMetrics: {
    streaks: Array<{ activity: string; days: number }>;
    completionRate: number;
  };
}
```

## API仕様

### エンドポイント設計

#### 1. 分析開始
```http
POST /api/analyze
Content-Type: application/json

{
  "activityLog": "【業務活動】\n- TypeScript移行タスク2件完了...",
  "options": {
    "programType": "daily",
    "analysisStyle": "analytical",
    "duration": 5
  }
}

Response:
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "estimatedTime": 60
}
```

#### 2. ファイルアップロード分析
```http
POST /api/analyze/upload
Content-Type: multipart/form-data

activityLog: (file)
options: {"programType": "daily", ...}

Response:
{
  "jobId": "...",
  "status": "queued"
}
```

#### 3. 進捗確認
```http
GET /api/jobs/{jobId}

Response:
{
  "jobId": "...",
  "status": "synthesizing_voice",
  "progress": 60,
  "message": "音声を生成中...",
  "statisticsAvailable": true,  // 統計が閲覧可能
  "scriptAvailable": true,       // レポートが閲覧可能
  "estimatedTimeRemaining": 30
}
```

#### 4. 統計データ取得（音声生成前）
```http
GET /api/jobs/{jobId}/statistics

Response:
{
  "jobId": "...",
  "status": "analyzing_data",
  "statistics": {
    "totalActivities": 12,
    "categoryDistribution": {
      "work": 5,
      "learning": 3,
      "health": 2,
      "personal": 2,
      "other": 0
    },
    "topKeywords": [
      { "word": "TypeScript", "count": 4 },
      { "word": "プロジェクト", "count": 3 },
      { "word": "完了", "count": 3 }
    ],
    "continuityMetrics": {
      "streaks": [
        { "activity": "朝のランニング", "days": 5 }
      ],
      "completionRate": 100
    }
  }
}
```

#### 5. レポート取得（音声生成前）
```http
GET /api/jobs/{jobId}/report

Response:
{
  "jobId": "...",
  "status": "script_ready",
  "report": {
    "title": "2025年1月22日のToday's You",
    "sections": [
      {
        "id": "s1",
        "type": "opening",
        "speaker": "あかり",
        "text": "こんにちは。Today's Youの時間です。",
        "emotion": "professional"
      },
      {
        "id": "s2",
        "type": "statistics",
        "speaker": "けんた",
        "text": "本日は総計12件の活動が記録されました。",
        "statistics": { ... }
      }
    ]
  }
}
```

#### 6. 最終結果取得（音声付き）
```http
GET /api/jobs/{jobId}/result

Response:
{
  "jobId": "...",
  "status": "completed",
  "audioUrl": "https://storage.googleapis.com/...",
  "report": {
    "title": "2025年1月22日のToday's You",
    "sections": [
      {
        "id": "s1",
        "type": "opening",
        "speaker": "あかり",
        "text": "こんにちは。Today's Youの時間です。",
        "startTime": 0.0,
        "endTime": 2.5
      },
      {
        "id": "s2",
        "type": "statistics",
        "speaker": "けんた",
        "text": "本日は総計12件の活動が記録されました。",
        "startTime": 2.5,
        "endTime": 5.8,
        "statistics": { ... }
      }
    ]
  },
  "duration": 300,  // 総再生時間（秒）
  "expiresAt": "2025-01-23T12:00:00Z"
}
```

## 非機能要件

### 1. パフォーマンス

- **レスポンスタイム**: API応答 < 500ms
- **分析時間**: 5分番組 < 60秒
- **同時処理**: 10リクエスト/インスタンス

### 2. スケーラビリティ

- **Cloud Run設定**:
  - 最小インスタンス: 0（コールドスタート許容）
  - 最大インスタンス: 100
  - CPU: 2
  - メモリ: 4GB
  - タイムアウト: 300秒

### 3. セキュリティ

- **API制限**: 
  - レート制限: 10リクエスト/分/IP
  - 日次制限: 100リクエスト/IP
- **入力検証**: SQLインジェクション、XSS対策
- **ファイルスキャン**: アップロードファイルのウイルススキャン
- **CORS設定**: 許可されたオリジンのみ

### 4. 可用性

- **SLA目標**: 99.5%
- **エラーハンドリング**: 
  - Gemini API障害時の再試行
  - 一時的な障害の自動リカバリ
- **ヘルスチェック**: /health エンドポイント

### 5. 監視・ログ

- **Cloud Logging**: 全リクエスト・エラーログ
- **Cloud Monitoring**: 
  - API レスポンスタイム
  - エラー率
  - 分析成功率
- **Error Reporting**: 例外の自動収集

## 実装フェーズ

### Phase 1: MVP (2-3週間)

1. **基本Web UI**
   - シンプルな入力フォーム
   - 生成ボタン
   - 結果表示

2. **同期API**
   - 単純な分析エンドポイント
   - タイムアウト対応

3. **Cloud Run デプロイ**
   - Dockerfile作成
   - 基本的なCI/CD

### Phase 2: 非同期処理 (2週間)

1. **ジョブ管理**
   - Cloud Tasks統合
   - 進捗通知

2. **ストレージ統合**
   - Cloud Storage連携
   - 一時ファイル管理

### Phase 3: UX改善 (2週間)

1. **リッチUI**
   - プログレスバー
   - 統計ダッシュボード（音声生成前）
   - 同期再生ビュー

2. **データビジュアライゼーション**
   - グラフ・チャート実装
   - キーワードクラウド
   - 時系列分析

3. **共有機能**
   - 短縮URL
   - SNS共有
   - レポートのみ共有

### Phase 4: スケール対応 (1週間)

1. **パフォーマンス最適化**
   - キャッシュ実装
   - CDN統合

2. **監視強化**
   - ダッシュボード作成
   - アラート設定

## コスト見積もり

### 月間想定利用量（1000ユーザー、各10回利用）

| サービス | 使用量 | 単価 | 月額費用 |
|---------|-------|------|---------|
| Cloud Run | 10,000リクエスト × 60秒 | $0.00004/vCPU秒 | $24 |
| Cloud Storage | 100GB（音声ファイル） | $0.020/GB | $2 |
| Gemini API | 10,000回 × 2000文字 | $0.00025/1000文字 | $5 |
| ネットワーク | 50GB（ダウンロード） | $0.12/GB | $6 |
| **合計** | | | **約$37** |

## UI/UXデザイン仕様

### 1. 画面遷移フロー

```mermaid
graph LR
    A[入力画面] --> B[分析中画面]
    B --> C[統計ダッシュボード]
    C --> D[音声生成中]
    D --> E[再生画面]
    
    B -.-> C
    C -.-> E
```

### 2. 各画面の詳細

#### 入力画面
- **メインエリア**: 構造化されたテキストエリア
- **テンプレート表示**: 活動記録の形式例
- **オプション**: アコーディオンで折りたたみ
- **分析ボタン**: プロフェッショナルなデザイン

#### 分析中画面
- **上部**: 進捗バーと状態メッセージ
- **中央**: 分析ステータス表示
- **下部**: 「統計を見る」ボタン（分析完成後に有効化）

#### 統計ダッシュボード画面
- **グラフエリア**: 円グラフ、棒グラフで活動分布表示
- **キーワード**: ワードクラウド形式
- **継続指標**: ストリークカウンター
- **下部**: 「レポートを聴く」「入力に戻る」ボタン

#### 再生画面
- **上部**: オーディオプレイヤー
- **中央**: レポート表示エリア（自動スクロール）
- **サイドバー**: 統計サマリー（デスクトップのみ）
- **コントロール**: 
  - 再生/一時停止
  - 10秒戻る/進む
  - 再生速度（0.75x, 1x, 1.25x, 1.5x）

### 3. レスポンシブデザイン

#### モバイル（〜768px）
- 縦長レイアウト
- 統計は縦スクロール
- レポートは1カラム表示

#### タブレット（768px〜1024px）
- 2カラムレイアウト可能
- 統計とレポートを並列表示

#### デスクトップ（1024px〜）
- 3カラムレイアウト
- 入力・統計・レポートを同時表示可能

### 4. アニメーション仕様

#### 遷移アニメーション
- **ページ遷移**: スライドイン/アウト
- **要素出現**: フェードイン
- **進捗更新**: スムーズなプログレスバー

#### データビジュアライゼーション
- **グラフ描画**: 段階的なアニメーション
- **数値カウントアップ**: 0から実数値へ
- **キーワード出現**: フェードイン効果

#### 再生画面アニメーション
- **セクション切り替え**: スムーズスクロール
- **ハイライト**: 背景色の変化
- **一時停止/再生**: アイコンモーフィング

### 5. カラーパレット

```css
:root {
  /* メインカラー（プロフェッショナル） */
  --primary-blue: #1a365d;
  --primary-light-blue: #2b6cb0;
  --accent-blue: #90cdf4;
  
  /* キャスターカラー */
  --akari-color: #4299e1;
  --kenta-color: #2d3748;
  
  /* UI カラー */
  --bg-main: #f7fafc;
  --bg-white: #ffffff;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  
  /* データビジュアライゼーション */
  --chart-1: #3182ce;
  --chart-2: #63b3ed;
  --chart-3: #90cdf4;
  --chart-4: #bee3f8;
  --chart-5: #e0e7ff;
  
  /* ステータスカラー */
  --success: #48bb78;
  --warning: #ed8936;
  --error: #f56565;
}
```

## 技術的な考慮事項

### 1. コンテナ化

```dockerfile
FROM node:20-alpine

# FFmpegインストール
RUN apk add --no-cache ffmpeg

# アプリケーションコード
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "run", "start:web"]
```

### 2. 環境変数

```yaml
env_variables:
  GEMINI_API_KEY: ${GEMINI_API_KEY}
  GCS_BUCKET: personalcast-audio-files
  NODE_ENV: production
  PORT: 8080
```

### 3. 既存コードの変更点

1. **ファイルI/O**
   - ローカルファイル読み書き → Cloud Storage API
   - 一時ファイル → メモリバッファ or Cloud Storage

2. **設定管理**
   - personalcast.config.json → 環境変数
   - デフォルト設定のハードコード

3. **エラーハンドリング**
   - process.exit() → HTTPエラーレスポンス
   - コンソールログ → 構造化ログ

4. **非同期処理**
   - 同期的な生成 → Promise/async-await
   - 長時間処理 → ジョブキュー

5. **レポートタイミング情報**
   - 各セクションの開始/終了時刻を計算
   - 音声ファイルのメタデータ抽出
   - タイムスタンプとの同期

### 4. フロントエンド実装考慮点

#### レポート同期再生の実装
```typescript
// 音声再生とレポート同期のサンプルコード
class SyncedPlayback {
  private audio: HTMLAudioElement;
  private sections: SectionWithTiming[];
  
  constructor(audioUrl: string, sections: SectionWithTiming[]) {
    this.audio = new Audio(audioUrl);
    this.sections = sections;
    
    // タイムアップデートイベントで現在のセクションをハイライト
    this.audio.addEventListener('timeupdate', () => {
      const currentTime = this.audio.currentTime;
      const currentSection = this.findCurrentSection(currentTime);
      this.highlightSection(currentSection);
    });
  }
  
  private findCurrentSection(time: number): SectionWithTiming | null {
    return this.sections.find(s => 
      time >= s.startTime && time < s.endTime
    ) || null;
  }
}
```

#### データビジュアライゼーションの実装
```typescript
// 統計ダッシュボードのサンプル
class StatisticsDashboard {
  private chartLibrary: ChartJS; // or D3.js
  
  renderCategoryDistribution(data: CategoryDistribution) {
    const ctx = document.getElementById('categoryChart');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['業務', '学習', '健康', '個人', 'その他'],
        datasets: [{
          data: Object.values(data),
          backgroundColor: [
            '#3182ce',
            '#63b3ed',
            '#90cdf4',
            '#bee3f8',
            '#e0e7ff'
          ]
        }]
      }
    });
  }
  
  renderKeywordCloud(keywords: Keyword[]) {
    // D3.js word cloud implementation
  }
}
```

## セキュリティ要件

### 1. API保護

- **認証**: 初期はAPIキー、将来的にOAuth2
- **入力検証**: 全パラメータのバリデーション
- **出力制御**: 生成コンテンツのフィルタリング

### 2. データ保護

- **暗号化**: HTTPS必須、保存時暗号化
- **アクセス制御**: 最小権限の原則
- **データ保持**: 24時間後に自動削除

### 3. 監査

- **アクセスログ**: 全APIコールの記録
- **変更履歴**: 設定変更の追跡
- **コンプライアンス**: GDPR対応の削除機能

## まとめ

PersonalCastのCloud Run化により、以下のメリットが期待できます：

1. **アクセシビリティ向上**: CLIの知識不要
2. **スケーラビリティ**: 自動スケーリング
3. **メンテナンス性**: 一元管理
4. **拡張性**: 新機能の追加が容易

### 特徴的なUX機能

1. **段階的な結果表示**
   - 統計分析が完成したら即座に閲覧可能
   - 音声生成を待たずにデータを確認できる

2. **データドリブンな体験**
   - 活動の可視化による気づきの提供
   - 継続的な取り組みのトラッキング
   - 客観的なデータに基づく分析

3. **インタラクティブな再生体験**
   - 音声とレポートが同期してスクロール
   - 現在のセクションがハイライト表示
   - クリックで任意の位置から再生

これらの機能により、単なる音声生成ツールから、個人の活動を客観的に分析・可視化するプロフェッショナルなサービスへと進化します。初期実装はシンプルに始め、段階的に機能を追加していくアプローチを推奨します。