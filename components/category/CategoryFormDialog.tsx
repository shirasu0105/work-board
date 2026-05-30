"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export type CategoryFormValue = {
  name: string;
  description: string;
};

export type CategoryFormDialogProps = {
  open: boolean;
  /** "add" / "edit" でタイトル・保存ボタン文言を切り替える */
  mode: "add" | "edit";
  initial?: CategoryFormValue;
  busy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (value: CategoryFormValue) => void;
};

/**
 * 外向きラッパー。`open` の切り替えごとに `key` でフォームの内部状態をリセットする。
 * これにより useEffect 内での setState を避け、React 19 の
 * `react-hooks/set-state-in-effect` ルールに準拠する。
 */
export function CategoryFormDialog(props: CategoryFormDialogProps) {
  if (!props.open) return null;
  // mode + 初期値の組み合わせを key にして、編集対象が変わるたびに再マウント
  const key = `${props.mode}:${props.initial?.name ?? ""}:${
    props.initial?.description ?? ""
  }`;
  return <CategoryFormDialogInner key={key} {...props} />;
}

function CategoryFormDialogInner({
  mode,
  initial,
  busy = false,
  errorMessage,
  onCancel,
  onSubmit,
}: CategoryFormDialogProps) {
  const nameId = useId();
  const descId = useId();
  const errorId = useId();

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const nameRef = useRef<HTMLInputElement | null>(null);

  // マウント後に名前欄へフォーカス（setState は呼ばない）
  useEffect(() => {
    const id = window.setTimeout(() => {
      nameRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Esc で閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !busy;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: trimmed, description: description.trim() });
  };

  const title = mode === "add" ? "カテゴリを追加" : "カテゴリを編集";
  const submitLabel = mode === "add" ? "追加する" : "保存する";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${nameId}-title`}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/30 px-4"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "w-full max-w-[440px] rounded-[12px] bg-paper p-6",
          "border-whisper shadow-card"
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id={`${nameId}-title`}
            className="text-[16px] font-semibold leading-tight text-ink"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="閉じる"
            onClick={onCancel}
            className="text-ink-3 hover:text-ink rounded-[4px] px-1 leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={nameId}
              className="text-[12px] font-medium text-ink-2"
            >
              カテゴリ名<span className="ml-1 text-[color:var(--warning)]">*</span>
            </label>
            <Input
              id={nameId}
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: テーマA"
              maxLength={64}
              autoComplete="off"
              aria-required="true"
              aria-invalid={trimmed.length === 0}
              aria-describedby={errorMessage ? errorId : undefined}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={descId}
              className="text-[12px] font-medium text-ink-2"
            >
              説明（任意）
            </label>
            <textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このカテゴリで管理する内容を簡潔に"
              maxLength={200}
              rows={3}
              className={cn(
                "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
                "text-[14px] text-ink placeholder:text-warm-gray-300 leading-[1.5]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent",
                "resize-y"
              )}
            />
          </div>

          {errorMessage ? (
            <p
              id={errorId}
              role="alert"
              className="text-[12px] text-[color:var(--warning)]"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={busy}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            {busy ? "保存中…" : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
