import { rmSync, existsSync } from "node:fs";

const TEST_DB = "./data/e2e.db";

export default function globalTeardown() {
  // サーバがファイルを掴んだまま終了するケースがあるため、削除失敗は無視する。
  // （次回実行時に setup-db.cjs が作り直すため問題ない）
  for (const f of [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`]) {
    try {
      if (existsSync(f)) rmSync(f);
    } catch {
      // ロック中などで削除できなくても致命的ではない
    }
  }
}
