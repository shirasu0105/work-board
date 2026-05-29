"use client";

import { useCallback, useMemo, useState } from "react";
import type { CategoryDTO } from "@/lib/db/category";
import { type TaskDTO, type TaskStatus } from "@/lib/types/task";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { TaskList } from "./TaskList";
import { TaskFormDialog, type TaskFormValue } from "./TaskFormDialog";

export type TaskManagerProps = {
  initialTasks: TaskDTO[];
  categories: CategoryDTO[];
};

type DialogState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; taskId: string };

/**
 * タスク一覧ページの状態管理コンテナ。
 *
 * - 初期データは SSR で受け取り、操作後は REST API を叩いて再フェッチ
 * - カテゴリ絞り込み・完了表示トグルはクライアント側のフィルタ条件として保持し、
 *   再フェッチ時に query へ反映する（サーバの絞り込みを信頼）
 */
export function TaskManager({ initialTasks, categories }: TaskManagerProps) {
  const [tasks, setTasks] = useState<TaskDTO[]>(initialTasks);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // フィルタ条件
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showDone, setShowDone] = useState(true);

  const editingInitial = useMemo<TaskFormValue | undefined>(() => {
    if (dialog.mode !== "edit") return undefined;
    const target = tasks.find((t) => t.id === dialog.taskId);
    if (!target) return undefined;
    return {
      title: target.title,
      categoryId: target.categoryId,
      // input[type=date] は YYYY-MM-DD 形式
      dueDate: target.dueDate ? target.dueDate.slice(0, 10) : "",
      note: target.note ?? "",
    };
  }, [dialog, tasks]);

  const buildQuery = useCallback(
    (cat: string, withDone: boolean) => {
      const params = new URLSearchParams();
      if (cat) params.set("categoryId", cat);
      if (!withDone) params.set("includeDone", "false");
      const qs = params.toString();
      return qs ? `?${qs}` : "";
    },
    []
  );

  const refresh = useCallback(
    async (cat = categoryFilter, withDone = showDone) => {
      const res = await fetch(`/api/tasks${buildQuery(cat, withDone)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("タスク一覧の取得に失敗しました");
      }
      const data = (await res.json()) as { tasks: TaskDTO[] };
      setTasks(data.tasks);
    },
    [buildQuery, categoryFilter, showDone]
  );

  const openAdd = useCallback(() => {
    setDialogError(null);
    setDialog({ mode: "add" });
  }, []);

  const openEdit = useCallback((id: string) => {
    setDialogError(null);
    setDialog({ mode: "edit", taskId: id });
  }, []);

  const closeDialog = useCallback(() => {
    if (dialogBusy) return;
    setDialog({ mode: "closed" });
    setDialogError(null);
  }, [dialogBusy]);

  const submitDialog = useCallback(
    async (value: TaskFormValue) => {
      setDialogBusy(true);
      setDialogError(null);
      try {
        const payload = {
          title: value.title,
          categoryId: value.categoryId,
          dueDate: value.dueDate === "" ? null : value.dueDate,
          note: value.note === "" ? null : value.note,
        };
        if (dialog.mode === "add") {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data?.error ?? "作成に失敗しました");
          }
        } else if (dialog.mode === "edit") {
          const res = await fetch(
            `/api/tasks/${encodeURIComponent(dialog.taskId)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data?.error ?? "更新に失敗しました");
          }
        }
        await refresh();
        setDialog({ mode: "closed" });
      } catch (e) {
        setDialogError(e instanceof Error ? e.message : "保存に失敗しました");
      } finally {
        setDialogBusy(false);
      }
    },
    [dialog, refresh]
  );

  const patchStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      setRowBusyId(id);
      setPageError(null);
      try {
        const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "ステータス変更に失敗しました");
        }
        await refresh();
      } catch (e) {
        setPageError(
          e instanceof Error ? e.message : "ステータス変更に失敗しました"
        );
      } finally {
        setRowBusyId(null);
      }
    },
    [refresh]
  );

  const handleToggleComplete = useCallback(
    (task: TaskDTO) => {
      // 完了 → 未着手、それ以外 → 完了
      const next: TaskStatus = task.status === "done" ? "todo" : "done";
      void patchStatus(task.id, next);
    },
    [patchStatus]
  );

  const handleChangeStatus = useCallback(
    (id: string, status: TaskStatus) => {
      void patchStatus(id, status);
    },
    [patchStatus]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const target = tasks.find((t) => t.id === id);
      const ok = window.confirm(
        `「${target?.title ?? "このタスク"}」を削除しますか？`
      );
      if (!ok) return;

      setRowBusyId(id);
      setPageError(null);
      try {
        const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 204) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "削除に失敗しました");
        }
        await refresh();
      } catch (e) {
        setPageError(e instanceof Error ? e.message : "削除に失敗しました");
      } finally {
        setRowBusyId(null);
      }
    },
    [refresh, tasks]
  );

  const handleCategoryFilter = useCallback(
    async (cat: string) => {
      setCategoryFilter(cat);
      setPageError(null);
      try {
        await refresh(cat, showDone);
      } catch (e) {
        setPageError(
          e instanceof Error ? e.message : "絞り込みに失敗しました"
        );
      }
    },
    [refresh, showDone]
  );

  const handleToggleShowDone = useCallback(async () => {
    const next = !showDone;
    setShowDone(next);
    setPageError(null);
    try {
      await refresh(categoryFilter, next);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "表示切替に失敗しました");
    }
  }, [refresh, showDone, categoryFilter]);

  return (
    <div className="flex flex-col gap-4">
      {/* ツールバー: 絞り込み + 完了トグル + 追加 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] text-ink-2">
            カテゴリ
            <select
              value={categoryFilter}
              onChange={(e) => void handleCategoryFilter(e.target.value)}
              data-testid="task-filter-category"
              className={cn(
                "rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2 py-1",
                "text-[13px] text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
              )}
            >
              <option value="">すべて</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-[12px] text-ink-2">
            <input
              type="checkbox"
              checked={showDone}
              onChange={() => void handleToggleShowDone()}
              data-testid="task-filter-showdone"
              className="h-4 w-4 accent-[color:var(--accent)] cursor-pointer"
            />
            完了タスクを表示
          </label>

          <span
            data-testid="task-count"
            className="text-[12px] text-ink-3"
          >
            {tasks.length} 件
          </span>
        </div>

        <Button
          variant="primary"
          onClick={openAdd}
          data-testid="add-task-button"
        >
          ＋ タスク追加
        </Button>
      </div>

      {pageError ? (
        <div
          role="alert"
          className="rounded-[8px] border-whisper bg-[color:var(--accent-bg)] px-3 py-2 text-[12px] text-[color:var(--warning)]"
        >
          {pageError}
        </div>
      ) : null}

      <TaskList
        tasks={tasks}
        busyId={rowBusyId}
        onToggleComplete={handleToggleComplete}
        onChangeStatus={handleChangeStatus}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <TaskFormDialog
        open={dialog.mode !== "closed"}
        mode={dialog.mode === "edit" ? "edit" : "add"}
        categories={categories}
        initial={editingInitial}
        busy={dialogBusy}
        errorMessage={dialogError}
        onCancel={closeDialog}
        onSubmit={submitDialog}
      />
    </div>
  );
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
