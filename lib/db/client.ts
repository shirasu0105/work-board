import { PrismaClient } from "@prisma/client";

/**
 * Prisma クライアントのシングルトン。
 *
 * Next.js dev サーバの HMR でモジュールが再評価されると、
 * 都度 `new PrismaClient()` してしまい接続が増殖する。
 * `globalThis` を経由して 1 インスタンスに固定する。
 *
 * SQLite 接続文字列は `DATABASE_URL`（package.json の scripts で `file:./prisma/dev.db` を渡す）。
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
