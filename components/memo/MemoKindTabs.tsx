"use client";

import { cn } from "@/lib/cn";
import {
  MEMO_KIND_LABELS,
  MEMO_KIND_ORDER,
  type MemoKind,
} from "@/lib/types/memo";

export type MemoKindTabsProps = {
  value: MemoKind;
  onChange: (kind: MemoKind) => void;
  disabled?: boolean;
};

/**
 * メモ作成・編集画面の上部に表示する 5 種別タブ（採用方針: 上部タブ）。
 * 議事録 / TTメモ / 思いつきメモ / 調査メモ / 作業ログ を横並びで切替。
 */
export function MemoKindTabs({ value, onChange, disabled }: MemoKindTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="メモ種別"
      data-testid="memo-kind-tabs"
      className="flex flex-wrap gap-1.5"
    >
      {MEMO_KIND_ORDER.map((kind) => {
        const active = kind === value;
        return (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(kind)}
            data-testid={`memo-kind-tab-${kind}`}
            data-active={active}
            className={cn(
              "rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus",
              "disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "bg-accent text-paper"
                : "border-whisper bg-paper text-ink-2 hover:bg-paper-2"
            )}
          >
            {MEMO_KIND_LABELS[kind]}
          </button>
        );
      })}
    </div>
  );
}
