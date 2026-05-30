"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/common/EmptyState";
import {
  SomedayFormDialog,
  type SomedayFormValue,
} from "@/components/someday/SomedayFormDialog";
import type { CategoryDTO } from "@/lib/db/category";
import type { SomedayItemDTO } from "@/lib/types/someday";

export type SomedayReviewStepProps = {
  initialItems: SomedayItemDTO[];
  categories: CategoryDTO[];
};

/**
 * ステップ 5: Someday 見直し（要件 §10.13.3-5 / §10.7）。
 *
 * Someday 一覧の確認・追加・削除を週次レビュー内で完結できる簡易実装。
 */
export function SomedayReviewStep({
  initialItems,
  categories,
}: SomedayReviewStepProps) {
  const [items, setItems] = useState<SomedayItemDTO[]>(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = useCallback(
    async (value: SomedayFormValue) => {
      setDialogBusy(true);
      setDialogError(null);
      try {
        const res = await fetch("/api/someday", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: value.content,
            categoryId: value.categoryId,
            reason: value.reason === "" ? null : value.reason,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "追加に失敗しました");
        }
        const data = (await res.json()) as { item: SomedayItemDTO };
        setItems((prev) => [data.item, ...prev]);
        setDialogOpen(false);
      } catch (e) {
        setDialogError(e instanceof Error ? e.message : "追加に失敗しました");
      } finally {
        setDialogBusy(false);
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (item: SomedayItemDTO) => {
      const ok = window.confirm(`「${item.content}」を削除しますか？`);
      if (!ok) return;
      setBusyId(item.id);
      setError(null);
      try {
        const res = await fetch(`/api/someday/${encodeURIComponent(item.id)}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 204) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "削除に失敗しました");
        }
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
      } finally {
        setBusyId(null);
      }
    },
    []
  );

  return (
    <div className="flex flex-col gap-3" data-testid="review-someday">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-ink-2">
          Someday {items.length} 件
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setDialogError(null);
            setDialogOpen(true);
          }}
          data-testid="review-someday-add"
        >
          ＋ Someday 追加
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-[8px] border-whisper bg-[color:var(--accent-bg)] px-3 py-2 text-[12px] text-[color:var(--warning)]"
        >
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          data-testid="review-someday-empty"
          icon="☁"
          title="Someday 項目はありません。"
          description="いつかやりたいことを「＋ Someday 追加」で記録できます。"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((it) => (
            <li
              key={it.id}
              data-testid="review-someday-row"
              data-someday-id={it.id}
              className="flex flex-wrap items-center gap-2 rounded-[8px] border-whisper bg-paper px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                {it.content}
              </span>
              <Chip data-testid="review-someday-category">
                {it.categoryName}
              </Chip>
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId === it.id}
                onClick={() => void handleDelete(it)}
                data-testid="review-someday-delete"
                className="text-[color:var(--warning)]"
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
      )}

      <SomedayFormDialog
        open={dialogOpen}
        categories={categories}
        title="Someday に追加"
        busy={dialogBusy}
        errorMessage={dialogError}
        onCancel={() => {
          if (!dialogBusy) setDialogOpen(false);
        }}
        onSubmit={handleAdd}
      />
    </div>
  );
}
