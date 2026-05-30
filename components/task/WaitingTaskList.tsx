"use client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { formatLocalDate } from "@/lib/date";
import type { WaitingTaskDTO } from "@/lib/types/waiting";

export type WaitingTaskListProps = {
  items: WaitingTaskDTO[];
  busyId?: string | null;
  onRelease: (taskId: string) => void;
};

/**
 * 待ち専用一覧（要件書 §10.6.4）。
 * 各行に「タスク名 / 待ち相手 / 待ち理由 / 待ち開始日 / 確認予定日 / 待ち日数」を表示し、
 * 待ち解除アクションを提供する。
 */
export function WaitingTaskList({
  items,
  busyId,
  onRelease,
}: WaitingTaskListProps) {
  if (items.length === 0) {
    return (
      <div
        data-testid="waiting-empty"
        className={cn(
          "rounded-[12px] border-whisper bg-paper px-6 py-10 text-center"
        )}
      >
        <p className="text-[14px] text-ink">待ち状態のタスクはありません。</p>
        <p className="mt-1 text-[12px] text-ink-2">
          タスク画面でステータスを「待ち」にすると、ここに表示されます。
        </p>
      </div>
    );
  }

  return (
    <div
      role="table"
      aria-label="待ちタスク一覧"
      data-testid="waiting-table"
      className={cn(
        "overflow-hidden rounded-[12px] border-whisper bg-paper shadow-card"
      )}
    >
      <ul className="divide-y divide-[color:var(--border-whisper)]">
        {items.map((w) => {
          const isBusy = busyId === w.taskId;
          return (
            <li
              key={w.taskId}
              data-testid="waiting-row"
              data-task-id={w.taskId}
              className={cn(
                "flex flex-col gap-2 px-4 py-3 transition-opacity",
                isBusy && "opacity-60"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  data-testid="waiting-title"
                  className="min-w-[160px] flex-1 truncate text-[14px] font-medium text-ink"
                  title={w.title}
                >
                  {w.title}
                </span>
                <span
                  data-testid="waiting-days"
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5",
                    "text-[11px] font-semibold leading-none whitespace-nowrap",
                    "bg-[#fdecd9] text-[color:var(--warning)]"
                  )}
                >
                  待ち {w.waitingDays} 日
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isBusy}
                  onClick={() => onRelease(w.taskId)}
                  data-testid="waiting-release-button"
                  aria-label={`「${w.title}」の待ちを解除`}
                >
                  待ち解除
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-2">
                <span data-testid="waiting-partner">
                  待ち相手:{" "}
                  <span className="text-ink font-medium">{w.partner}</span>
                </span>
                <span data-testid="waiting-reason">
                  理由: <span className="text-ink">{w.reason}</span>
                </span>
                <span data-testid="waiting-started">
                  開始日: {formatLocalDate(w.startedAt)}
                </span>
                <span data-testid="waiting-review">
                  確認予定日:{" "}
                  {w.reviewAt ? formatLocalDate(w.reviewAt) : "未設定"}
                </span>
                <Chip className="text-ink-3">{w.categoryName}</Chip>
                {w.projectName ? (
                  <Chip className="text-ink-3">{w.projectName}</Chip>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
