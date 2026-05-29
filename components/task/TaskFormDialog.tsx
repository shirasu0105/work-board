"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { CategoryDTO } from "@/lib/db/category";

export type TaskFormValue = {
  title: string;
  categoryId: string;
  dueDate: string;
  note: string;
};

export type TaskFormDialogProps = {
  open: boolean;
  mode: "add" | "edit";
  /** 選択可能なカテゴリ（有効なもののみを想定） */
  categories: CategoryDTO[];
  initial?: TaskFormValue;
  busy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (value: TaskFormValue) => void;
};

/**
 * 新規/編集兼用のタスクフォーム（要件書 §10.5.3）。
 * - 必須: タスク名・カテゴリ。どちらか未入力なら保存ボタンは disabled
 * - 任意: 期限・メモ
 * - プロジェクト欄は Phase 4 で活性化するため、ここでは設けない
 *
 * CategoryFormDialog と同様、`open` 切替ごとに key で内部状態をリセットする。
 */
export function TaskFormDialog(props: TaskFormDialogProps) {
  if (!props.open) return null;
  const key = `${props.mode}:${props.initial?.title ?? ""}:${
    props.initial?.categoryId ?? ""
  }:${props.initial?.dueDate ?? ""}:${props.initial?.note ?? ""}`;
  return <TaskFormDialogInner key={key} {...props} />;
}

function TaskFormDialogInner({
  mode,
  categories,
  initial,
  busy = false,
  errorMessage,
  onCancel,
  onSubmit,
}: TaskFormDialogProps) {
  const titleId = useId();
  const categoryId = useId();
  const dueId = useId();
  const noteId = useId();
  const errorId = useId();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(
    initial?.categoryId ?? categories[0]?.id ?? ""
  );
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      titleRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

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

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && category !== "" && !busy;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      title: trimmedTitle,
      categoryId: category,
      dueDate: dueDate.trim(),
      note: note.trim(),
    });
  };

  const dialogTitle = mode === "add" ? "タスクを追加" : "タスクを編集";
  const submitLabel = mode === "add" ? "追加する" : "保存する";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${titleId}-dialog-title`}
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
          "w-full max-w-[480px] rounded-[12px] bg-paper p-6",
          "border-whisper shadow-card"
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id={`${titleId}-dialog-title`}
            className="text-[16px] font-semibold leading-tight text-ink"
          >
            {dialogTitle}
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
          {/* タスク名（必須） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={titleId}
              className="text-[12px] font-medium text-ink-2"
            >
              タスク名
              <span className="ml-1 text-[color:var(--warning)]">*</span>
            </label>
            <Input
              id={titleId}
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ヒアリング項目をまとめる"
              maxLength={200}
              autoComplete="off"
              aria-required="true"
              aria-invalid={trimmedTitle.length === 0}
              data-testid="task-form-title"
            />
          </div>

          {/* カテゴリ（必須） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={categoryId}
              className="text-[12px] font-medium text-ink-2"
            >
              カテゴリ
              <span className="ml-1 text-[color:var(--warning)]">*</span>
            </label>
            <select
              id={categoryId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-required="true"
              aria-invalid={category === ""}
              data-testid="task-form-category"
              className={cn(
                "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
                "text-[14px] text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent"
              )}
            >
              {categories.length === 0 ? (
                <option value="">カテゴリがありません</option>
              ) : (
                <>
                  <option value="" disabled>
                    選択してください
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {categories.length === 0 ? (
              <p className="text-[12px] text-ink-3">
                先に「設定」でカテゴリを作成してください。
              </p>
            ) : null}
          </div>

          {/* 期限（任意） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={dueId}
              className="text-[12px] font-medium text-ink-2"
            >
              期限（任意）
            </label>
            <Input
              id={dueId}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              data-testid="task-form-due"
            />
          </div>

          {/* メモ（任意） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={noteId}
              className="text-[12px] font-medium text-ink-2"
            >
              メモ（任意）
            </label>
            <textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="補足や手順など"
              maxLength={1000}
              rows={3}
              data-testid="task-form-note"
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
            data-testid="task-form-submit"
          >
            {busy ? "保存中…" : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
