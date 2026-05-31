/**
 * タスク抽出の純粋ロジック（ユニットテスト対象）。
 * 文字列日付（YYYY-MM-DD）の比較で完結させ、タイムゾーン計算に依存しない。
 */

interface TaskLike {
  status: string;
  plannedDate?: string | null;
  waitingCheckDate?: string | null;
}

/** 今日やること: 未完了 かつ planned_date が今日。 */
export function extractTodayTasks<T extends TaskLike>(tasks: T[], today: string): T[] {
  return tasks.filter(
    (t) => t.status !== "完了" && (t.plannedDate ?? "").slice(0, 10) === today,
  );
}

/** 確認予定日を迎えた待ちタスク: status==待ち かつ check_date <= 今日。 */
export function extractWaitingToCheck<T extends TaskLike>(tasks: T[], today: string): T[] {
  return tasks.filter(
    (t) =>
      t.status === "待ち" &&
      !!t.waitingCheckDate &&
      t.waitingCheckDate.slice(0, 10) <= today,
  );
}
