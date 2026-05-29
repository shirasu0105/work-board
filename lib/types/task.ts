/**
 * タスク関連の型定義とステータス enum 相当。
 *
 * SQLite は enum を持たないため、status は String 列に保存する。
 * ここで `as const` の値オブジェクトとユニオン型で「未着手 / 対応中 / 待ち / 保留 / 完了」の
 * 5 値に型レベルで限定する（要件書 §10.5.4）。
 */

export const TASK_STATUSES = [
  "todo",
  "doing",
  "waiting",
  "paused",
  "done",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/** ステータスの日本語ラベル（要件書 §10.5.4）。 */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未着手",
  doing: "対応中",
  waiting: "待ち",
  paused: "保留",
  done: "完了",
};

/** 任意の値が TaskStatus かどうかの型ガード。 */
export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * タスク一覧画面で「未着手 / 対応中 / 待ち / 保留」を 1 グループ、「完了」を別グループとして扱うための補助。
 * 完了タスクの表示/非表示トグルに使う。
 */
export function isDoneStatus(status: TaskStatus): boolean {
  return status === "done";
}

/** API / Server から UI へ渡すタスク DTO。日時は ISO 文字列で正規化する。 */
export type TaskDTO = {
  id: string;
  title: string;
  note: string | null;
  dueDate: string | null;
  status: TaskStatus;
  displayOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  categoryName: string;
  projectId: string | null;
  projectName: string | null;
};
