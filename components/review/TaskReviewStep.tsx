"use client";

import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { StatusBadge } from "@/components/task/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import type { TaskDTO } from "@/lib/types/task";

export type TaskReviewStepProps = {
  tasks: TaskDTO[];
};

/** ステップ 3: 未完了タスク確認（要件 §10.13.3-3）。 */
export function TaskReviewStep({ tasks }: TaskReviewStepProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        data-testid="review-tasks-empty"
        icon="✓"
        title="未完了のタスクはありません。"
        description="残りのタスクはありません。次のステップへ進みましょう。"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="review-tasks">
      <p className="text-[13px] text-ink-2">
        未完了 {tasks.length} 件。
        <Link
          href="/tasks"
          className="ml-1 text-accent hover:underline"
          data-testid="review-tasks-link"
        >
          タスク画面で整理する
        </Link>
      </p>
      <ul className="flex flex-col gap-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            data-testid="review-task-row"
            className="flex flex-wrap items-center gap-2 rounded-[8px] border-whisper bg-paper px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
              {t.title}
            </span>
            <Chip>{t.categoryName}</Chip>
            {t.projectName ? (
              <Chip className="text-ink-3">{t.projectName}</Chip>
            ) : null}
            <StatusBadge status={t.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
