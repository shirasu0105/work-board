import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "muted";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children?: ReactNode;
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-paper-2 text-ink",
  accent: "bg-accent-bg text-[color:var(--accent-focus)]",
  success: "bg-[#e8f7eb] text-[color:var(--success)]",
  warning: "bg-[#fdecd9] text-[color:var(--warning)]",
  muted: "bg-paper-2 text-ink-2",
};

/**
 * Notion 風ピルバッジ（9999px radius）。
 * ステータス、件数、タグ用の小さいラベル。
 */
export function Badge({
  tone = "neutral",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5",
        "text-[11px] font-semibold tracking-[0.02em] leading-none",
        TONE_CLASSES[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
