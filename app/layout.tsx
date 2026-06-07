import type { Metadata } from "next";
import "./globals.css";
import { loadAll } from "@/lib/db";
import { StoreProvider } from "@/components/store";
import { AppShell } from "@/components/shell";
import { ToastHost } from "@/components/toast";

export const metadata: Metadata = {
  title: "Flow — 仕事効率化アプリ",
  description: "タスクとメモを統合する個人向けワークスペース（GTD + メモの魔力）",
};

// 単一ユーザのローカル利用。常に最新のSQLite状態を読み込む。
export const dynamic = "force-dynamic";

function serverToday(): string {
  const x = new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initial = loadAll();
  const today = serverToday();
  return (
    <html lang="ja" data-theme={initial.settings.theme || "dark"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StoreProvider initial={initial} today={today}>
          <AppShell>{children}</AppShell>
        </StoreProvider>
        <ToastHost />
      </body>
    </html>
  );
}
