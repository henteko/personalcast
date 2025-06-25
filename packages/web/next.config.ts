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
};

export default nextConfig;
