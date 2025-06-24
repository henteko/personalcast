import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// 音声生成処理のアクション
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
      
      // TODO: PersonalCastコアを使用して音声生成
      // 実際の実装では、ここでPersonalCastのAPIを呼び出して音声を生成
      // const audioBuffer = await generateAudioFromScript(job.scriptData);
      
      // 仮の実装：進捗を更新してミキシング段階へ
      await ctx.runMutation(api.jobs.updateJobStatus, {
        jobId: args.jobId,
        status: "mixing_audio",
        progress: 90,
        progressMessage: "音声を処理しています...",
      });
      
      // TODO: 音声をConvexストレージに保存
      // const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
      // const storageId = await ctx.storage.store(blob);
      
      // 仮の完了処理
      await ctx.runMutation(api.jobs.updateJobStatus, {
        jobId: args.jobId,
        status: "completed",
        progress: 100,
        progressMessage: "生成が完了しました",
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

// ファイルアップロード処理のアクション
export const processFileUpload = action({
  args: {
    jobId: v.id("jobs"),
    fileData: v.string(), // Base64エンコードされたファイルデータ
    fileName: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Base64データをバイナリに変換（Convex環境用）
      const binaryString = atob(args.fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Blobを作成
      const blob = new Blob([bytes], { type: args.mimeType });
      
      // Convexストレージに保存
      const storageId = await ctx.storage.store(blob);
      
      // ファイル情報を記録
      await ctx.runMutation(api.files.uploadMemoFile, {
        jobId: args.jobId,
        storageId,
        fileName: args.fileName,
        mimeType: args.mimeType,
      });
      
      return storageId;
    } catch (error) {
      throw new Error(`ファイルアップロードエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// 古いジョブとファイルのクリーンアップ
export const cleanupOldJobsAndFiles = action({
  handler: async (ctx) => {
    try {
      // 24時間以上前のジョブを取得
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      // 古いジョブのクリーンアップを実行
      const deletedCount = await ctx.runMutation(api.jobs.cleanupOldJobs);
      
      console.log(`${deletedCount}個の古いジョブを削除しました`);
      
      return deletedCount;
    } catch (error) {
      console.error("クリーンアップエラー:", error);
      throw error;
    }
  },
});