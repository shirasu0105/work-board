import { cn } from "@/lib/cn";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/types/task";

export type StatusBadgeProps = {
  status: TaskStatus;
  className?: string;
};

/**
 * タスクステータスのピルバッジ（DESIGN.md §4 Pill Badge Button / sketch-prims StatusChip 参考）。
 *
 * 5 種を色分け:
 * - 未着手(todo): ニュートラル（warm gray）
 * - 対応中(doing): アクセント青
 * - 待ち(waiting): 警告オレンジ
 * - 保留(paused): ミュート
 * - 完了(done): 成功グリーン
 */
const TONE_CLASSES: Record<TaskStatus, string> = {
  todo: "bg-paper-2 text-ink-2",
  doing: "bg-accent-bg text-[color:var(--accent-focus)]",
  waiting: "bg-[#fdecd9] text-[color:var(--warning)]",
  paused: "bg-paper-2 text-ink-3",
  done: "bg-[#e8f7eb] text-[color:var(--success)]",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      data-testid="task-status-badge"
      data-status={status}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5",
        "text-[11px] font-semibold tracking-[0.02em] leading-none whitespace-nowrap",
        TONE_CLASSES[status],
        className
      )}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
