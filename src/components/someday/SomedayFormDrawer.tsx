"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { createSomeday, updateSomeday } from "@/lib/actions/someday";
import type { Option } from "@/components/tasks/TaskFormDrawer";
import type { SomedayItem } from "@/lib/db/schema";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Option[];
  item?: SomedayItem | null;
}

export function SomedayFormDrawer({ open, onClose, categories, item }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!item;

  function handleSubmit(formData: FormData) {
    const input = {
      content: String(formData.get("content") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      reviewDate: String(formData.get("reviewDate") ?? ""),
    };
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateSomeday(item!.id, input)
        : await createSomeday(input);
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Drawer open={open} onClose={onClose} title={isEdit ? "Somedayを編集" : "Somedayを追加"}>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <Field label="内容" htmlFor="content" required>
          <Input id="content" name="content" defaultValue={item?.content ?? ""} autoFocus required />
        </Field>
        <Field label="カテゴリ" htmlFor="categoryId" required>
          <Select id="categoryId" name="categoryId" defaultValue={item?.categoryId ?? ""} required>
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
        <Field label="理由" htmlFor="reason" hint="なぜ今やらないのか">
          <Textarea id="reason" name="reason" defaultValue={item?.reason ?? ""} />
        </Field>
        <Field label="見直し日" htmlFor="reviewDate">
          <Input id="reviewDate" name="reviewDate" type="date" defaultValue={item?.reviewDate ?? ""} />
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
