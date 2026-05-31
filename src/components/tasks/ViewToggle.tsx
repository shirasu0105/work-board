"use client";

import { cn } from "@/lib/cn";
import type { ViewMode } from "@/lib/useViewMode";

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "list", label: "リスト" },
  { value: "board", label: "かんばん" },
];

export function ViewToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md border border-hairline bg-surface p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-3 py-1 text-[13px] font-medium transition-colors",
            mode === o.value
              ? "bg-surface-2 text-ink"
              : "text-ink-subtle hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
