import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StorageAdapter } from "./StorageAdapter";

export class ConvexStorageAdapter implements StorageAdapter {
  private convex: ConvexHttpClient;
  
  constructor(convexUrl: string) {
    this.convex = new ConvexHttpClient(convexUrl);
  }
  
  async save(path: string, data: Buffer): Promise<string> {
    // Convexでは直接ファイルパスベースの保存は行わない
    // 代わりにジョブIDとの紐付けで管理
    console.log(`ConvexStorageAdapter: save called for path ${path}`);
    // 実際の保存はactions.tsのprocessFileUploadで処理
    return path; // 仮の実装: pathを返す
  }
  
  async load(path: string): Promise<Buffer> {
    // Convexでは直接ストレージIDが必要なため、
    // pathからstorageIdを解決する必要があります
    throw new Error("ConvexStorageAdapter: Direct file read not supported. Use getFileUrl instead.");
  }
  
  async delete(path: string): Promise<void> {
    // Convexでは直接ストレージIDが必要
    console.log(`ConvexStorageAdapter: delete called for path ${path}`);
    // 実際の削除はfiles.tsのdeleteJobFilesで処理
  }
  
  async exists(path: string): Promise<boolean> {
    // Convexでは直接的なファイル存在確認は非対応
    return false;
  }
  
  async list(prefix?: string): Promise<string[]> {
    // Convexではジョブベースでファイルを管理
    return [];
  }
  
  async getUrl(path: string): Promise<string> {
    // Convexでは直接的なURL取得は非対応
    throw new Error("ConvexStorageAdapter: Direct URL generation not supported. Use getFileUrl with storageId instead.");
  }
  
  // Convex固有のメソッド
  async getFileUrl(storageId: string): Promise<string | null> {
    const url = await this.convex.query(api.files.getFileUrl, { storageId });
    return url;
  }
  
  async uploadFile(
    jobId: Id<"jobs">,
    fileData: string,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    const storageId = await this.convex.action(api.actions.processFileUpload, {
      jobId,
      fileData,
      fileName,
      mimeType,
    });
    return storageId;
  }
  
  async saveAudioFile(
    jobId: Id<"jobs">,
    storageId: string,
    fileName: string,
    mimeType: string,
    size: number
  ): Promise<void> {
    await this.convex.mutation(api.files.saveAudioFile, {
      jobId,
      storageId,
      fileName,
      mimeType,
      size,
    });
  }
  
  async getJobFiles(jobId: Id<"jobs">) {
    return await this.convex.query(api.files.getJobFiles, { jobId });
  }
  
  async deleteJobFiles(jobId: Id<"jobs">): Promise<void> {
    await this.convex.mutation(api.files.deleteJobFiles, { jobId });
  }
  
  async cleanupOldJobs(): Promise<void> {
    // TODO: cleanupOldJobsAndFiles が修正されたら有効化
    // await this.convex.action(api.actions.cleanupOldJobsAndFiles);
  }
}