"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryFormModal } from "./CategoryFormModal";
import { setCategoryActive } from "@/lib/actions/categories";
import type { Category } from "@/lib/db/schema";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setModalOpen(true);
  }

  function toggleActive(category: Category) {
    startTransition(async () => {
      await setCategoryActive(category.id, !category.isActive);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>+ カテゴリを追加</Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="カテゴリがありません"
          description="最初のカテゴリを追加してください。"
          action={<Button onClick={openCreate}>+ カテゴリを追加</Button>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <Card key={c.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{c.name}</span>
                  {!c.isActive && <Badge tone="neutral">非表示</Badge>}
                </div>
                {c.description && (
                  <p className="mt-0.5 truncate text-sm text-ink-subtle">
                    {c.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  編集
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(c)}>
                  {c.isActive ? "非表示にする" : "再表示"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editing}
      />
    </div>
  );
}
