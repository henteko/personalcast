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
  
  // Phase 2: ファイルストレージ
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
});