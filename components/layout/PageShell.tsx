import type { ReactNode } from "react";
import { TopBar } from "./TopBar";

export type PageShellProps = {
  title: string;
  subtitle?: string;
  /** TopBar 右スロット */
  topBarRight?: ReactNode;
  children?: ReactNode;
};

/**
 * 各ページの内側ラッパー。
 * TopBar ＋スクロール可能な本文領域を提供する。
 */
export function PageShell({
  title,
  subtitle,
  topBarRight,
  children,
}: PageShellProps) {
  return (
    <>
      <TopBar title={title} subtitle={subtitle}>
        {topBarRight}
      </TopBar>
      <main className="flex-1 overflow-auto bg-paper-2 px-6 py-6">
        <div className="mx-auto w-full max-w-[1100px]">{children}</div>
      </main>
    </>
  );
}
