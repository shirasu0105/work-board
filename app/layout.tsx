import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "work-board",
  description: "仕事効率化Webアプリ — タスクとメモを一元管理する",
};

/**
 * ルートレイアウト。
 *
 * - `<html lang="ja">` 固定（受入基準: 全テキスト日本語）
 * - サイドバー（固定幅）＋メイン領域（残り幅）の 2 カラム構成
 * - メイン領域内に TopBar と本文を置くのは各ページ側の責務とする
 *   （TopBar はページタイトルが画面ごとに異なるため）
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-paper text-ink antialiased">
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
