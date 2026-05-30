"use client";

import { useCallback, useMemo, useState } from "react";
import type { CategoryDTO } from "@/lib/db/category";
import { Button } from "@/components/ui/Button";
import { CategoryTable } from "./CategoryTable";
import {
  CategoryFormDialog,
  type CategoryFormValue,
} from "./CategoryFormDialog";

export type CategoryManagerProps = {
  initialCategories: CategoryDTO[];
};

type DialogState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; categoryId: string };

/**
 * カテゴリ管理ページの状態管理コンテナ。
 *
 * - 初期データはサーバから SSR で受け取る
 * - 追加・編集・並び替え・ON/OFF はすべて REST API を叩いて再フェッチ
 *   （楽観更新は行わず、サーバ側の displayOrder を信頼する）
 */
export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryDTO[]>(initialCategories);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const editingInitial = useMemo<CategoryFormValue | undefined>(() => {
    if (dialog.mode !== "edit") return undefined;
    const target = categories.find((c) => c.id === dialog.categoryId);
    if (!target) return undefined;
    return {
      name: target.name,
      description: target.description ?? "",
    };
  }, [dialog, categories]);

  const openAdd = useCallback(() => {
    setDialogError(null);
    setDialog({ mode: "add" });
  }, []);

  const openEdit = useCallback((id: string) => {
    setDialogError(null);
    setDialog({ mode: "edit", categoryId: id });
  }, []);

  const closeDialog = useCallback(() => {
    if (dialogBusy) return;
    setDialog({ mode: "closed" });
    setDialogError(null);
  }, [dialogBusy]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/categories", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("カテゴリ一覧の取得に失敗しました");
    }
    const data = (await res.json()) as { categories: CategoryDTO[] };
    setCategories(data.categories);
  }, []);

  const submitDialog = useCallback(
    async (value: CategoryFormValue) => {
      setDialogBusy(true);
      setDialogError(null);
      try {
        if (dialog.mode === "add") {
          const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: value.name,
              description: value.description === "" ? null : value.description,
            }),
          });
          if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data?.error ?? "作成に失敗しました");
          }
        } else if (dialog.mode === "edit") {
          const res = await fetch(
            `/api/categories/${encodeURIComponent(dialog.categoryId)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: value.name,
                description: value.description === "" ? null : value.description,
              }),
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

  const handleToggleActive = useCallback(
    async (id: string) => {
      setRowBusyId(id);
      setPageError(null);
      try {
        const current = categories.find((c) => c.id === id);
        if (!current) return;
        const res = await fetch(
          `/api/categories/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !current.isActive }),
          }
        );
        if (!res.ok) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "表示切替に失敗しました");
        }
        await refresh();
      } catch (e) {
        setPageError(e instanceof Error ? e.message : "表示切替に失敗しました");
      } finally {
        setRowBusyId(null);
      }
    },
    [categories, refresh]
  );

  const handleMove = useCallback(
    async (id: string, direction: -1 | 1) => {
      const index = categories.findIndex((c) => c.id === id);
      if (index < 0) return;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= categories.length) return;

      const next = [...categories];
      const [moved] = next.splice(index, 1);
      next.splice(newIndex, 0, moved);
      const orderedIds = next.map((c) => c.id);

      setRowBusyId(id);
      setPageError(null);
      // 楽観更新で視覚的にも先に動かす
      setCategories(next);
      try {
        const res = await fetch("/api/categories/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        });
        if (!res.ok) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "並び替えに失敗しました");
        }
        await refresh();
      } catch (e) {
        setPageError(e instanceof Error ? e.message : "並び替えに失敗しました");
        // 失敗時はサーバの状態に戻す
        await refresh().catch(() => undefined);
      } finally {
        setRowBusyId(null);
      }
    },
    [categories, refresh]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">カテゴリ管理</h2>
          <p className="mt-0.5 text-[12px] text-ink-2">
            タスク・プロジェクト・メモを分類するための大枠を管理します。
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openAdd}
          data-testid="add-category-button"
        >
          ＋ カテゴリを追加
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

      <CategoryTable
        categories={categories}
        busyId={rowBusyId}
        onMoveUp={(id) => handleMove(id, -1)}
        onMoveDown={(id) => handleMove(id, 1)}
        onToggleActive={handleToggleActive}
        onEdit={openEdit}
      />

      <CategoryFormDialog
        open={dialog.mode !== "closed"}
        mode={dialog.mode === "edit" ? "edit" : "add"}
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
