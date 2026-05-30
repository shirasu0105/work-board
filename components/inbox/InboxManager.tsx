"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CategoryDTO } from "@/lib/db/category";
import type { InboxItemDTO } from "@/lib/types/inbox";
import {
  TaskFormDialog,
  type TaskFormValue,
} from "@/components/task/TaskFormDialog";
import {
  ProjectFormDialog,
  type ProjectFormValue,
} from "@/components/project/ProjectFormDialog";
import {
  SomedayFormDialog,
  type SomedayFormValue,
} from "@/components/someday/SomedayFormDialog";
import { QuickAddBar } from "./QuickAddBar";
import { InboxList } from "./InboxList";

export type InboxManagerProps = {
  initialItems: InboxItemDTO[];
  categories: CategoryDTO[];
};

type ConvertDialog =
  | { mode: "closed" }
  | { mode: "task"; itemId: string; content: string }
  | { mode: "project"; itemId: string; content: string }
  | { mode: "someday"; itemId: string; content: string };

/**
 * Inbox ページの状態管理コンテナ（要件書 §10.2）。
 *
 * - クイック追加 → 一覧再フェッチ
 * - タスク化 / プロジェクト化 → 内容入りのフォームを開き、保存時に convert API を叩いて
 *   Inbox 項目を processed にして一覧から外す
 * - Someday 化 → convert API（target=someday）で archived にして一覧から外す
 * - 削除 → 物理削除
 */
export function InboxManager({ initialItems, categories }: InboxManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<InboxItemDTO[]>(initialItems);
  const [addBusy, setAddBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [convert, setConvert] = useState<ConvertDialog>({ mode: "closed" });
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/inbox", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Inbox 一覧の取得に失敗しました");
    }
    const data = (await res.json()) as { items: InboxItemDTO[] };
    setItems(data.items);
  }, []);

  const handleAdd = useCallback(
    async (content: string) => {
      setAddBusy(true);
      setPageError(null);
      try {
        const res = await fetch("/api/inbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "追加に失敗しました");
        }
        await refresh();
      } catch (e) {
        setPageError(e instanceof Error ? e.message : "追加に失敗しました");
      } finally {
        setAddBusy(false);
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const target = items.find((i) => i.id === id);
      const ok = window.confirm(
        `「${target?.content ?? "この項目"}」を削除しますか？`
      );
      if (!ok) return;
      setRowBusyId(id);
      setPageError(null);
      try {
        const res = await fetch(`/api/inbox/${encodeURIComponent(id)}`, {
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
    [items, refresh]
  );

  // Someday 化はカテゴリ必須（要件 §10.7.3）のためダイアログを開く
  const openSomeday = useCallback(
    (id: string) => {
      const it = items.find((i) => i.id === id);
      if (!it) return;
      setDialogError(null);
      setConvert({ mode: "someday", itemId: id, content: it.content });
    },
    [items]
  );

  // 内容を持たせてタスク化フォームを開く
  const openTask = useCallback(
    (id: string) => {
      const it = items.find((i) => i.id === id);
      if (!it) return;
      setDialogError(null);
      setConvert({ mode: "task", itemId: id, content: it.content });
    },
    [items]
  );

  const openProject = useCallback(
    (id: string) => {
      const it = items.find((i) => i.id === id);
      if (!it) return;
      setDialogError(null);
      setConvert({ mode: "project", itemId: id, content: it.content });
    },
    [items]
  );

  const closeConvert = useCallback(() => {
    if (dialogBusy) return;
    setConvert({ mode: "closed" });
    setDialogError(null);
  }, [dialogBusy]);

  const submitTaskConvert = useCallback(
    async (value: TaskFormValue) => {
      if (convert.mode !== "task") return;
      setDialogBusy(true);
      setDialogError(null);
      try {
        const res = await fetch(
          `/api/inbox/${encodeURIComponent(convert.itemId)}/convert`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target: "task",
              categoryId: value.categoryId,
              dueDate: value.dueDate === "" ? null : value.dueDate,
              note: value.note === "" ? null : value.note,
            }),
          }
        );
        if (!res.ok) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "タスク化に失敗しました");
        }
        await refresh();
        setConvert({ mode: "closed" });
        // 確認しやすいようタスク一覧へ遷移
        router.push("/tasks");
      } catch (e) {
        setDialogError(e instanceof Error ? e.message : "タスク化に失敗しました");
      } finally {
        setDialogBusy(false);
      }
    },
    [convert, refresh, router]
  );

  const submitProjectConvert = useCallback(
    async (value: ProjectFormValue) => {
      if (convert.mode !== "project") return;
      setDialogBusy(true);
      setDialogError(null);
      try {
        const res = await fetch(
          `/api/inbox/${encodeURIComponent(convert.itemId)}/convert`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target: "project",
              categoryId: value.categoryId,
              completion: value.completion === "" ? null : value.completion,
              dueDate: value.dueDate === "" ? null : value.dueDate,
              purpose: value.purpose === "" ? null : value.purpose,
            }),
          }
        );
        if (!res.ok) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "プロジェクト化に失敗しました");
        }
        await refresh();
        setConvert({ mode: "closed" });
        router.push("/projects");
      } catch (e) {
        setDialogError(
          e instanceof Error ? e.message : "プロジェクト化に失敗しました"
        );
      } finally {
        setDialogBusy(false);
      }
    },
    [convert, refresh, router]
  );

  const submitSomedayConvert = useCallback(
    async (value: SomedayFormValue) => {
      if (convert.mode !== "someday") return;
      setDialogBusy(true);
      setDialogError(null);
      try {
        const res = await fetch(
          `/api/inbox/${encodeURIComponent(convert.itemId)}/convert`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target: "someday",
              categoryId: value.categoryId,
              reason: value.reason === "" ? null : value.reason,
            }),
          }
        );
        if (!res.ok) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "Someday 化に失敗しました");
        }
        await refresh();
        setConvert({ mode: "closed" });
      } catch (e) {
        setDialogError(
          e instanceof Error ? e.message : "Someday 化に失敗しました"
        );
      } finally {
        setDialogBusy(false);
      }
    },
    [convert, refresh]
  );

  const taskInitial = useMemo<TaskFormValue | undefined>(() => {
    if (convert.mode !== "task") return undefined;
    return {
      title: convert.content,
      categoryId: categories[0]?.id ?? "",
      dueDate: "",
      note: "",
      projectId: "",
    };
  }, [convert, categories]);

  const projectInitial = useMemo<ProjectFormValue | undefined>(() => {
    if (convert.mode !== "project") return undefined;
    return {
      name: convert.content,
      categoryId: categories[0]?.id ?? "",
      completion: "",
      dueDate: "",
      purpose: "",
      status: "active",
    };
  }, [convert, categories]);

  const somedayInitial = useMemo<SomedayFormValue | undefined>(() => {
    if (convert.mode !== "someday") return undefined;
    return {
      content: convert.content,
      categoryId: categories[0]?.id ?? "",
      reason: "",
    };
  }, [convert, categories]);

  return (
    <div className="flex flex-col gap-4">
      <QuickAddBar busy={addBusy} onAdd={handleAdd} />

      <div className="flex items-center justify-between gap-3">
        <span data-testid="inbox-count" className="text-[12px] text-ink-3">
          未整理 {items.length} 件
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

      <InboxList
        items={items}
        busyId={rowBusyId}
        onConvertTask={openTask}
        onConvertProject={openProject}
        onSomeday={openSomeday}
        onDelete={(id) => void handleDelete(id)}
      />

      <TaskFormDialog
        open={convert.mode === "task"}
        mode="add"
        categories={categories}
        initial={taskInitial}
        lockTitle
        busy={dialogBusy}
        errorMessage={dialogError}
        onCancel={closeConvert}
        onSubmit={submitTaskConvert}
      />

      <ProjectFormDialog
        open={convert.mode === "project"}
        mode="add"
        categories={categories}
        initial={projectInitial}
        lockName
        hideStatus
        busy={dialogBusy}
        errorMessage={dialogError}
        onCancel={closeConvert}
        onSubmit={submitProjectConvert}
      />

      <SomedayFormDialog
        open={convert.mode === "someday"}
        categories={categories}
        initial={somedayInitial}
        lockContent
        title="Someday に追加"
        busy={dialogBusy}
        errorMessage={dialogError}
        onCancel={closeConvert}
        onSubmit={submitSomedayConvert}
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
