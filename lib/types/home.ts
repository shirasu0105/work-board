/**
 * ホーム画面の集約データ型（Phase 7 / 要件書 §10.1）。
 */

import type { TaskDTO } from "./task";

/** 最近のメモ（ホーム表示用の軽量サマリ）。 */
export type RecentMemoSummary = {
  id: string;
  title: string;
  /** メモ種別（MemoKind） */
  kind: string;
  updatedAt: string;
};

/** 進行中プロジェクト（ホーム表示用の軽量サマリ）。 */
export type ActiveProjectSummary = {
  id: string;
  name: string;
  categoryName: string;
  /** タスク進捗率（0-100） */
  progress: number;
};

/** ホーム画面の集約データ。 */
export type HomeData = {
  /** 表示対象日の日付キー（YYYY-MM-DD） */
  targetDate: string;
  /** 今日やること（前日の日次ジャーナルで選んだ未完了タスク） */
  todayTasks: TaskDTO[];
  /** 確認予定日を迎えた待ち（reviewAt <= 対象日 の待ちタスク） */
  dueWaitings: TaskDTO[];
  /** Inbox 未整理件数 */
  inboxCount: number;
  /** 進行中プロジェクト一覧 */
  activeProjects: ActiveProjectSummary[];
  /** 最近のメモ */
  recentMemos: RecentMemoSummary[];
};
