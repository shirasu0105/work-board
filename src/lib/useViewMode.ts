"use client";

import { useSyncExternalStore, useCallback } from "react";

export type ViewMode = "list" | "board";

const KEY = "wb-tasks-view";
const EVENT = "wb-tasks-view-change";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function read(): ViewMode {
  const v = localStorage.getItem(KEY);
  return v === "board" ? "board" : "list";
}

/** リスト/かんばんの選択状態を localStorage で保持する。 */
export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const mode = useSyncExternalStore(
    subscribe,
    read,
    () => "list" as ViewMode,
  );

  const setMode = useCallback((next: ViewMode) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // 永続化不可なら無視
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [mode, setMode];
}
