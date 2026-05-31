"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Field } from "@/components/ui/Field";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import type { Category } from "@/lib/db/schema";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 指定時は編集モード。 */
  category?: Category | null;
}

export function CategoryFormModal({ open, onClose, category }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!category;

  function handleSubmit(formData: FormData) {
    const input = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    };
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateCategory(category!.id, input)
        : await createCategory(input);
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "カテゴリを編集" : "カテゴリを追加"}
    >
      <form action={handleSubmit} className="flex flex-col gap-4" id="category-form">
        <Field label="カテゴリ名" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            defaultValue={category?.name ?? ""}
            placeholder="例: 仕事"
            autoFocus
            required
          />
        </Field>
        <Field label="説明" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            defaultValue={category?.description ?? ""}
            placeholder="任意"
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
