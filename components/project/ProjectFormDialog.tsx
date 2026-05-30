"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { CategoryDTO } from "@/lib/db/category";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/types/project";

export type ProjectFormValue = {
  name: string;
  categoryId: string;
  completion: string;
  dueDate: string;
  purpose: string;
  status: ProjectStatus;
};

export type ProjectFormDialogProps = {
  open: boolean;
  mode: "add" | "edit";
  /** 選択可能なカテゴリ（有効なもののみを想定） */
  categories: CategoryDTO[];
  initial?: ProjectFormValue;
  /** true のときプロジェクト名入力欄を読み取り専用にする（Inbox からの変換時） */
  lockName?: boolean;
  /** ステータス欄を隠す（新規・変換時は active 固定で良い） */
  hideStatus?: boolean;
  busy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (value: ProjectFormValue) => void;
};

/**
 * 新規/編集兼用のプロジェクトフォーム（要件書 §10.4.3）。
 * - 必須: プロジェクト名・カテゴリ
 * - 任意: 完了条件・期限・目的
 * - ステータス: 進行中 / 未着手 / 保留 / 完了（編集時に切替）
 */
export function ProjectFormDialog(props: ProjectFormDialogProps) {
  if (!props.open) return null;
  const key = `${props.mode}:${props.initial?.name ?? ""}:${
    props.initial?.categoryId ?? ""
  }:${props.initial?.status ?? ""}`;
  return <ProjectFormDialogInner key={key} {...props} />;
}

function ProjectFormDialogInner({
  mode,
  categories,
  initial,
  lockName = false,
  hideStatus = false,
  busy = false,
  errorMessage,
  onCancel,
  onSubmit,
}: ProjectFormDialogProps) {
  const nameId = useId();
  const categoryFieldId = useId();
  const completionId = useId();
  const dueId = useId();
  const purposeId = useId();
  const statusId = useId();
  const errorId = useId();

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(
    initial?.categoryId ?? categories[0]?.id ?? ""
  );
  const [completion, setCompletion] = useState(initial?.completion ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    initial?.status ?? "active"
  );
  const nameRef = useRef<HTMLInputElement | null>(null);
  const categoryRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      // 名前ロック時はカテゴリへフォーカス（変換フローで最初に選ぶ欄）
      if (lockName) categoryRef.current?.focus();
      else nameRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [lockName]);

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

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && category !== "" && !busy;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: trimmedName,
      categoryId: category,
      completion: completion.trim(),
      dueDate: dueDate.trim(),
      purpose: purpose.trim(),
      status,
    });
  };

  const dialogTitle = mode === "add" ? "プロジェクトを追加" : "プロジェクトを編集";
  const submitLabel = mode === "add" ? "追加する" : "保存する";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${nameId}-dialog-title`}
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
          "max-h-[90vh] w-full max-w-[480px] overflow-auto rounded-[12px] bg-paper p-6",
          "border-whisper shadow-card"
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id={`${nameId}-dialog-title`}
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
          {/* プロジェクト名（必須） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={nameId}
              className="text-[12px] font-medium text-ink-2"
            >
              プロジェクト名
              <span className="ml-1 text-[color:var(--warning)]">*</span>
            </label>
            <Input
              id={nameId}
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={lockName}
              placeholder="例: 年間計画化"
              maxLength={200}
              autoComplete="off"
              aria-required="true"
              aria-invalid={trimmedName.length === 0}
              data-testid="project-form-name"
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
              data-testid="project-form-category"
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

          {/* 完了条件（任意） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={completionId}
              className="text-[12px] font-medium text-ink-2"
            >
              完了条件（任意）
            </label>
            <textarea
              id={completionId}
              value={completion}
              onChange={(e) => setCompletion(e.target.value)}
              placeholder="作業完了の判断基準（入力推奨）"
              maxLength={1000}
              rows={2}
              data-testid="project-form-completion"
              className={cn(
                "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
                "text-[14px] text-ink placeholder:text-warm-gray-300 leading-[1.5]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent",
                "resize-y"
              )}
            />
          </div>

          {/* 期限（任意） */}
          <div className="flex flex-col gap-1">
            <label htmlFor={dueId} className="text-[12px] font-medium text-ink-2">
              期限（任意）
            </label>
            <Input
              id={dueId}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              data-testid="project-form-due"
            />
          </div>

          {/* 目的（任意） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={purposeId}
              className="text-[12px] font-medium text-ink-2"
            >
              目的（任意）
            </label>
            <textarea
              id={purposeId}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="このプロジェクトの目的"
              maxLength={1000}
              rows={2}
              data-testid="project-form-purpose"
              className={cn(
                "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
                "text-[14px] text-ink placeholder:text-warm-gray-300 leading-[1.5]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent",
                "resize-y"
              )}
            />
          </div>

          {/* ステータス（編集時のみ） */}
          {hideStatus ? null : (
            <div className="flex flex-col gap-1">
              <label
                htmlFor={statusId}
                className="text-[12px] font-medium text-ink-2"
              >
                ステータス
              </label>
              <select
                id={statusId}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                data-testid="project-form-status"
                className={cn(
                  "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
                  "text-[14px] text-ink",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent"
                )}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            data-testid="project-form-submit"
          >
            {busy ? "保存中…" : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
