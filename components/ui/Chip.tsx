import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  children?: ReactNode;
};

/**
 * カテゴリやフィルタ表示に使う中性なチップ（ピル）。
 * Badge より大きめでクリック可能想定の見た目。
 */
export function Chip({ className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-whisper bg-paper px-2.5 py-0.5",
        "text-[12px] font-medium text-ink-2",
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
