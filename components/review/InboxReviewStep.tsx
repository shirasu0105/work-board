"use client";

import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/common/EmptyState";
import type { InboxItemDTO } from "@/lib/types/inbox";

export type InboxReviewStepProps = {
  items: InboxItemDTO[];
};

/** ステップ 1: Inbox 整理（要件 §10.13.3-1）。未整理一覧と整理導線を表示。 */
export function InboxReviewStep({ items }: InboxReviewStepProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        data-testid="review-inbox-empty"
        icon="✉"
        title="未整理の Inbox はありません。"
        description="Inbox はすべて整理済みです。次のステップへ進みましょう。"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="review-inbox">
      <p className="text-[13px] text-ink-2">
        未整理 {items.length} 件。
        <Link
          href="/inbox"
          className="ml-1 text-accent hover:underline"
          data-testid="review-inbox-link"
        >
          Inbox 画面で整理する
        </Link>
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li
            key={it.id}
            data-testid="review-inbox-row"
            className="flex items-center justify-between gap-3 rounded-[8px] border-whisper bg-paper px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
              {it.content}
            </span>
            <Chip>未整理</Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}
