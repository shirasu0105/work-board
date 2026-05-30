"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export type WaitingStartValue = {
  partner: string;
  reason: string;
  /** 確認予定日（YYYY-MM-DD or 空） */
  reviewAt: string;
  requestNote: string;
};

export type WaitingStartDialogProps = {
  open: boolean;
  /** 待ち化するタスク名（見出し用） */
  taskTitle?: string;
  busy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (value: WaitingStartValue) => void;
};

/**
 * 待ち化フォーム（要件書 §10.6.2 / §13.1）。
 * - 必須: 待ち相手・待ち理由（どちらか未入力なら保存 disabled）
 * - 任意: 確認予定日・依頼メモ
 */
export function WaitingStartDialog(props: WaitingStartDialogProps) {
  if (!props.open) return null;
  return <WaitingStartDialogInner key={props.taskTitle ?? ""} {...props} />;
}

function WaitingStartDialogInner({
  taskTitle,
  busy = false,
  errorMessage,
  onCancel,
  onSubmit,
}: WaitingStartDialogProps) {
  const titleId = useId();
  const partnerId = useId();
  const reasonId = useId();
  const reviewId = useId();
  const noteId = useId();
  const errorId = useId();

  const [partner, setPartner] = useState("");
  const [reason, setReason] = useState("");
  const [reviewAt, setReviewAt] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const partnerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => partnerRef.current?.focus(), 0);
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

  const trimmedPartner = partner.trim();
  const trimmedReason = reason.trim();
  const canSubmit =
    trimmedPartner.length > 0 && trimmedReason.length > 0 && !busy;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      partner: trimmedPartner,
      reason: trimmedReason,
      reviewAt: reviewAt.trim(),
      requestNote: requestNote.trim(),
    });
  };

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
        data-testid="waiting-start-dialog"
        className={cn(
          "w-full max-w-[480px] rounded-[12px] bg-paper p-6",
          "border-whisper shadow-card"
        )}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2
            id={`${titleId}-dialog-title`}
            className="text-[16px] font-semibold leading-tight text-ink"
          >
            待ち状態にする
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
        {taskTitle ? (
          <p className="mb-4 text-[12px] text-ink-2 truncate" title={taskTitle}>
            対象: {taskTitle}
          </p>
        ) : null}

        <div className="flex flex-col gap-4">
          {/* 待ち相手（必須） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={partnerId}
              className="text-[12px] font-medium text-ink-2"
            >
              待ち相手
              <span className="ml-1 text-[color:var(--warning)]">*</span>
            </label>
            <Input
              id={partnerId}
              ref={partnerRef}
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              placeholder="例: Aさん / 取引先 / レビュー担当"
              maxLength={120}
              autoComplete="off"
              aria-required="true"
              aria-invalid={trimmedPartner.length === 0}
              data-testid="waiting-partner"
            />
          </div>

          {/* 待ち理由（必須） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={reasonId}
              className="text-[12px] font-medium text-ink-2"
            >
              待ち理由
              <span className="ml-1 text-[color:var(--warning)]">*</span>
            </label>
            <Input
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例: 対応表レビュー依頼中"
              maxLength={200}
              autoComplete="off"
              aria-required="true"
              aria-invalid={trimmedReason.length === 0}
              data-testid="waiting-reason"
            />
          </div>

          {/* 確認予定日（任意） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={reviewId}
              className="text-[12px] font-medium text-ink-2"
            >
              確認予定日（任意）
            </label>
            <Input
              id={reviewId}
              type="date"
              value={reviewAt}
              onChange={(e) => setReviewAt(e.target.value)}
              data-testid="waiting-review"
            />
          </div>

          {/* 依頼メモ（任意） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={noteId}
              className="text-[12px] font-medium text-ink-2"
            >
              依頼メモ（任意）
            </label>
            <textarea
              id={noteId}
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              placeholder="依頼内容や経緯など"
              maxLength={1000}
              rows={3}
              data-testid="waiting-request-note"
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
            data-testid="waiting-start-submit"
          >
            {busy ? "保存中…" : "待ちにする"}
          </Button>
        </div>
      </form>
    </div>
  );
}
