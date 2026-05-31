import { defineConfig, devices } from "@playwright/test";

const PORT = 3110;
const TEST_DB = "./data/e2e.db";

export default defineConfig({
  testDir: "./tests/e2e",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // テスト用 DB を構築してから dev サーバを起動する（テーブル存在を保証）
    command: `node tests/e2e/setup-db.cjs && npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { WORK_BOARD_DB: TEST_DB },
  },
});
