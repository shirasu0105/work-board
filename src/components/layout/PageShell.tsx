import type { ReactNode } from "react";
import { Header } from "./Header";

interface PageShellProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** ヘッダー + スクロール可能な本文領域。各ページのトップに配置する。 */
export function PageShell({ title, actions, children }: PageShellProps) {
  return (
    <>
      <Header title={title} actions={actions} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </>
  );
}
