"use client";

import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/common/EmptyState";
import type { TaskDTO } from "@/lib/types/task";

export type WaitingReviewStepProps = {
  tasks: TaskDTO[];
};

/** ステップ 4: 待ちタスク確認（要件 §10.13.3-4）。 */
export function WaitingReviewStep({ tasks }: WaitingReviewStepProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        data-testid="review-waiting-empty"
        icon="⏳"
        title="待ち状態のタスクはありません。"
        description="誰かのボール待ちになっているタスクはありません。"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="review-waiting">
      <p className="text-[13px] text-ink-2">
        待ち {tasks.length} 件。
        <Link
          href="/tasks/waiting"
          className="ml-1 text-accent hover:underline"
          data-testid="review-waiting-link"
        >
          待ちタスク画面で確認する
        </Link>
      </p>
      <ul className="flex flex-col gap-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            data-testid="review-waiting-row"
            className="flex flex-wrap items-center gap-2 rounded-[8px] border-whisper bg-paper px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
              {t.title}
            </span>
            {t.waiting ? (
              <>
                <Chip>{t.waiting.partner} 待ち</Chip>
                <span className="rounded-full bg-[#fdecd9] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[color:var(--warning)]">
                  {t.waiting.waitingDays} 日
                </span>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
