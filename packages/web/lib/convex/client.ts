import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Convex HTTP クライアントの初期化
export function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}

// ジョブ処理のヘルパー関数
export async function createConvexJob(memoContent: string, memoDate?: string) {
  const client = getConvexClient();
  const jobId = await client.mutation(api.jobs.createJob, {
    memoContent,
    memoDate,
  });
  return jobId;
}

export async function updateJobStatus(
  jobId: Id<"jobs">,
  status: string,
  progress: number,
  progressMessage: string
) {
  const client = getConvexClient();
  await client.mutation(api.jobs.updateJobStatus, {
    jobId,
    status,
    progress,
    progressMessage,
  });
}

export async function saveScriptData(
  jobId: Id<"jobs">,
  scriptData: {
    sections: Array<{ speaker: string; text: string }>;
    title: string;
    summary: string;
  }
) {
  const client = getConvexClient();
  await client.mutation(api.jobs.saveScriptData, {
    jobId,
    scriptData,
  });
}

export async function recordJobError(
  jobId: Id<"jobs">,
  error: { message: string; code?: string }
) {
  const client = getConvexClient();
  await client.mutation(api.jobs.recordError, {
    jobId,
    error,
  });
}

export async function completeJob(jobId: Id<"jobs">, audioUrl: string) {
  const client = getConvexClient();
  await client.mutation(api.jobs.completeJob, {
    jobId,
    audioUrl,
  });
}