"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type QuickAddBarProps = {
  busy?: boolean;
  /** 追加実行。成功時は内部入力をクリアする。 */
  onAdd: (content: string) => Promise<void> | void;
};

/**
 * Inbox 上部の常設クイック追加バー（DESIGN.md §4 / screens-1.jsx InboxScreen topbar）。
 * - 入力欄＋追加ボタン
 * - Enter キーまたは追加ボタンで追加。空文字では追加しない
 */
export function QuickAddBar({ busy = false, onAdd }: QuickAddBarProps) {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const submit = async () => {
    const trimmed = content.trim();
    if (!trimmed || busy) return;
    await onAdd(trimmed);
    // 追加後は入力欄をクリアして連続入力できるようにフォーカスを残す
    setContent("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // IME 変換中の Enter は無視（日本語入力対応）
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="inbox-quickadd"
      className={cn(
        "flex items-center gap-3 rounded-[12px] bg-paper px-4 py-3 shadow-card",
        "border border-accent"
      )}
    >
      <span className="text-[16px] leading-none text-accent" aria-hidden>
        ＋
      </span>
      <input
        ref={inputRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="思いついたことをそのまま書く… ⏎ で追加"
        maxLength={500}
        autoComplete="off"
        aria-label="Inbox に追加する内容"
        data-testid="inbox-quickadd-input"
        className={cn(
          "flex-1 bg-transparent text-[14px] text-ink placeholder:text-warm-gray-300",
          "focus-visible:outline-none"
        )}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={busy || content.trim() === ""}
        data-testid="inbox-quickadd-button"
      >
        {busy ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}
