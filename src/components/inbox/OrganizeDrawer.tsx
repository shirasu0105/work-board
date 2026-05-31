"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import {
  organizeToTask,
  organizeToProject,
  organizeToSomeday,
} from "@/lib/actions/inbox";
import type { Option } from "@/components/tasks/TaskFormDrawer";
import type { InboxItem } from "@/lib/db/schema";

export type OrganizeTarget = "task" | "project" | "someday";

const TITLES: Record<OrganizeTarget, string> = {
  task: "タスク化",
  project: "プロジェクト化",
  someday: "Someday化",
};

interface Props {
  item: InboxItem | null;
  target: OrganizeTarget;
  categories: Option[];
  projects: Option[];
  onClose: () => void;
}

export function OrganizeDrawer({ item, target, categories, projects, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    if (!item) return;
    const categoryId = String(formData.get("categoryId") ?? "");
    const name = String(formData.get("name") ?? "");
    setError(null);

    startTransition(async () => {
      let result;
      if (target === "task") {
        result = await organizeToTask(item.id, {
          name,
          categoryId,
          projectId: String(formData.get("projectId") ?? ""),
          dueDate: String(formData.get("dueDate") ?? ""),
          plannedDate: "",
          memo: "",
          status: "未着手",
        });
      } else if (target === "project") {
        result = await organizeToProject(item.id, {
          name,
          categoryId,
          purpose: String(formData.get("purpose") ?? ""),
          completionCondition: "",
          dueDate: String(formData.get("dueDate") ?? ""),
        });
      } else {
        result = await organizeToSomeday(item.id, {
          content: name,
          categoryId,
          reason: String(formData.get("reason") ?? ""),
          reviewDate: String(formData.get("reviewDate") ?? ""),
        });
      }
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  const nameLabel =
    target === "project" ? "プロジェクト名" : target === "someday" ? "内容" : "タスク名";

  return (
    <Drawer open={!!item} onClose={onClose} title={TITLES[target]}>
      {item && (
        <form action={handleSubmit} className="flex flex-col gap-4">
          <p className="rounded-md bg-surface-2 px-3 py-2 text-xs text-ink-subtle">
            元のメモ: {item.content}
          </p>
          <Field label={nameLabel} htmlFor="name" required>
            <Input id="name" name="name" defaultValue={item.content} autoFocus required />
          </Field>
          <Field label="カテゴリ" htmlFor="categoryId" required>
            <Select id="categoryId" name="categoryId" defaultValue="" required>
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

          {target === "task" && (
            <>
              <Field label="プロジェクト" htmlFor="projectId" hint="任意">
                <Select id="projectId" name="projectId" defaultValue="">
                  <option value="">（なし）</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="期限" htmlFor="dueDate">
                <Input id="dueDate" name="dueDate" type="date" />
              </Field>
            </>
          )}

          {target === "project" && (
            <>
              <Field label="目的" htmlFor="purpose">
                <Textarea id="purpose" name="purpose" />
              </Field>
              <Field label="期限" htmlFor="dueDate">
                <Input id="dueDate" name="dueDate" type="date" />
              </Field>
            </>
          )}

          {target === "someday" && (
            <>
              <Field label="理由" htmlFor="reason">
                <Textarea id="reason" name="reason" />
              </Field>
              <Field label="見直し日" htmlFor="reviewDate">
                <Input id="reviewDate" name="reviewDate" type="date" />
              </Field>
            </>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "整理中…" : `${TITLES[target]}して整理`}
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
