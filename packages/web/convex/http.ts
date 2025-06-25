import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// ファイルアップロード用のHTTPエンドポイント
const uploadFile = httpAction(async (ctx, request) => {
  // CORSヘッダーを設定
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  // OPTIONSリクエストの処理
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  try {
    // FormDataからファイルを取得
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const jobId = formData.get("jobId") as string;
    
    if (!file || !jobId) {
      return new Response(
        JSON.stringify({ error: "File and jobId are required" }),
        { status: 400, headers }
      );
    }
    
    // Fileオブジェクトを直接Convexストレージに保存
    const storageId = await ctx.storage.store(file);
    
    // ファイル情報をデータベースに記録
    await ctx.runMutation(api.files.uploadMemoFile, {
      jobId: jobId as any,
      storageId,
      fileName: file.name,
      mimeType: file.type,
    });
    
    return new Response(
      JSON.stringify({ storageId }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: "Upload failed" }),
      { status: 500, headers }
    );
  }
});

// HTTPルーターの設定
const http = httpRouter();

http.route({
  path: "/upload",
  method: "POST",
  handler: uploadFile,
});

http.route({
  path: "/upload",
  method: "OPTIONS",
  handler: uploadFile,
});

export default http;