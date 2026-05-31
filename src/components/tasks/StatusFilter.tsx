"use client";

import { cn } from "@/lib/cn";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";

export type StatusFilterValue = "all" | TaskStatus;

interface Props {
  value: StatusFilterValue;
  onChange: (v: StatusFilterValue) => void;
  counts: Record<StatusFilterValue, number>;
}

const OPTIONS: StatusFilterValue[] = ["all", ...TASK_STATUSES];

const LABELS: Record<StatusFilterValue, string> = {
  all: "すべて",
  未着手: "未着手",
  対応中: "対応中",
  待ち: "待ち",
  保留: "保留",
  完了: "完了",
};

export function StatusFilter({ value, onChange, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {OPTIONS.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
              active
                ? "bg-primary text-on-primary"
                : "bg-surface-2 text-ink-subtle hover:text-ink",
            )}
          >
            {LABELS[opt]}
            <span className={cn("ml-1", active ? "opacity-80" : "opacity-60")}>
              {counts[opt] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
