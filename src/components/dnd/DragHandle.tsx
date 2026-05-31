"use client";

import { cn } from "@/lib/cn";

interface DragHandleProps {
  handleProps: Record<string, unknown>;
  className?: string;
}

/** 並び替え用のグリップ。SortableList の renderItem から handleProps を受け取る。 */
export function DragHandle({ handleProps, className }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label="ドラッグして並び替え"
      className={cn(
        "cursor-grab touch-none select-none rounded p-1 text-ink-tertiary hover:bg-surface-2 hover:text-ink-muted active:cursor-grabbing",
        className,
      )}
      {...handleProps}
    >
      <span aria-hidden className="text-base leading-none">
        ⠿
      </span>
    </button>
  );
}
