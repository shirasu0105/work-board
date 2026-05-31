// テスト用 DB をマイグレーション SQL から構築し、最低限のシードを入れる。
// webServer 起動前にこのスクリプトを実行し、サーバ初回リクエスト時にテーブルが存在する状態を保証する。
const Database = require("better-sqlite3");
const { readFileSync, readdirSync, rmSync, existsSync } = require("node:fs");
const { randomUUID } = require("node:crypto");

const TEST_DB = process.env.WORK_BOARD_DB || "./data/e2e.db";

for (const f of [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`]) {
  if (existsSync(f)) rmSync(f);
}

const db = new Database(TEST_DB);
const files = readdirSync("./drizzle")
  .filter((f) => f.endsWith(".sql"))
  .sort();
for (const file of files) {
  const sql = readFileSync(`./drizzle/${file}`, "utf8");
  for (const stmt of sql.split("--> statement-breakpoint")) {
    const s = stmt.trim();
    if (s) db.exec(s);
  }
}

const now = new Date().toISOString();
db.prepare(
  "insert into categories (id,name,display_order,is_active,created_at,updated_at) values (?,?,?,?,?,?)",
).run(randomUUID(), "テスト", 0, 1, now, now);
db.close();

console.log(`[e2e] test DB ready: ${TEST_DB}`);
