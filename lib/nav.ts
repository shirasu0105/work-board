/**
 * グローバルナビゲーション定義（単一ソース）
 *
 * 要件書 §12「画面一覧」の 9 画面のうち、サイドバーで遷移できる 8 項目を列挙する。
 * 「メモ作成」はサイドバーには出さず、「メモ」一覧画面から導線を設ける想定。
 *
 * `icon` は Phase 1 では文字（記号）を採用。将来的にアイコンライブラリへ差し替える際は
 * この型を `LucideIcon | string` 等へ広げる。
 */
export type NavItem = {
  /** 一意キー（React の key 用） */
  key: string;
  /** 日本語ラベル */
  label: string;
  /** Next.js のルートパス */
  href: string;
  /** サイドバー左端に表示する記号 */
  icon: string;
};

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { key: "home", label: "ホーム", href: "/", icon: "▦" },
  { key: "inbox", label: "Inbox", href: "/inbox", icon: "✉" },
  { key: "tasks", label: "タスク", href: "/tasks", icon: "✓" },
  { key: "waiting", label: "待ちタスク", href: "/tasks/waiting", icon: "⏳" },
  { key: "projects", label: "プロジェクト", href: "/projects", icon: "◷" },
  { key: "memos", label: "メモ", href: "/memos", icon: "✎" },
  { key: "journal", label: "日次ジャーナル", href: "/journal", icon: "☾" },
  { key: "review", label: "週次レビュー", href: "/review", icon: "↻" },
  { key: "settings", label: "設定", href: "/settings", icon: "⚙" },
] as const;

/**
 * 与えられたパスがそのナビ項目のアクティブ状態に該当するかを判定する。
 * ルート `/` のみ完全一致、それ以外は前方一致（子ルートを含めてアクティブ扱い）。
 *
 * ただし、より具体的なナビ項目（例: `/tasks/waiting`）が同じパスに一致する場合、
 * 親項目（例: `/tasks`）はアクティブにしない（最長一致を優先し二重ハイライトを防ぐ）。
 */
export function isNavActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === "/") {
    return currentPath === "/";
  }
  const matches =
    currentPath === itemHref || currentPath.startsWith(`${itemHref}/`);
  if (!matches) return false;

  // 同じく一致する他のナビ項目のうち、より長い（具体的な）href があれば
  // そちらを優先し、この項目はアクティブにしない。
  const hasMoreSpecific = NAV_ITEMS.some(
    (item) =>
      item.href !== itemHref &&
      item.href.length > itemHref.length &&
      (currentPath === item.href ||
        currentPath.startsWith(`${item.href}/`))
  );
  return !hasMoreSpecific;
}
