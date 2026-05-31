"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/inbox", label: "Inbox", icon: "📥" },
  { href: "/tasks", label: "タスク", icon: "✅" },
  { href: "/projects", label: "プロジェクト", icon: "📁" },
  { href: "/memos", label: "メモ", icon: "📝" },
  { href: "/journal", label: "ジャーナル", icon: "📔" },
  { href: "/review", label: "レビュー", icon: "🔄" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-hairline bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-hairline px-4">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-on-primary text-sm font-bold">
          W
        </span>
        <span className="text-sm font-semibold text-ink">work-board</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-surface-2 font-medium text-ink"
                  : "text-ink-subtle hover:bg-surface-2 hover:text-ink",
              )}
            >
              <span aria-hidden className="text-base leading-none">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
