import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // 静的生成エラーをスキップ
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Cloud Run用の設定
  output: 'standalone',
  // 環境変数からポートを取得
  ...(process.env.PORT && {
    env: {
      PORT: process.env.PORT,
    },
  }),
  // プロダクションビルド時に静的生成を無効化
  ...(process.env.SKIP_BUILD_STATIC_GENERATION === 'true' && {
    generateStaticParams: false,
    generateBuildId: async () => 'build',
  }),
};

export default nextConfig;
