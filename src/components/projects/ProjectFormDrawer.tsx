"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { createProject, updateProject } from "@/lib/actions/projects";
import type { Project } from "@/lib/db/schema";

export interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  project?: Project | null;
}

export function ProjectFormDrawer({ open, onClose, categories, project }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!project;

  function handleSubmit(formData: FormData) {
    const input = {
      name: String(formData.get("name") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      purpose: String(formData.get("purpose") ?? ""),
      completionCondition: String(formData.get("completionCondition") ?? ""),
      dueDate: String(formData.get("dueDate") ?? ""),
    };
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateProject(project!.id, input)
        : await createProject(input);
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "プロジェクトを編集" : "プロジェクトを追加"}
    >
      <form action={handleSubmit} className="flex flex-col gap-4">
        <Field label="プロジェクト名" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            defaultValue={project?.name ?? ""}
            autoFocus
            required
          />
        </Field>
        <Field label="カテゴリ" htmlFor="categoryId" required>
          <Select
            id="categoryId"
            name="categoryId"
            defaultValue={project?.categoryId ?? ""}
            required
          >
            <option value="" disabled>
              選択してください
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="目的" htmlFor="purpose">
          <Textarea id="purpose" name="purpose" defaultValue={project?.purpose ?? ""} />
        </Field>
        <Field label="完了条件" htmlFor="completionCondition" hint="達成したと言える状態を書くと振り返りやすくなります">
          <Textarea
            id="completionCondition"
            name="completionCondition"
            defaultValue={project?.completionCondition ?? ""}
          />
        </Field>
        <Field label="期限" htmlFor="dueDate">
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={project?.dueDate ?? ""}
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
