import type { InputHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
};

/**
 * Notion 風の最小入力。1px border / 4px radius / placeholder warm gray。
 * React 19 の関数コンポーネントとして直接 `ref` プロップを受ける。
 */
export function Input({ className, type, ref, ...rest }: InputProps) {
  return (
    <input
      ref={ref}
      type={type ?? "text"}
      className={cn(
        "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
        "text-[14px] text-ink placeholder:text-warm-gray-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent",
        "disabled:bg-paper-2 disabled:cursor-not-allowed",
        className
      )}
      {...rest}
    />
  );
}
