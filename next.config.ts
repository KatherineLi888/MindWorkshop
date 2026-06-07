import type { NextConfig } from "next";

/**
 * 本地开发：严格检查类型与 lint，便于尽早发现问题。
 * 线上构建（Vercel / production）：保留 ignore，避免阻塞已上线版本的部署。
 */
const isProductionBuild =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL === "1" ||
  process.env.NETLIFY === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: isProductionBuild,
  },
  eslint: {
    ignoreDuringBuilds: isProductionBuild,
  },
};

export default nextConfig;
