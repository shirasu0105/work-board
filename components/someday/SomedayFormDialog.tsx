"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { CategoryDTO } from "@/lib/db/category";

export type SomedayFormValue = {
  content: string;
  categoryId: string;
  reason: string;
};

export type SomedayFormDialogProps = {
  open: boolean;
  /** 選択可能なカテゴリ（有効なもののみを想定） */
  categories: CategoryDTO[];
  initial?: SomedayFormValue;
  /** true のとき内容入力欄を読み取り専用にする（Inbox からの変換時） */
  lockContent?: boolean;
  /** ダイアログタイトル */
  title?: string;
  busy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (value: SomedayFormValue) => void;
};

/**
 * Someday / Maybe の追加フォーム（要件書 §10.7.3）。
 * - 必須: 内容・カテゴリ。どちらか未入力なら保存ボタンは disabled
 * - 任意: 理由
 *
 * Inbox → Someday 化（lockContent）と単独追加の両方で使い回す。
 */
export function SomedayFormDialog(props: SomedayFormDialogProps) {
  if (!props.open) return null;
  const key = `${props.initial?.content ?? ""}:${
    props.initial?.categoryId ?? ""
  }`;
  return <SomedayFormDialogInner key={key} {...props} />;
}

function SomedayFormDialogInner({
  categories,
  initial,
  lockContent = false,
  title = "Someday に追加",
  busy = false,
  errorMessage,
  onCancel,
  onSubmit,
}: SomedayFormDialogProps) {
  const contentId = useId();
  const categoryFieldId = useId();
  const reasonId = useId();
  const errorId = useId();

  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(
    initial?.categoryId ?? categories[0]?.id ?? ""
  );
  const [reason, setReason] = useState(initial?.reason ?? "");
  const contentRef = useRef<HTMLInputElement | null>(null);
  const categoryRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (lockContent) categoryRef.current?.focus();
      else contentRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [lockContent]);

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

  const trimmedContent = content.trim();
  const canSubmit = trimmedContent.length > 0 && category !== "" && !busy;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      content: trimmedContent,
      categoryId: category,
      reason: reason.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${contentId}-dialog-title`}
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
            id={`${contentId}-dialog-title`}
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
          {/* 内容（必須） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={contentId}
              className="text-[12px] font-medium text-ink-2"
            >
              内容
              <span className="ml-1 text-[color:var(--warning)]">*</span>
            </label>
            <Input
              id={contentId}
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              readOnly={lockContent}
              placeholder="例: Tailwind v4 を試す"
              maxLength={200}
              autoComplete="off"
              aria-required="true"
              aria-invalid={trimmedContent.length === 0}
              data-testid="someday-form-content"
            />
          </div>

          {/* カテゴリ（必須） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={categoryFieldId}
              className="text-[12px] font-medium text-ink-2"
            >
              カテゴリ
              <span className="ml-1 text-[color:var(--warning)]">*</span>
            </label>
            <select
              id={categoryFieldId}
              ref={categoryRef}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-required="true"
              aria-invalid={category === ""}
              data-testid="someday-form-category"
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

          {/* 理由（任意） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={reasonId}
              className="text-[12px] font-medium text-ink-2"
            >
              理由（任意）
            </label>
            <textarea
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="いつか着手したい理由など"
              maxLength={500}
              rows={2}
              data-testid="someday-form-reason"
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
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            data-testid="someday-form-submit"
          >
            {busy ? "保存中…" : "追加する"}
          </Button>
        </div>
      </form>
    </div>
  );
}
