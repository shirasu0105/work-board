import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-paper hover:bg-accent-hover border border-transparent",
  secondary:
    "bg-paper-2 text-ink hover:bg-warm-gray-50 border border-whisper",
  ghost:
    "bg-transparent text-ink hover:bg-paper-2 border border-transparent",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-[13px]",
  md: "px-4 py-2 text-[14px]",
};

/**
 * Notion 風の最小ボタン。
 * - primary: Notion Blue 塗り
 * - secondary: warm white 塗り＋ whisper border
 * - ghost: 透明背景（インラインリンク代用）
 *
 * border-whisper はグローバル CSS で定義したユーティリティクラス。
 */
export function Button({
  variant = "secondary",
  size = "md",
  className,
  type,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[4px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
