import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 はネイティブモジュールのためサーバ側で外部化する
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
