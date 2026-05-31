"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { createTask, updateTask } from "@/lib/actions/tasks";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import type { Task } from "@/lib/db/schema";

export interface Option {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Option[];
  projects: Option[];
  task?: Task | null;
}

export function TaskFormDrawer({ open, onClose, categories, projects, task }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!task;

  function handleSubmit(formData: FormData) {
    const input = {
      name: String(formData.get("name") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      projectId: String(formData.get("projectId") ?? ""),
      dueDate: String(formData.get("dueDate") ?? ""),
      plannedDate: String(formData.get("plannedDate") ?? ""),
      memo: String(formData.get("memo") ?? ""),
      status: (String(formData.get("status") ?? "未着手") as TaskStatus),
    };
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateTask(task!.id, input)
        : await createTask(input);
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Drawer open={open} onClose={onClose} title={isEdit ? "タスクを編集" : "タスクを追加"}>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <Field label="タスク名" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={task?.name ?? ""} autoFocus required />
        </Field>
        <Field label="カテゴリ" htmlFor="categoryId" required>
          <Select id="categoryId" name="categoryId" defaultValue={task?.categoryId ?? ""} required>
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
        <Field label="プロジェクト" htmlFor="projectId" hint="任意">
          <Select id="projectId" name="projectId" defaultValue={task?.projectId ?? ""}>
            <option value="">（なし）</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="ステータス" htmlFor="status">
          <Select id="status" name="status" defaultValue={task?.status ?? "未着手"}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="期限" htmlFor="dueDate">
            <Input id="dueDate" name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} />
          </Field>
          <Field label="予定日" htmlFor="plannedDate" hint="今日/明日やること">
            <Input
              id="plannedDate"
              name="plannedDate"
              type="date"
              defaultValue={task?.plannedDate ?? ""}
            />
          </Field>
        </div>
        <Field label="メモ" htmlFor="memo">
          <Textarea id="memo" name="memo" defaultValue={task?.memo ?? ""} />
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
