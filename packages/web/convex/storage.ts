import { v } from "convex/values";
import { query } from "./_generated/server";

// ジョブIDから音声ファイルのURLを取得
export const getAudioUrlByJobId = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    // ジョブを取得
    const job = await ctx.db.get(args.jobId);
    if (!job || !job.audioUrl) {
      return null;
    }
    
    // 音声ファイル情報を取得
    const audioFile = await ctx.db
      .query("audioFiles")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (!audioFile) {
      return job.audioUrl; // フォールバック用
    }
    
    // Convexストレージから最新のURLを取得
    const url = await ctx.storage.getUrl(audioFile.storageId);
    return url || job.audioUrl;
  },
});