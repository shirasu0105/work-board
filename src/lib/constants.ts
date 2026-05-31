/** タスクのステータス（SPEC §3.3）。かんばん列順とも一致。 */
export const TASK_STATUSES = ["未着手", "対応中", "待ち", "保留", "完了"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** プロジェクトのステータス。 */
export const PROJECT_STATUSES = ["active", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** ステータスごとの Badge トーン対応。 */
export const TASK_STATUS_TONE: Record<
  TaskStatus,
  "neutral" | "primary" | "warning" | "hold" | "success"
> = {
  未着手: "neutral",
  対応中: "primary",
  待ち: "warning",
  保留: "hold",
  完了: "success",
};
