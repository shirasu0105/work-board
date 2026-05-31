"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";

type Theme = "light" | "dark";

const THEME_EVENT = "wb-theme-change";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("wb-theme", theme);
  } catch {
    // localStorage 不可環境では永続化を諦める
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => applyTheme(theme === "dark" ? "light" : "dark");

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={theme === "dark" ? "ライトテーマに切替" : "ダークテーマに切替"}
      title="テーマ切替"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </Button>
  );
}

/** ハイドレーション前にテーマを適用してフラッシュを防ぐインラインスクリプト。 */
export const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('wb-theme');
    if (!t) {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
