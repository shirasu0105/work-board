"use client";

import { useCallback, useMemo, useState } from "react";
import type { CategoryDTO } from "@/lib/db/category";
import { type TaskDTO, type TaskStatus } from "@/lib/types/task";
import type { ProjectOption } from "./TaskFormDialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { TaskList } from "./TaskList";
import { TaskKanban } from "./TaskKanban";
import {
  TaskFilters,
  type ProjectPresence,
  type TaskFiltersValue,
} from "./TaskFilters";
import { TaskFormDialog, type TaskFormValue } from "./TaskFormDialog";
import {
  WaitingStartDialog,
  type WaitingStartValue,
} from "./WaitingStartDialog";
import {
  WaitingReleaseDialog,
  type WaitingReleaseValue,
} from "./WaitingReleaseDialog";

type ViewMode = "list" | "kanban";

export type TaskManagerProps = {
  initialTasks: TaskDTO[];
  categories: CategoryDTO[];
  /** プロジェクト紐付け用の選択肢 */
  projects: ProjectOption[];
  /** URL から渡されるプロジェクト絞り込み（任意） */
  initialProjectId?: string;
  /** 絞り込み中プロジェクトの表示名（バナー用） */
  initialProjectName?: string;
  /** 初期表示モード（?view=kanban で kanban） */
  initialView?: ViewMode;
};

type DialogState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; taskId: string };

type WaitingDialogState =
  | { mode: "closed" }
  | { mode: "start"; taskId: string }
  | { mode: "release"; taskId: string };

/**
 * タスク一覧ページの状態管理コンテナ。
 *
 * - 初期データは SSR で受け取り、操作後は REST API を叩いて再フェッチ
 * - カテゴリ絞り込み・完了表示トグルはクライアント側のフィルタ条件として保持し、
 *   再フェッチ時に query へ反映する（サーバの絞り込みを信頼）
 */
export function TaskManager({
  initialTasks,
  categories,
  projects,
  initialProjectId = "",
  initialProjectName,
  initialView = "list",
}: TaskManagerProps) {
  const [tasks, setTasks] = useState<TaskDTO[]>(initialTasks);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // 表示モード（リスト / かんばん）
  const [view, setView] = useState<ViewMode>(initialView);

  // 待ち化・待ち解除ダイアログ
  const [waitingDialog, setWaitingDialog] = useState<WaitingDialogState>({
    mode: "closed",
  });
  const [waitingError, setWaitingError] = useState<string | null>(null);
  const [waitingBusy, setWaitingBusy] = useState(false);

  // フィルタ条件
  // カテゴリ・完了表示はサーバー絞り込み（再フェッチ）、
  // ステータス・プロジェクト有無はクライアント側で表示中タスクを絞る。
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showDone, setShowDone] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [projectPresence, setProjectPresence] =
    useState<ProjectPresence>("any");
  // プロジェクト絞り込み（URL 由来。解除可能）
  const [projectFilter, setProjectFilter] = useState<string>(initialProjectId);

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
      projectId: target.projectId ?? "",
    };
  }, [dialog, tasks]);

  const buildQuery = useCallback(
    (cat: string, withDone: boolean, proj: string) => {
      const params = new URLSearchParams();
      if (cat) params.set("categoryId", cat);
      if (proj) params.set("projectId", proj);
      if (!withDone) params.set("includeDone", "false");
      const qs = params.toString();
      return qs ? `?${qs}` : "";
    },
    []
  );

  const refresh = useCallback(
    async (cat = categoryFilter, withDone = showDone, proj = projectFilter) => {
      const res = await fetch(`/api/tasks${buildQuery(cat, withDone, proj)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("タスク一覧の取得に失敗しました");
      }
      const data = (await res.json()) as { tasks: TaskDTO[] };
      setTasks(data.tasks);
    },
    [buildQuery, categoryFilter, showDone, projectFilter]
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
          projectId: value.projectId === "" ? null : value.projectId,
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
      // 「待ち」へ変更しようとしたら待ち化フォームを開く（直接ステータス変更しない）
      if (status === "waiting") {
        setWaitingError(null);
        setWaitingDialog({ mode: "start", taskId: id });
        return;
      }
      void patchStatus(id, status);
    },
    [patchStatus]
  );

  const openReleaseWaiting = useCallback((id: string) => {
    setWaitingError(null);
    setWaitingDialog({ mode: "release", taskId: id });
  }, []);

  const closeWaitingDialog = useCallback(() => {
    if (waitingBusy) return;
    setWaitingDialog({ mode: "closed" });
    setWaitingError(null);
  }, [waitingBusy]);

  const submitWaitingStart = useCallback(
    async (value: WaitingStartValue) => {
      if (waitingDialog.mode !== "start") return;
      const taskId = waitingDialog.taskId;
      setWaitingBusy(true);
      setWaitingError(null);
      try {
        const res = await fetch(
          `/api/tasks/${encodeURIComponent(taskId)}/wait`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              partner: value.partner,
              reason: value.reason,
              reviewAt: value.reviewAt === "" ? null : value.reviewAt,
              requestNote: value.requestNote === "" ? null : value.requestNote,
            }),
          }
        );
        if (!res.ok) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "待ち化に失敗しました");
        }
        await refresh();
        setWaitingDialog({ mode: "closed" });
      } catch (e) {
        setWaitingError(
          e instanceof Error ? e.message : "待ち化に失敗しました"
        );
      } finally {
        setWaitingBusy(false);
      }
    },
    [waitingDialog, refresh]
  );

  const submitWaitingRelease = useCallback(
    async (value: WaitingReleaseValue) => {
      if (waitingDialog.mode !== "release") return;
      const taskId = waitingDialog.taskId;
      setWaitingBusy(true);
      setWaitingError(null);
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
          const data = await safeJson(res);
          throw new Error(data?.error ?? "待ち解除に失敗しました");
        }
        await refresh();
        setWaitingDialog({ mode: "closed" });
      } catch (e) {
        setWaitingError(
          e instanceof Error ? e.message : "待ち解除に失敗しました"
        );
      } finally {
        setWaitingBusy(false);
      }
    },
    [waitingDialog, refresh]
  );

  const waitingTaskTitle = useMemo(() => {
    if (waitingDialog.mode === "closed") return undefined;
    return tasks.find((t) => t.id === waitingDialog.taskId)?.title;
  }, [waitingDialog, tasks]);

  const handleSwitchView = useCallback(
    (next: ViewMode) => {
      setView(next);
      // URL クエリへ反映（リロードせず履歴のみ更新）
      try {
        const url = new URL(window.location.href);
        if (next === "kanban") url.searchParams.set("view", "kanban");
        else url.searchParams.delete("view");
        window.history.replaceState(null, "", url.toString());
      } catch {
        // URL 更新失敗は致命的でないため握りつぶす
      }
    },
    []
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

  // フィルタ UI からの変更ハンドラ。
  // カテゴリ・完了表示が変わったときはサーバー再フェッチ、
  // ステータス・プロジェクト有無はクライアント絞り込みのみ（再フェッチ不要）。
  const handleFiltersChange = useCallback(
    async (next: TaskFiltersValue) => {
      const catChanged = next.categoryId !== categoryFilter;
      const showDoneChanged = next.showDone !== showDone;

      setCategoryFilter(next.categoryId);
      setShowDone(next.showDone);
      setStatusFilter(next.status);
      setProjectPresence(next.projectPresence);

      if (catChanged || showDoneChanged) {
        setPageError(null);
        try {
          await refresh(next.categoryId, next.showDone, projectFilter);
        } catch (e) {
          setPageError(
            e instanceof Error ? e.message : "絞り込みに失敗しました"
          );
        }
      }
    },
    [refresh, categoryFilter, showDone, projectFilter]
  );

  // クライアント側フィルタ（ステータス・プロジェクト有無）を適用した表示用タスク。
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (projectPresence === "with" && !t.projectId) return false;
      if (projectPresence === "without" && t.projectId) return false;
      return true;
    });
  }, [tasks, statusFilter, projectPresence]);

  // 絞り込みが 1 つでも有効か（空状態の文言切替・件数表示に使う）。
  const isFiltered =
    categoryFilter !== "" ||
    statusFilter !== "" ||
    projectPresence !== "any" ||
    !showDone ||
    projectFilter !== "";

  const filtersValue: TaskFiltersValue = {
    categoryId: categoryFilter,
    status: statusFilter,
    projectPresence,
    showDone,
  };

  const handleClearProjectFilter = useCallback(async () => {
    setProjectFilter("");
    setPageError(null);
    try {
      await refresh(categoryFilter, showDone, "");
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "絞り込み解除に失敗しました");
    }
  }, [refresh, categoryFilter, showDone]);

  const projectFilterName =
    projectFilter
      ? projects.find((p) => p.id === projectFilter)?.name ??
        initialProjectName ??
        null
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* プロジェクト絞り込みバナー */}
      {projectFilter ? (
        <div
          data-testid="task-project-filter-banner"
          className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border-whisper bg-[color:var(--accent-bg)] px-3 py-2"
        >
          <span className="text-[13px] text-ink">
            プロジェクト「
            <span className="font-semibold" data-testid="task-project-filter-name">
              {projectFilterName ?? "（不明）"}
            </span>
            」で絞り込み中
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleClearProjectFilter()}
            data-testid="task-project-filter-clear"
          >
            絞り込みを解除
          </Button>
        </div>
      ) : null}

      {/* ツールバー: 絞り込み + 完了トグル + 追加 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <TaskFilters
            categories={categories}
            value={filtersValue}
            onChange={(next) => void handleFiltersChange(next)}
          />

          <span data-testid="task-count" className="text-[12px] text-ink-3">
            {isFiltered
              ? `${visibleTasks.length} 件 / 計 ${tasks.length} 件`
              : `${tasks.length} 件`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 表示モード切替（リスト / かんばん） */}
          <div
            role="group"
            aria-label="表示切替"
            data-testid="task-view-toggle"
            className="inline-flex overflow-hidden rounded-[4px] border-whisper"
          >
            <button
              type="button"
              onClick={() => handleSwitchView("list")}
              aria-pressed={view === "list"}
              data-testid="task-view-list"
              className={cn(
                "px-3 py-1 text-[13px] font-medium transition-colors",
                view === "list"
                  ? "bg-accent text-paper"
                  : "bg-paper text-ink-2 hover:bg-paper-2"
              )}
            >
              リスト
            </button>
            <button
              type="button"
              onClick={() => handleSwitchView("kanban")}
              aria-pressed={view === "kanban"}
              data-testid="task-view-kanban"
              className={cn(
                "px-3 py-1 text-[13px] font-medium transition-colors border-l border-[color:var(--border-whisper)]",
                view === "kanban"
                  ? "bg-accent text-paper"
                  : "bg-paper text-ink-2 hover:bg-paper-2"
              )}
            >
              かんばん
            </button>
          </div>

          <Button
            variant="primary"
            onClick={openAdd}
            data-testid="add-task-button"
          >
            ＋ タスク追加
          </Button>
        </div>
      </div>

      {pageError ? (
        <div
          role="alert"
          className="rounded-[8px] border-whisper bg-[color:var(--accent-bg)] px-3 py-2 text-[12px] text-[color:var(--warning)]"
        >
          {pageError}
        </div>
      ) : null}

      {view === "kanban" ? (
        <div className="overflow-x-auto pb-2">
          <TaskKanban tasks={visibleTasks} busyId={rowBusyId} onEdit={openEdit} />
        </div>
      ) : (
        <TaskList
          tasks={visibleTasks}
          busyId={rowBusyId}
          onToggleComplete={handleToggleComplete}
          onChangeStatus={handleChangeStatus}
          onEdit={openEdit}
          onDelete={handleDelete}
          onReleaseWaiting={openReleaseWaiting}
          onAdd={openAdd}
          filtered={isFiltered}
        />
      )}

      <WaitingStartDialog
        open={waitingDialog.mode === "start"}
        taskTitle={waitingTaskTitle}
        busy={waitingBusy}
        errorMessage={waitingError}
        onCancel={closeWaitingDialog}
        onSubmit={submitWaitingStart}
      />

      <WaitingReleaseDialog
        open={waitingDialog.mode === "release"}
        taskTitle={waitingTaskTitle}
        busy={waitingBusy}
        errorMessage={waitingError}
        onCancel={closeWaitingDialog}
        onSubmit={submitWaitingRelease}
      />

      <TaskFormDialog
        open={dialog.mode !== "closed"}
        mode={dialog.mode === "edit" ? "edit" : "add"}
        categories={categories}
        projects={projects}
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
