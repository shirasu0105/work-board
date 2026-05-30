"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/cn";

export type NextWeekProjectOption = {
  id: string;
  name: string;
  categoryName: string;
};

export type NextWeekFocusStepProps = {
  projects: NextWeekProjectOption[];
};

/**
 * ステップ 6: 来週の重点プロジェクト確認（要件 §10.13.3-6）。
 *
 * 全プロジェクトから「来週見るべき」ものを複数選択する。簡易実装のため
 * 選択はクライアントメモリ上の印付けに留め、永続化はしない（レビューの確認用）。
 */
export function NextWeekFocusStep({ projects }: NextWeekFocusStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (projects.length === 0) {
    return (
      <EmptyState
        data-testid="review-nextweek-empty"
        icon="◷"
        title="プロジェクトがありません。"
        description="プロジェクトを作成すると、来週の重点プロジェクトを選べます。"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="review-nextweek">
      <p className="text-[13px] text-ink-2">
        来週の重点プロジェクトを選択（{selected.size} 件選択中）。
      </p>
      <ul className="flex flex-col gap-2">
        {projects.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <li key={p.id} data-testid="review-nextweek-row">
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(p.id)}
                data-testid="review-nextweek-toggle"
                data-selected={isSelected}
                className={cn(
                  "flex w-full flex-wrap items-center gap-2 rounded-[8px] border px-3 py-2 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus",
                  isSelected
                    ? "border-accent bg-accent-bg"
                    : "border-[color:var(--border-whisper)] bg-paper hover:bg-paper-2"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-[11px] leading-none",
                    isSelected
                      ? "border-accent bg-accent text-paper"
                      : "border-[color:var(--border-whisper)] text-transparent"
                  )}
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                  {p.name}
                </span>
                <Chip>{p.categoryName}</Chip>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
