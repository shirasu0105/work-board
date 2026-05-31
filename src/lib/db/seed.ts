/**
 * サンプルシード。`npm run db:seed` で実行。
 * 既存データがある場合は重複投入を避けるため、空のときのみ投入する。
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_PATH = process.env.WORK_BOARD_DB ?? "./data/work-board.db";
const dir = dirname(DB_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

const now = new Date().toISOString();
const id = () => randomUUID();

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function main() {
  const existing = db.select().from(schema.categories).all();
  if (existing.length > 0) {
    console.log("既にデータが存在するためシードをスキップします。");
    return;
  }

  // カテゴリ
  const catWork = id();
  const catPrivate = id();
  const catStudy = id();
  db.insert(schema.categories)
    .values([
      { id: catWork, name: "仕事", description: "業務関連", displayOrder: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: catPrivate, name: "プライベート", description: "私用", displayOrder: 1, isActive: true, createdAt: now, updatedAt: now },
      { id: catStudy, name: "学習", description: "自己研鑽", displayOrder: 2, isActive: true, createdAt: now, updatedAt: now },
    ])
    .run();

  // プロジェクト
  const projSite = id();
  const projOnboard = id();
  db.insert(schema.projects)
    .values([
      {
        id: projSite,
        name: "社内ポータル刷新",
        categoryId: catWork,
        purpose: "情報集約と業務効率化",
        completionCondition: "新ポータルが全社公開され旧サイトを停止",
        dueDate: daysFromNow(30),
        status: "active",
        displayOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: projOnboard,
        name: "新人オンボーディング整備",
        categoryId: catWork,
        purpose: "立ち上がり期間の短縮",
        completionCondition: "オンボード資料一式が完成",
        status: "active",
        displayOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .run();

  // タスク
  db.insert(schema.tasks)
    .values([
      {
        id: id(),
        name: "要件ヒアリングを実施",
        categoryId: catWork,
        projectId: projSite,
        dueDate: daysFromNow(3),
        plannedDate: daysFromNow(0),
        status: "対応中",
        displayOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: id(),
        name: "デザインカンプのレビュー依頼",
        categoryId: catWork,
        projectId: projSite,
        status: "待ち",
        waitingFor: "デザインチーム",
        waitingReason: "カンプ提出待ち",
        waitingCheckDate: daysFromNow(2),
        waitingStartedAt: now,
        displayOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: id(),
        name: "オンボード資料の目次作成",
        categoryId: catWork,
        projectId: projOnboard,
        status: "未着手",
        displayOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: id(),
        name: "経費精算を提出",
        categoryId: catWork,
        dueDate: daysFromNow(1),
        plannedDate: daysFromNow(0),
        status: "未着手",
        displayOrder: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: id(),
        name: "技術書を1章読む",
        categoryId: catStudy,
        status: "未着手",
        displayOrder: 4,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .run();

  console.log("シード投入完了: カテゴリ3 / プロジェクト2 / タスク5");
}

main();
sqlite.close();
