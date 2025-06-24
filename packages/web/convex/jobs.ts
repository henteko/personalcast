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

// 完了の記録
export const completeJob = mutation({
  args: {
    jobId: v.id("jobs"),
    audioUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "completed",
      audioUrl: args.audioUrl,
      completedAt: Date.now(),
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