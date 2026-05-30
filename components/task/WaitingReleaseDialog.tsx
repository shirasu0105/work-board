"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { TASK_STATUS_LABELS } from "@/lib/types/task";
import {
  WAITING_RELEASE_STATUSES,
  type WaitingReleaseStatus,
} from "@/lib/types/waiting";

export type WaitingReleaseValue = {
  nextStatus: WaitingReleaseStatus;
  replyNote: string;
};

export type WaitingReleaseDialogProps = {
  open: boolean;
  taskTitle?: string;
  busy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (value: WaitingReleaseValue) => void;
};

/**
 * 待ち解除フォーム（要件書 §10.6.3）。
 * - 解除後ステータスを「未着手」(初期値) または「対応中」から選択
 * - 任意: 返答メモ
 */
export function WaitingReleaseDialog(props: WaitingReleaseDialogProps) {
  if (!props.open) return null;
  return <WaitingReleaseDialogInner key={props.taskTitle ?? ""} {...props} />;
}

function WaitingReleaseDialogInner({
  taskTitle,
  busy = false,
  errorMessage,
  onCancel,
  onSubmit,
}: WaitingReleaseDialogProps) {
  const titleId = useId();
  const statusId = useId();
  const noteId = useId();
  const errorId = useId();

  // 初期値は「未着手」(todo)
  const [nextStatus, setNextStatus] = useState<WaitingReleaseStatus>("todo");
  const [replyNote, setReplyNote] = useState("");

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    onSubmit({ nextStatus, replyNote: replyNote.trim() });
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
        data-testid="waiting-release-dialog"
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
            待ちを解除する
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
          {/* 解除後ステータス */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={statusId}
              className="text-[12px] font-medium text-ink-2"
            >
              解除後ステータス
            </label>
            <select
              id={statusId}
              value={nextStatus}
              onChange={(e) =>
                setNextStatus(e.target.value as WaitingReleaseStatus)
              }
              data-testid="waiting-release-status"
              className={cn(
                "w-full rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2.5 py-1.5",
                "text-[14px] text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:border-accent"
              )}
            >
              {WAITING_RELEASE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* 返答メモ（任意） */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor={noteId}
              className="text-[12px] font-medium text-ink-2"
            >
              返答メモ（任意）
            </label>
            <textarea
              id={noteId}
              value={replyNote}
              onChange={(e) => setReplyNote(e.target.value)}
              placeholder="相手からの返答や結果など"
              maxLength={1000}
              rows={3}
              data-testid="waiting-reply-note"
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
            disabled={busy}
            data-testid="waiting-release-submit"
          >
            {busy ? "解除中…" : "解除する"}
          </Button>
        </div>
      </form>
    </div>
  );
}
