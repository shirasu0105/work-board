"use client";

import { useCallback, useMemo, useState } from "react";
import type { WaitingTaskDTO } from "@/lib/types/waiting";
import { WaitingTaskList } from "./WaitingTaskList";
import {
  WaitingReleaseDialog,
  type WaitingReleaseValue,
} from "./WaitingReleaseDialog";

export type WaitingManagerProps = {
  initialItems: WaitingTaskDTO[];
};

type ReleaseDialogState =
  | { mode: "closed" }
  | { mode: "release"; taskId: string };

/**
 * 待ち専用画面（/tasks/waiting）の状態コンテナ。
 * - 初期データは SSR、解除後は API 再フェッチで一覧を更新（解除済みは消える）
 */
export function WaitingManager({ initialItems }: WaitingManagerProps) {
  const [items, setItems] = useState<WaitingTaskDTO[]>(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [dialog, setDialog] = useState<ReleaseDialogState>({ mode: "closed" });
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/tasks/waiting", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("待ちタスク一覧の取得に失敗しました");
    }
    const data = (await res.json()) as { items: WaitingTaskDTO[] };
    setItems(data.items);
  }, []);

  const openRelease = useCallback((taskId: string) => {
    setDialogError(null);
    setDialog({ mode: "release", taskId });
  }, []);

  const closeDialog = useCallback(() => {
    if (dialogBusy) return;
    setDialog({ mode: "closed" });
    setDialogError(null);
  }, [dialogBusy]);

  const submitRelease = useCallback(
    async (value: WaitingReleaseValue) => {
      if (dialog.mode !== "release") return;
      const taskId = dialog.taskId;
      setDialogBusy(true);
      setBusyId(taskId);
      setDialogError(null);
      try {
        const res = await fetch(
          `/api/tasks/${encodeURIComponent(taskId)}/wait`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nextStatus: value.nextStatus,
              replyNote: value.replyNote === "" ? null : value.replyNote,
            }),
          }
        );
        if (!res.ok) {
          const data = (await safeJson(res)) as { error?: string } | null;
          throw new Error(data?.error ?? "待ち解除に失敗しました");
        }
        await refresh();
        setDialog({ mode: "closed" });
      } catch (e) {
        setDialogError(
          e instanceof Error ? e.message : "待ち解除に失敗しました"
        );
        setPageError(null);
      } finally {
        setDialogBusy(false);
        setBusyId(null);
      }
    },
    [dialog, refresh]
  );

  const dialogTaskTitle = useMemo(() => {
    if (dialog.mode !== "release") return undefined;
    return items.find((w) => w.taskId === dialog.taskId)?.title;
  }, [dialog, items]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span data-testid="waiting-count" className="text-[12px] text-ink-3">
          {items.length} 件の待ち
        </span>
      </div>

      {pageError ? (
        <div
          role="alert"
          className="rounded-[8px] border-whisper bg-[color:var(--accent-bg)] px-3 py-2 text-[12px] text-[color:var(--warning)]"
        >
          {pageError}
        </div>
      ) : null}

      <WaitingTaskList
        items={items}
        busyId={busyId}
        onRelease={openRelease}
      />

      <WaitingReleaseDialog
        open={dialog.mode === "release"}
        taskTitle={dialogTaskTitle}
        busy={dialogBusy}
        errorMessage={dialogError}
        onCancel={closeDialog}
        onSubmit={submitRelease}
      />
    </div>
  );
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
