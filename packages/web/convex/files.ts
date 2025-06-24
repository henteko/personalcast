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
        updatedAt: Date.now(),
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

// ジョブに関連するファイルの取得
export const getJobFiles = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const audioFiles = await ctx.db
      .query("audioFiles")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();
    
    const memoFiles = await ctx.db
      .query("memoFiles")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();
    
    return {
      audioFiles,
      memoFiles,
    };
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