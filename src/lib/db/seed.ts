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

  // Inbox（未整理）
  db.insert(schema.inboxItems)
    .values([
      { id: id(), content: "競合サービスの料金体系を調べる", status: "未整理", createdAt: now, updatedAt: now },
      { id: id(), content: "歯医者の予約を取る", status: "未整理", createdAt: now, updatedAt: now },
      { id: id(), content: "チームの振り返り会のテーマ案", status: "未整理", createdAt: now, updatedAt: now },
    ])
    .run();

  // Someday/Maybe
  db.insert(schema.somedayItems)
    .values([
      {
        id: id(),
        content: "英語のプレゼン講座を受講する",
        categoryId: catStudy,
        reason: "海外チームとの連携が増えそうなため",
        reviewDate: daysFromNow(30),
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ])
    .run();

  // メモ（種別サンプル）
  db.insert(schema.memos)
    .values([
      {
        id: id(),
        title: "キックオフMTG",
        categoryId: catWork,
        memoType: "minutes",
        projectId: projSite,
        content: JSON.stringify({
          datetime: "2026-05-30 14:00",
          participants: "田中, 佐藤",
          purpose: "要件確認",
          decisions: "スコープをMVPに限定",
          myNextAction: "議事録を共有する",
        }),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: id(),
        title: "状態管理ライブラリ比較",
        categoryId: catStudy,
        memoType: "research",
        content: JSON.stringify({
          content: "主要な状態管理手法を比較",
          findings: "サーバ状態とクライアント状態は分けて考えるのが定石",
          conclusion: "本件はServer Components中心で十分",
        }),
        createdAt: now,
        updatedAt: now,
      },
    ])
    .run();

  console.log(
    "シード投入完了: カテゴリ3 / プロジェクト2 / タスク5 / Inbox3 / Someday1 / メモ2",
  );
}

main();
sqlite.close();
