import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

// PWA: 生产环境可取消注释并配置 next-pwa
// import withPWA from "next-pwa";
// export default withPWA({ dest: "public", register: true, skipWaiting: true })(nextConfig);
