"use client";

import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import type { TaskDTO } from "@/lib/types/task";

export type TomorrowTaskPickerProps = {
  /** 未完了タスク（明日やること候補） */
  tasks: TaskDTO[];
  /** 選択中のタスク ID 集合 */
  selectedIds: Set<string>;
  /** 選択トグルハンドラ */
  onToggle: (taskId: string) => void;
  /** 翌日の日付ラベル（説明文用） */
  nextDateLabel: string;
};

/**
 * 「明日やること を選ぶ」（要件書 §10.12.4）。
 * 未完了タスクから複数選択でき、選択数を親に伝える。
 */
export function TomorrowTaskPicker({
  tasks,
  selectedIds,
  onToggle,
  nextDateLabel,
}: TomorrowTaskPickerProps) {
  return (
    <div className="flex flex-col gap-3" data-testid="journal-picker">
      <div>
        <h2 className="text-[18px] font-semibold text-ink">
          ② 明日やること を選ぶ
        </h2>
        <p className="mt-1 text-[12px] text-ink-2">
          未完了タスクから、明日（{nextDateLabel}）に取り組むものを選びます。
          選んだものは翌日ホームの「今日やること」に表示されます。
        </p>
      </div>

      {tasks.length === 0 ? (
        <p
          data-testid="journal-picker-empty"
          className="rounded-[8px] bg-paper-2 px-3 py-4 text-center text-[13px] text-ink-3"
        >
          未完了タスクがありません
        </p>
      ) : (
        <ul
          className="flex max-h-[420px] flex-col gap-2 overflow-auto"
          data-testid="journal-picker-list"
        >
          {tasks.map((task) => {
            const selected = selectedIds.has(task.id);
            return (
              <li key={task.id}>
                <button
                  type="button"
                  data-testid="journal-picker-item"
                  data-task-id={task.id}
                  data-selected={selected}
                  aria-pressed={selected}
                  onClick={() => onToggle(task.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border border-accent bg-[color:var(--accent-bg)]"
                      : "border-whisper bg-paper hover:bg-warm-gray-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    readOnly
                    tabIndex={-1}
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--accent)]"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[14px] text-ink">{task.title}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Chip>{task.categoryName}</Chip>
                      {task.projectName ? (
                        <Chip>▸ {task.projectName}</Chip>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div
        className="flex items-center justify-between rounded-[8px] border-whisper bg-paper-2 px-3 py-2"
        data-testid="journal-selected-count"
      >
        <span className="text-[13px] text-ink">
          選択中: <span className="font-bold">{selectedIds.size} 件</span>
        </span>
        <span className="text-[12px] text-ink-3">→ 翌日ホームに表示</span>
      </div>
    </div>
  );
}
