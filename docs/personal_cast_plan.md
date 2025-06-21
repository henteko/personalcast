# PersonalCast 実装計画書

## 📋 実装概要

CheerCastからPersonalCastへのリブランディングに伴う技術的実装計画です。
本計画は段階的な実装を前提とし、最小限の変更から始めて徐々に機能を拡張していきます。

## 🎯 実装フェーズ

### Phase 1: 基本的なリブランディング（1週間）
最小限の変更でサービス名とコンセプトを切り替える

### Phase 2: コア機能の調整（1週間）
AI生成ロジックとUI/UXの本格的な変更

### Phase 3: 新機能の追加（2週間）
PersonalCastならではの機能追加と最適化

## 📝 Phase 1: 基本的なリブランディング

### 1.1 プロジェクト名の変更

#### パッケージ情報
```bash
# package.json
- "name": "cheercast"
+ "name": "personalcast"
- "description": "毎日のメモから2人のパーソナリティがあなたの頑張りを褒めてくれるラジオ番組を自動生成"
+ "description": "毎日のメモから2人のキャスターがあなたの活動を分析・紹介するパーソナルニュース番組を自動生成"
```

#### CLIコマンド
```bash
# bin/index.js のコマンド名
- #!/usr/bin/env node
- 'cheercast'
+ #!/usr/bin/env node
+ 'personalcast'
```

#### 環境変数・設定ファイル
- `.cheercast.config.json` → `.personalcast.config.json`
- 環境変数プレフィックス: `CHEERCAST_` → `PERSONALCAST_`

### 1.2 基本的なテキスト変更

#### CLI出力メッセージ
```typescript
// src/cli/index.ts
- .description('毎日のメモから2人のパーソナリティがあなたの頑張りを褒めてくれるラジオ番組を自動生成')
+ .description('毎日のメモから2人のキャスターがあなたの活動を分析・紹介するパーソナルニュース番組を自動生成')

// src/utils/progress.ts
- console.log('🎙️ CheerCast ラジオ番組生成を開始します...')
+ console.log('📺 PersonalCast ニュース番組生成を開始します...')
```

#### エラーメッセージ・ログ
```typescript
// 全体的に "ラジオ番組" → "ニュース番組"
// "褒める" → "分析する"
// "応援" → "レポート"
```

### 1.3 設定ファイルの調整

#### デフォルト設定
```json
// src/config/default.ts
{
  "radioShowName": "Today's You",  // CheerCast → Today's You
  "personalities": {
    "host1": {
      "name": "あかり",
      "character": "冷静で分析的なメインキャスター",  // 優しくて励まし上手 → 冷静で分析的
      "voiceName": "Kore"
    },
    "host2": {
      "name": "けんた", 
      "character": "洞察力のあるコメンテーター",  // 明るくて分析好き → 洞察力のある
      "voiceName": "Puck"
    }
  }
}
```

### 1.4 ドキュメントの更新

- README.md の全面更新
- CLAUDE.md のプロジェクト名・コンセプト更新
- docs/index.html のランディングページ更新

## 💻 Phase 2: コア機能の調整

### 2.1 AI プロンプトの変更

#### ScriptGenerator のプロンプト設計
```typescript
// src/core/generator/ScriptGenerator.ts

// Before
const systemPrompt = `
あなたは${personalities.host1.name}と${personalities.host2.name}という2人のラジオパーソナリティです。
リスナーの日々の活動を褒めて応援する温かいラジオ番組を作ってください。
`;

// After  
const systemPrompt = `
あなたは${personalities.host1.name}と${personalities.host2.name}という2人のニュースキャスターです。
視聴者の日々の活動を客観的に分析・紹介するパーソナルニュース番組を作ってください。

番組構成：
1. オープニング: 「Today's You」へようこそ。本日のトップニュースから始めます。
2. トップニュース: 今日の最も重要な活動を3つ選んで紹介
3. 継続報道: 前日からの継続的な取り組みについて分析
4. 特集: 特に注目すべき活動の深掘り分析
5. エンディング: 明日への展望と本日のまとめ

トーン：
- 客観的で事実ベース
- 「興味深い」「注目に値する」「データによると」などの表現を使用
- 感情的な表現は控えめに、分析的な視点を重視
`;
```

#### 対話生成の調整
```typescript
// セグメントタイプの追加
enum SegmentType {
  OPENING = 'opening',
  TOP_NEWS = 'top_news',
  CONTINUOUS_REPORT = 'continuous_report',
  FEATURE = 'feature',
  ENDING = 'ending'
}

// 分析的な表現への変更
const analyticalExpressions = [
  "データを見ると",
  "統計的に見て",
  "傾向として",
  "前回と比較すると",
  "この取り組みの特徴は",
  "客観的に評価すると"
];
```

### 2.2 音声生成の調整

#### 音声パラメータ
```typescript
// src/core/voice/GeminiVoiceGenerator.ts
const voiceConfig = {
  // Before: 温かく親しみやすい設定
  // speakingRate: 1.0,
  // pitch: 1.0,
  
  // After: プロフェッショナルなアナウンサー調
  speakingRate: 0.95,  // やや遅めで聞き取りやすく
  pitch: 0.9,          // やや低めで落ち着いた印象
  volumeGainDb: 0,
  
  // イントネーションの調整
  emphasis: 'moderate',  // 強調は控えめに
  pauseSettings: {
    sentenceEnd: 500,    // 文末の間を長めに
    comma: 200,          // 読点での間
    topicChange: 1000    // トピック変更時の間
  }
};
```

### 2.3 メモ解析ロジックの変更

#### MemoParser の調整
```typescript
// src/core/parser/MemoParser.ts

// Before: ポジティブ要素の抽出
extractPositiveElements(content: string): string[] {
  // 頑張った、できた、などのポジティブワード検索
}

// After: ニュース要素の抽出
extractNewsElements(content: string): NewsElement[] {
  return {
    topStories: [],      // 重要度の高い活動
    continuousStories: [], // 継続的な活動
    newInitiatives: [],   // 新しい取り組み
    metrics: [],          // 数値的な成果
    trends: []            // 傾向や変化
  };
}
```

## 🎨 Phase 3: 新機能の追加

### 3.1 分析機能の強化

#### 統計情報の生成
```typescript
// src/core/analyzer/ActivityAnalyzer.ts (新規)
export class ActivityAnalyzer {
  // 活動の傾向分析
  analyzeTrends(memos: ParsedMemo[]): TrendAnalysis {
    return {
      mostActiveTime: this.findMostActiveTime(memos),
      activityCategories: this.categorizeActivities(memos),
      continuityScore: this.calculateContinuityScore(memos),
      diversityIndex: this.calculateDiversityIndex(memos)
    };
  }
  
  // 前回との比較
  compareWithPrevious(current: ParsedMemo, previous: ParsedMemo): Comparison {
    return {
      newActivities: this.findNewActivities(current, previous),
      continuedActivities: this.findContinuedActivities(current, previous),
      completedActivities: this.findCompletedActivities(current, previous)
    };
  }
}
```

#### レポート生成機能
```typescript
// src/core/reporter/ReportGenerator.ts (新規)
export class ReportGenerator {
  generateDailyReport(memo: ParsedMemo, analysis: TrendAnalysis): Report {
    return {
      summary: this.createExecutiveSummary(memo, analysis),
      highlights: this.extractHighlights(memo),
      metrics: this.compileMetrics(memo, analysis),
      recommendations: this.generateRecommendations(analysis)
    };
  }
}
```

### 3.2 UI/UXの刷新

#### カラーパレットの変更
```css
/* src/styles/theme.css */
:root {
  /* Before: 暖色系 */
  --primary-color: #ff6b6b;
  --secondary-color: #feca57;
  
  /* After: 寒色系・プロフェッショナル */
  --primary-color: #2563eb;    /* ブルー */
  --secondary-color: #1e40af;   /* ネイビー */
  --accent-color: #60a5fa;      /* ライトブルー */
  --background: #f8fafc;        /* クリーングレー */
  --text-primary: #1e293b;      /* ダークグレー */
}
```

#### アイコン・ビジュアルの変更
- 🎙️ → 📺 (メインアイコン)
- ❤️ → 📊 (統計・分析)
- ⭐ → 📈 (成長・トレンド)
- 🎉 → 🔍 (分析・洞察)

### 3.3 新しいコマンドの追加

#### analyze コマンド
```bash
personalcast analyze -i memos/ -o analysis.json
# 過去のメモから傾向分析レポートを生成
```

#### compare コマンド
```bash
personalcast compare -i today.txt -p yesterday.txt
# 前日との比較レポートを生成
```

## 📁 ファイル構造の変更

```
personalcast/
├── src/
│   ├── core/
│   │   ├── analyzer/        # 新規: 分析機能
│   │   ├── reporter/        # 新規: レポート生成
│   │   ├── parser/          # 既存: ニュース要素抽出に変更
│   │   ├── generator/       # 既存: ニュース番組台本生成に変更
│   │   └── voice/           # 既存: アナウンサー調に調整
│   ├── PersonalCast.ts      # CheerCast.ts から改名
│   └── types/
│       └── index.ts         # 新しい型定義追加
```

## 🧪 テスト戦略

### 既存テストの更新
- すべてのテストケースで "CheerCast" → "PersonalCast"
- 褒める系のアサーション → 分析系のアサーション
- モックデータを分析的な内容に変更

### 新規テストの追加
- ActivityAnalyzer のユニットテスト
- ReportGenerator のユニットテスト
- ニュース番組形式の統合テスト

## 📅 実装スケジュール

### Week 1: Phase 1
- Day 1-2: プロジェクト名・基本テキストの変更
- Day 3-4: 設定ファイル・ドキュメントの更新
- Day 5: テストの修正・動作確認

### Week 2: Phase 2
- Day 1-2: AIプロンプトの変更・調整
- Day 3-4: 音声生成・メモ解析の調整
- Day 5: 統合テスト・品質確認

### Week 3-4: Phase 3
- Week 3: 分析機能の実装
- Week 4: UI/UX刷新・新コマンド追加

## ⚠️ 注意事項

1. **段階的リリース**: 各フェーズ完了後にリリース可能な状態を維持
2. **後方互換性**: 設定ファイルは旧形式も一時的にサポート
3. **ユーザー移行**: 既存ユーザー向けの移行ガイドを作成
4. **ブランド一貫性**: すべての変更で PersonalCast ブランドを統一

## 🎯 成功指標

- [ ] すべてのテストがグリーン
- [ ] ドキュメントの更新完了
- [ ] デモ動画の作成
- [ ] ランディングページの公開
- [ ] 初期ユーザーからのフィードバック収集

この計画に従って実装を進めることで、CheerCastからPersonalCastへのスムーズな移行を実現します。