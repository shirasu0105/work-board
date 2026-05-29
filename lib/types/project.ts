/**
 * プロジェクト関連の型定義とステータス enum 相当（要件書 §10.4）。
 *
 * SQLite は enum を持たないため、status は String 列に保存する。
 * ここで `as const` の値オブジェクトとユニオン型で 4 値に型レベルで限定する。
 */

export const PROJECT_STATUSES = [
  "active",
  "todo",
  "paused",
  "done",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** プロジェクトステータスの日本語ラベル。 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "進行中",
  todo: "未着手",
  paused: "保留",
  done: "完了",
};

/** 任意の値が ProjectStatus かどうかの型ガード。 */
export function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    typeof value === "string" &&
    (PROJECT_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * API / Server から UI へ渡すプロジェクト DTO。日時は ISO 文字列で正規化する。
 * `taskTotal` / `taskDone` / `progress` は紐づくタスクから集計した進捗。
 */
export type ProjectDTO = {
  id: string;
  name: string;
  purpose: string | null;
  /** 完了条件 */
  completion: string | null;
  dueDate: string | null;
  status: ProjectStatus;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  categoryName: string;
  /** 紐づくタスク総数 */
  taskTotal: number;
  /** 完了タスク数 */
  taskDone: number;
  /** 進捗パーセンテージ（0..100、四捨五入）。total=0 のとき 0。 */
  progress: number;
};
