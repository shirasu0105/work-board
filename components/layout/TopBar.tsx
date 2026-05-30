import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TopBarProps = {
  /** 画面タイトル（日本語） */
  title: string;
  /** タイトル下に出すサブテキスト（任意） */
  subtitle?: string;
  /** 右寄せスロット（CTA ボタンや検索など、後続フェーズで差し込む） */
  children?: ReactNode;
};

/**
 * 画面共通のトップバー。
 *
 * 左: 画面タイトル（h1, 日本語）＋任意の subtitle
 * 右: 汎用 children スロット（受入基準: 右寄せスロットの存在）
 */
export function TopBar({ title, subtitle, children }: TopBarProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-b border-[color:var(--border-whisper)]",
        "bg-paper px-6 py-4"
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-[20px] font-bold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[12px] text-ink-2">{subtitle}</p>
        ) : null}
      </div>
      <div
        data-slot="topbar-right"
        className="flex shrink-0 items-center gap-2"
      >
        {children}
      </div>
    </header>
  );
}
