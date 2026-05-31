import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * 全テーブル定義（SPEC §3）。
 * - id は文字列（uuid）
 * - created_at / updated_at は ISO 文字列
 * - 真偽値は integer(0/1)、論理削除/非表示は専用フラグで表現
 */

// 3.1 categories（カテゴリ）
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 3.2 projects（プロジェクト）
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  purpose: text("purpose"),
  completionCondition: text("completion_condition"),
  dueDate: text("due_date"),
  status: text("status").notNull().default("active"), // active / completed
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  completedAt: text("completed_at"),
});

// 3.3 tasks（タスク）— 待ち状態カラムを内包
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  projectId: text("project_id").references(() => projects.id),
  dueDate: text("due_date"),
  plannedDate: text("planned_date"), // 「今日/明日やること」の予定日
  memo: text("memo"),
  status: text("status").notNull().default("未着手"), // 未着手/対応中/待ち/保留/完了
  displayOrder: integer("display_order").notNull().default(0),
  sourceInboxId: text("source_inbox_id"),
  // 待ち関連
  waitingFor: text("waiting_for"),
  waitingReason: text("waiting_reason"),
  waitingCheckDate: text("waiting_check_date"),
  waitingRequestMemo: text("waiting_request_memo"),
  waitingStartedAt: text("waiting_started_at"),
  waitingEndedAt: text("waiting_ended_at"),
  waitingReplyMemo: text("waiting_reply_memo"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  completedAt: text("completed_at"),
});

// 3.4 inbox_items（Inbox）
export const inboxItems = sqliteTable("inbox_items", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  status: text("status").notNull().default("未整理"), // 未整理 / 整理済み
  organizedTo: text("organized_to"), // task / project / someday / deleted
  relatedId: text("related_id"),
  organizedAt: text("organized_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 3.5 someday_items（Someday/Maybe・簡易）
export const somedayItems = sqliteTable("someday_items", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  reason: text("reason"),
  reviewDate: text("review_date"),
  status: text("status").notNull().default("active"), // active / promoted / dropped
  sourceInboxId: text("source_inbox_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 3.6 memos（メモ）— 共通列 + 種別別 JSON
export const memos = sqliteTable("memos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  memoType: text("memo_type").notNull(), // minutes / tt / idea / research / worklog
  projectId: text("project_id").references(() => projects.id),
  content: text("content"), // 種別別項目を JSON 文字列で保持
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 3.7 daily_journals（日次ジャーナル）
export const dailyJournals = sqliteTable("daily_journals", {
  id: text("id").primaryKey(),
  journalDate: text("journal_date").notNull().unique(),
  todayComment: text("today_comment").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 3.8 weekly_reviews（週次レビュー・実施記録のみ）
export const weeklyReviews = sqliteTable("weekly_reviews", {
  id: text("id").primaryKey(),
  weekOf: text("week_of"),
  reviewedAt: text("reviewed_at").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type InboxItem = typeof inboxItems.$inferSelect;
export type SomedayItem = typeof somedayItems.$inferSelect;
export type Memo = typeof memos.$inferSelect;
export type DailyJournal = typeof dailyJournals.$inferSelect;
export type WeeklyReview = typeof weeklyReviews.$inferSelect;
