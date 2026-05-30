"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "@/lib/nav";
import { cn } from "@/lib/cn";

/**
 * グローバルサイドバー。
 *
 * - `usePathname` で現在のルートを取得し、一致するナビ項目に `aria-current="page"` を付与
 * - 受入基準: ナビ 8 件・クリックで対応ページへ遷移・アクティブ強調
 * - スタイルは Notion 風（warm white 背景＋ whisper border）
 */
export function Sidebar() {
  const pathname = usePathname() ?? "/";

  return (
    <aside
      aria-label="グローバルナビゲーション"
      className={cn(
        "flex w-[220px] shrink-0 flex-col gap-6 border-r border-[color:var(--border-whisper)]",
        "bg-paper-2 px-3 py-5"
      )}
    >
      {/* ブランド */}
      <div className="px-2">
        <div className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-ink">
          <span className="text-ink-3 font-mono text-[12px]">{"//"}</span>
          <span>work-board</span>
        </div>
        <p className="mt-1 text-[11px] text-ink-3">仕事効率化Webアプリ</p>
      </div>

      {/* ナビ */}
      <nav aria-label="メインナビゲーション">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href, pathname);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-[5px] px-2 py-1.5",
                    "text-[14px] leading-[1.4] transition-colors",
                    active
                      ? "bg-paper text-ink font-semibold border border-[color:var(--border-whisper)] shadow-card"
                      : "text-ink-2 font-medium hover:bg-paper hover:text-ink border border-transparent"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex w-4 justify-center text-[13px]",
                      active ? "text-accent" : "text-ink-3"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
