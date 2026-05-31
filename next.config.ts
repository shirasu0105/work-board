import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 はネイティブモジュール。Server Components のバンドル対象から外し、
  // ネイティブ require をそのまま使う（Next 既定リストにも含まれるが明示しておく）。
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
