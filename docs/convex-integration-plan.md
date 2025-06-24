# PersonalCast Web版 Convex統合計画書

## 概要

このドキュメントは、PersonalCast Web版にConvexを統合するための実装計画書です。Phase 1（基礎実装）とPhase 2（ストレージ移行）の2段階での実装を計画しています。

## 目的

現在のPersonalCast Web版が抱える以下の課題を解決します：

1. **データ永続性の欠如** - インメモリジョブ管理によるデータ消失
2. **スケーラビリティの制限** - ローカルファイルシステム依存
3. **非効率なリアルタイム更新** - ポーリングによるリソース消費
4. **ファイル管理の複雑さ** - 手動でのクリーンアップが必要

## アーキテクチャ変更の概要

### 現在のアーキテクチャ
```
[Next.js App] → [API Routes] → [In-Memory Job Manager]
                              → [Local File System]
```

### Convex統合後のアーキテクチャ
```
[Next.js App] ↔ [Convex Real-time DB] → [Convex Functions]
                                      → [Convex File Storage]
```

## Phase 1: 基礎実装（1-2週間）

### 目標
- Convexの基本セットアップ
- ジョブ管理システムの移行
- リアルタイム更新の実装

### 実装タスク

#### 1.1 Convexプロジェクトのセットアップ

```bash
# パッケージのインストール
cd packages/web
npm install convex
npx convex dev
```

#### 1.2 スキーマ定義

`convex/schema.ts`:
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  jobs: defineTable({
    // ジョブの基本情報
    status: v.union(
      v.literal("queued"),
      v.literal("parsing"),
      v.literal("analyzing_memo"),
      v.literal("generating_script"),
      v.literal("script_ready"),
      v.literal("synthesizing_voice"),
      v.literal("mixing_audio"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.number(),
    progressMessage: v.string(),
    
    // 入力データ
    memoContent: v.string(),
    memoDate: v.optional(v.string()),
    
    // 生成結果
    scriptData: v.optional(v.object({
      sections: v.array(v.object({
        speaker: v.string(),
        text: v.string(),
      })),
      title: v.string(),
      summary: v.string(),
    })),
    
    // 音声ファイル情報（Phase 1では仮のURL）
    audioUrl: v.optional(v.string()),
    
    // エラー情報
    error: v.optional(v.object({
      message: v.string(),
      code: v.optional(v.string()),
    })),
    
    // タイムスタンプ
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_created", ["createdAt"])
    .index("by_status", ["status"]),
    
  // 設定情報の保存（オプション）
  userPreferences: defineTable({
    radioShowName: v.string(),
    personalitySettings: v.object({
      host1: v.object({
        name: v.string(),
        voiceName: v.string(),
        character: v.string(),
      }),
      host2: v.object({
        name: v.string(),
        voiceName: v.string(),
        character: v.string(),
      }),
    }),
  }),
});
```

#### 1.3 Convex関数の実装

`convex/jobs.ts`:
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ジョブの作成
export const createJob = mutation({
  args: {
    memoContent: v.string(),
    memoDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("jobs", {
      status: "queued",
      progress: 0,
      progressMessage: "処理を開始しています...",
      memoContent: args.memoContent,
      memoDate: args.memoDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return jobId;
  },
});

// ジョブステータスの更新
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    status: v.string(),
    progress: v.number(),
    progressMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status as any,
      progress: args.progress,
      progressMessage: args.progressMessage,
      updatedAt: Date.now(),
    });
  },
});

// ジョブの取得
export const getJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

// 台本データの保存
export const saveScriptData = mutation({
  args: {
    jobId: v.id("jobs"),
    scriptData: v.object({
      sections: v.array(v.object({
        speaker: v.string(),
        text: v.string(),
      })),
      title: v.string(),
      summary: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      scriptData: args.scriptData,
      status: "script_ready",
      updatedAt: Date.now(),
    });
  },
});

// エラーの記録
export const recordError = mutation({
  args: {
    jobId: v.id("jobs"),
    error: v.object({
      message: v.string(),
      code: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "failed",
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

// 古いジョブのクリーンアップ
export const cleanupOldJobs = mutation({
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const oldJobs = await ctx.db
      .query("jobs")
      .withIndex("by_created")
      .filter((q) => q.lt(q.field("createdAt"), oneDayAgo))
      .collect();
    
    for (const job of oldJobs) {
      await ctx.db.delete(job._id);
    }
    
    return oldJobs.length;
  },
});
```

#### 1.4 API Routes の更新

`app/api/analyze/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convexでジョブを作成
    const jobId = await convex.mutation(api.jobs.createJob, {
      memoContent: body.memoContent,
      memoDate: body.memoDate,
    });
    
    // バックグラウンド処理を開始（非同期）
    processJob(jobId, body.memoContent);
    
    return Response.json({ jobId });
  } catch (error) {
    console.error("Error creating job:", error);
    return Response.json(
      { error: "ジョブの作成に失敗しました" },
      { status: 500 }
    );
  }
}

async function processJob(jobId: string, memoContent: string) {
  try {
    // メモ解析
    await convex.mutation(api.jobs.updateJobStatus, {
      jobId,
      status: "parsing",
      progress: 10,
      progressMessage: "メモを解析しています...",
    });
    
    // PersonalCastコアの処理を実行
    const personalCast = new PersonalCast();
    const result = await personalCast.generateFromText(memoContent);
    
    // 台本データを保存
    await convex.mutation(api.jobs.saveScriptData, {
      jobId,
      scriptData: {
        sections: result.script.sections,
        title: result.script.title,
        summary: result.script.summary,
      },
    });
    
    // Phase 1では音声ファイルは従来通りローカルに保存
    // Phase 2で移行
    
  } catch (error) {
    await convex.mutation(api.jobs.recordError, {
      jobId,
      error: {
        message: error instanceof Error ? error.message : "不明なエラー",
      },
    });
  }
}
```

#### 1.5 フロントエンドの更新

`components/AnalysisProgress.tsx`:
```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface AnalysisProgressProps {
  jobId: Id<"jobs">;
}

export function AnalysisProgress({ jobId }: AnalysisProgressProps) {
  // Convexが自動的にリアルタイム更新を処理
  const job = useQuery(api.jobs.getJob, { jobId });
  
  if (!job) {
    return <div>読み込み中...</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{job.progressMessage}</span>
        <span className="text-sm text-gray-500">{job.progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${job.progress}%` }}
        />
      </div>
      
      {job.status === "failed" && job.error && (
        <div className="text-red-600 text-sm">
          エラー: {job.error.message}
        </div>
      )}
    </div>
  );
}
```

### Phase 1の成果物

1. **Convexによるジョブ管理**
   - 永続的なジョブデータ保存
   - リアルタイムステータス更新
   - 自動クリーンアップ機能

2. **改善されたユーザー体験**
   - ポーリング不要のリアルタイム更新
   - より信頼性の高いエラーハンドリング
   - ページリロード後も進捗確認可能

## Phase 2: ストレージ移行（1週間）

### 目標
- ファイルアップロードのConvex移行
- 音声ファイルのクラウドストレージ化
- CDN配信の実装

### 実装タスク

#### 2.1 ファイルストレージ用スキーマの追加

`convex/schema.ts` (追加):
```typescript
// 既存のスキーマに追加
audioFiles: defineTable({
  jobId: v.id("jobs"),
  storageId: v.string(),
  fileName: v.string(),
  mimeType: v.string(),
  size: v.number(),
  uploadedAt: v.number(),
})
  .index("by_job", ["jobId"]),

memoFiles: defineTable({
  jobId: v.id("jobs"),
  storageId: v.string(),
  fileName: v.string(),
  mimeType: v.string(),
  uploadedAt: v.number(),
})
  .index("by_job", ["jobId"]),
```

#### 2.2 ファイルアップロード関数

`convex/files.ts`:
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// メモファイルのアップロード
export const uploadMemoFile = mutation({
  args: {
    jobId: v.id("jobs"),
    storageId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("memoFiles", {
      jobId: args.jobId,
      storageId: args.storageId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      uploadedAt: Date.now(),
    });
  },
});

// 音声ファイルの保存
export const saveAudioFile = mutation({
  args: {
    jobId: v.id("jobs"),
    storageId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    // ファイル情報を保存
    await ctx.db.insert("audioFiles", {
      jobId: args.jobId,
      storageId: args.storageId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      size: args.size,
      uploadedAt: Date.now(),
    });
    
    // ジョブにURLを設定
    const url = await ctx.storage.getUrl(args.storageId);
    if (url) {
      await ctx.db.patch(args.jobId, {
        audioUrl: url,
        status: "completed",
        completedAt: Date.now(),
      });
    }
  },
});

// ファイルURLの取得
export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// ジョブに関連するファイルの削除
export const deleteJobFiles = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    // 音声ファイルの削除
    const audioFiles = await ctx.db
      .query("audioFiles")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();
    
    for (const file of audioFiles) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }
    
    // メモファイルの削除
    const memoFiles = await ctx.db
      .query("memoFiles")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();
    
    for (const file of memoFiles) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }
  },
});
```

#### 2.3 Convex Action による音声生成処理

`convex/actions.ts`:
```typescript
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const processAudioGeneration = action({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    try {
      // ジョブ情報を取得
      const job = await ctx.runQuery(api.jobs.getJob, { jobId: args.jobId });
      if (!job || !job.scriptData) {
        throw new Error("ジョブまたは台本データが見つかりません");
      }
      
      // 音声合成の進捗更新
      await ctx.runMutation(api.jobs.updateJobStatus, {
        jobId: args.jobId,
        status: "synthesizing_voice",
        progress: 70,
        progressMessage: "音声を生成しています...",
      });
      
      // PersonalCastコアを使用して音声生成
      // (実際の実装ではPersonalCastのインポートと設定が必要)
      const audioBuffer = await generateAudioFromScript(job.scriptData);
      
      // 音声をConvexストレージに保存
      const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const storageId = await ctx.storage.store(blob);
      
      // ファイル情報を保存
      await ctx.runMutation(api.files.saveAudioFile, {
        jobId: args.jobId,
        storageId,
        fileName: `${args.jobId}.mp3`,
        mimeType: "audio/mpeg",
        size: audioBuffer.byteLength,
      });
      
    } catch (error) {
      await ctx.runMutation(api.jobs.recordError, {
        jobId: args.jobId,
        error: {
          message: error instanceof Error ? error.message : "音声生成エラー",
          code: "AUDIO_GENERATION_ERROR",
        },
      });
    }
  },
});
```

#### 2.4 アップロードAPIの更新

`app/api/analyze/upload/route.ts`:
```typescript
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return Response.json(
        { error: "ファイルがありません" },
        { status: 400 }
      );
    }
    
    // ファイルをConvexストレージにアップロード
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const storageId = await convex.storage.store(blob);
    
    // ファイル内容を読み取り
    const memoContent = await file.text();
    
    // ジョブを作成
    const jobId = await convex.mutation(api.jobs.createJob, {
      memoContent,
    });
    
    // ファイル情報を保存
    await convex.mutation(api.files.uploadMemoFile, {
      jobId,
      storageId,
      fileName: file.name,
      mimeType: file.type,
    });
    
    // 音声生成処理を開始
    await convex.action(api.actions.processAudioGeneration, { jobId });
    
    return Response.json({ jobId });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
```

#### 2.5 StorageAdapter の Convex実装

`lib/storage/ConvexStorageAdapter.ts`:
```typescript
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export class ConvexStorageAdapter implements StorageAdapter {
  private convex: ConvexHttpClient;
  
  constructor(convexUrl: string) {
    this.convex = new ConvexHttpClient(convexUrl);
  }
  
  async saveFile(
    path: string,
    content: Buffer | string,
    options?: { contentType?: string }
  ): Promise<string> {
    const blob = new Blob(
      [typeof content === "string" ? content : content],
      { type: options?.contentType || "application/octet-stream" }
    );
    
    const storageId = await this.convex.storage.store(blob);
    const url = await this.convex.storage.getUrl(storageId);
    
    return url || "";
  }
  
  async getFile(path: string): Promise<Buffer> {
    // Convexでは直接ストレージIDが必要なため、
    // 実際の実装ではpathからstorageIdを解決する必要があります
    throw new Error("Not implemented for direct file access");
  }
  
  async deleteFile(path: string): Promise<void> {
    // Convexでは直接ストレージIDが必要
    throw new Error("Not implemented for direct file deletion");
  }
  
  async getFileUrl(storageId: string): Promise<string> {
    const url = await this.convex.query(api.files.getFileUrl, { storageId });
    return url || "";
  }
  
  async cleanupOldFiles(): Promise<void> {
    await this.convex.mutation(api.jobs.cleanupOldJobs);
  }
}
```

### Phase 2の成果物

1. **完全なクラウドストレージ移行**
   - ローカルファイルシステムへの依存を排除
   - CDN経由での高速ファイル配信
   - 自動ファイルクリーンアップ

2. **スケーラブルなアーキテクチャ**
   - 複数サーバーでの運用が可能
   - ファイルサイズ制限の緩和
   - より効率的なリソース利用

## 環境変数の設定

`.env.local`:
```bash
# Convex設定
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# 既存の設定
GEMINI_API_KEY=your-gemini-api-key

# Phase 2完了後は以下は不要
# USE_CLOUD_STORAGE=false
# LOCAL_TEMP_DIR=./temp
# LOCAL_OUTPUT_DIR=./output
```

## 移行チェックリスト

### Phase 1
- [ ] Convexプロジェクトのセットアップ
- [ ] スキーマ定義の作成
- [ ] ジョブ管理関数の実装
- [ ] API Routesの更新
- [ ] フロントエンドコンポーネントの更新
- [ ] リアルタイム更新の動作確認
- [ ] エラーハンドリングのテスト

### Phase 2
- [ ] ファイルストレージスキーマの追加
- [ ] ファイルアップロード関数の実装
- [ ] Convex Actionによる音声生成
- [ ] StorageAdapterのConvex実装
- [ ] ファイルアップロードAPIの更新
- [ ] CDN配信の動作確認
- [ ] 自動クリーンアップのテスト

## テスト計画

### Phase 1のテスト
1. ジョブ作成とステータス更新
2. リアルタイム更新の確認
3. エラーハンドリング
4. 複数ジョブの同時処理

### Phase 2のテスト
1. ファイルアップロード（各形式）
2. 音声ファイル生成と保存
3. CDN経由でのファイル配信
4. ファイルクリーンアップ
5. 大容量ファイルの処理

## リスクと対策

1. **データ移行**
   - リスク: 既存のジョブデータの消失
   - 対策: Phase 1では新規ジョブのみConvexで処理

2. **パフォーマンス**
   - リスク: API呼び出しの増加による遅延
   - 対策: Convexの最適化されたリアルタイム同期を活用

3. **コスト**
   - リスク: 使用量増加による料金発生
   - 対策: 無料枠内での運用監視、使用量アラート設定

## まとめ

Phase 1とPhase 2の実装により、PersonalCast Web版は以下の改善を実現します：

- **信頼性向上**: データの永続化とエラー耐性
- **スケーラビリティ**: クラウドネイティブなアーキテクチャ
- **開発効率**: リアルタイム同期の自動化
- **運用コスト削減**: 自動クリーンアップとCDN配信

これらの改善により、PersonalCastはより堅牢で拡張性の高いサービスへと進化します。