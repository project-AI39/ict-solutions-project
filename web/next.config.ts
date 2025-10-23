import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // 追加の副作用警告 (development)
  images: {
    // 画像外部ドメインを許可する場合に記載 (例)
    // domains: ["example.com"],
  },
  // セキュリティヘッダを Caddy と二重にしないため Next.js 側は最小化 (APIRoute で必要な物だけ付与する方針)
  async headers() {
    return [];
  },
};

export default nextConfig;
