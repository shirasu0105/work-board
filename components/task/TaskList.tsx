"use client";

import { cn } from "@/lib/cn";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskDTO,
  type TaskStatus,
} from "@/lib/types/task";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatusBadge } from "./StatusBadge";

export type TaskListProps = {
  tasks: TaskDTO[];
  busyId?: string | null;
  onToggleComplete: (task: TaskDTO) => void;
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

/**
 * タスク一覧（リスト表示）。
 * 各行: チェックボックス / タイトル / ステータスバッジ＋変更プルダウン / カテゴリ / プロジェクト / 期限 / 操作。
 * `screens-2.jsx` TasksListScreen を Notion 風に再現。
 */
export function TaskList({
  tasks,
  busyId,
  onToggleComplete,
  onChangeStatus,
  onEdit,
  onDelete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div
        data-testid="task-empty"
        className={cn(
          "rounded-[12px] border-whisper bg-paper px-6 py-10 text-center"
        )}
      >
        <p className="text-[14px] text-ink">タスクがまだありません。</p>
        <p className="mt-1 text-[12px] text-ink-2">
          右上の「＋ タスク追加」から作成してください。
        </p>
      </div>
    );
  }

  return (
    <div
      role="table"
      aria-label="タスク一覧"
      data-testid="task-table"
      className={cn(
        "overflow-hidden rounded-[12px] border-whisper bg-paper shadow-card"
      )}
    >
      <ul className="divide-y divide-[color:var(--border-whisper)]">
        {tasks.map((t) => {
          const isBusy = busyId === t.id;
          const isDone = t.status === "done";
          return (
            <li
              key={t.id}
              data-testid="task-row"
              data-task-id={t.id}
              data-status={t.status}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-opacity",
                isBusy && "opacity-60"
              )}
            >
              {/* 完了チェックボックス */}
              <input
                type="checkbox"
                checked={isDone}
                disabled={isBusy}
                aria-label={`「${t.title}」を完了にする`}
                data-testid="task-complete-checkbox"
                onChange={() => onToggleComplete(t)}
                className="h-4 w-4 shrink-0 accent-[color:var(--accent)] cursor-pointer disabled:cursor-not-allowed"
              />

              {/* タイトル */}
              <span
                data-testid="task-title"
                className={cn(
                  "min-w-[160px] flex-1 truncate text-[14px]",
                  isDone
                    ? "text-ink-3 line-through"
                    : "text-ink font-medium"
                )}
                title={t.title}
              >
                {t.title}
              </span>

              {/* カテゴリ */}
              <Chip data-testid="task-category">{t.categoryName}</Chip>

              {/* プロジェクト（あれば） */}
              {t.projectName ? (
                <Chip data-testid="task-project" className="text-ink-3">
                  {t.projectName}
                </Chip>
              ) : null}

              {/* 期限（あれば） */}
              {t.dueDate ? (
                <span
                  data-testid="task-due"
                  className="text-[12px] text-ink-2 whitespace-nowrap"
                >
                  期限 {formatDate(t.dueDate)}
                </span>
              ) : null}

              {/* ステータスバッジ */}
              <StatusBadge status={t.status} />

              {/* ステータス変更プルダウン */}
              <label className="sr-only" htmlFor={`status-${t.id}`}>
                {`「${t.title}」のステータス`}
              </label>
              <select
                id={`status-${t.id}`}
                value={t.status}
                disabled={isBusy}
                aria-label={`「${t.title}」のステータスを変更`}
                data-testid="task-status-select"
                onChange={(e) =>
                  onChangeStatus(t.id, e.target.value as TaskStatus)
                }
                className={cn(
                  "rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2 py-1",
                  "text-[12px] text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>

              {/* 操作 */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`「${t.title}」を編集`}
                  disabled={isBusy}
                  onClick={() => onEdit(t.id)}
                  data-testid="task-edit-button"
                >
                  編集
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`「${t.title}」を削除`}
                  disabled={isBusy}
                  onClick={() => onDelete(t.id)}
                  data-testid="task-delete-button"
                  className="text-[color:var(--warning)]"
                >
                  削除
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}
