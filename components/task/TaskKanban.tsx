"use client";

import { cn } from "@/lib/cn";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskDTO,
} from "@/lib/types/task";
import { Chip } from "@/components/ui/Chip";

export type TaskKanbanProps = {
  tasks: TaskDTO[];
  busyId?: string | null;
  /** カードクリックで編集ダイアログを開く */
  onEdit: (id: string) => void;
};

/**
 * タスクかんばん表示（要件書 §10.5）。
 * 「未着手 / 対応中 / 待ち / 保留 / 完了」の 5 列を横並びにし、
 * 各タスクを現在のステータスの列に配置する。
 * 各列ヘッダに件数を表示。1280px 幅で 5 列が横並びになる。
 */
export function TaskKanban({ tasks, busyId, onEdit }: TaskKanbanProps) {
  // ステータスごとにグルーピング（displayOrder は listTasks 側で整列済み）
  const grouped = TASK_STATUSES.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    items: tasks.filter((t) => t.status === status),
  }));

  return (
    <div
      data-testid="task-kanban"
      className={cn(
        // 1280px 幅で 5 列が横並び。狭い幅では横スクロール。
        "grid grid-cols-5 gap-3 min-w-[1000px]"
      )}
    >
      {grouped.map((col) => (
        <section
          key={col.status}
          data-testid="kanban-column"
          data-status={col.status}
          className={cn(
            "flex flex-col rounded-[12px] border-whisper bg-paper-2/60",
            "max-h-[70vh]"
          )}
        >
          <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[color:var(--border-whisper)]">
            <span className="text-[13px] font-semibold text-ink">
              {col.label}
            </span>
            <span
              data-testid="kanban-count"
              data-status={col.status}
              className={cn(
                "inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5",
                "text-[11px] font-semibold text-ink-2 bg-paper border-whisper"
              )}
            >
              {col.items.length}
            </span>
          </header>

          {/* 各列内は縦スクロールのみ */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-2">
            {col.items.length === 0 ? (
              <p className="px-1 py-4 text-center text-[12px] text-ink-3">
                なし
              </p>
            ) : (
              col.items.map((t) => {
                const isBusy = busyId === t.id;
                const isDone = t.status === "done";
                return (
                  <button
                    key={t.id}
                    type="button"
                    data-testid="kanban-card"
                    data-task-id={t.id}
                    data-status={t.status}
                    disabled={isBusy}
                    onClick={() => onEdit(t.id)}
                    className={cn(
                      "w-full rounded-[8px] border-whisper bg-paper px-3 py-2 text-left shadow-card",
                      "transition-colors hover:bg-paper-2",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus",
                      "disabled:opacity-60 disabled:cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "block text-[13px] leading-snug",
                        isDone
                          ? "text-ink-3 line-through"
                          : "text-ink font-medium"
                      )}
                    >
                      {t.title}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Chip className="text-ink-3">{t.categoryName}</Chip>
                      {t.projectName ? (
                        <Chip className="text-ink-3">{t.projectName}</Chip>
                      ) : null}
                    </span>
                    {t.waiting ? (
                      <span className="mt-1.5 block text-[11px] text-[color:var(--warning)]">
                        {t.waiting.partner} 待ち・{t.waiting.waitingDays} 日
                      </span>
                    ) : null}
                    {t.dueDate ? (
                      <span className="mt-1 block text-[11px] text-ink-3">
                        期限 {formatDate(t.dueDate)}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </section>
      ))}
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
