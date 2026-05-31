"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Field } from "@/components/ui/Field";
import { startWaiting } from "@/lib/actions/tasks";
import type { TaskWithRelations } from "@/lib/queries/tasks";

interface Props {
  task: TaskWithRelations | null;
  onClose: () => void;
}

/** 「待ち」へ遷移する際に待ち相手/理由などを入力するドロワー。 */
export function WaitingDrawer({ task, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    if (!task) return;
    const input = {
      waitingFor: String(formData.get("waitingFor") ?? ""),
      waitingReason: String(formData.get("waitingReason") ?? ""),
      waitingCheckDate: String(formData.get("waitingCheckDate") ?? ""),
      waitingRequestMemo: String(formData.get("waitingRequestMemo") ?? ""),
    };
    setError(null);
    startTransition(async () => {
      const result = await startWaiting(task.id, input);
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Drawer open={!!task} onClose={onClose} title="待ちにする">
      {task && (
        <form action={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-ink-subtle">
            「{task.name}」を待ち状態にします。
          </p>
          <Field label="待ち相手" htmlFor="waitingFor" required>
            <Input
              id="waitingFor"
              name="waitingFor"
              defaultValue={task.waitingFor ?? ""}
              placeholder="例: デザインチーム"
              autoFocus
              required
            />
          </Field>
          <Field label="待ち理由" htmlFor="waitingReason" required>
            <Textarea
              id="waitingReason"
              name="waitingReason"
              defaultValue={task.waitingReason ?? ""}
              placeholder="例: カンプの提出待ち"
              required
            />
          </Field>
          <Field label="確認予定日" htmlFor="waitingCheckDate" hint="この日を過ぎるとホームの確認リストに表示されます">
            <Input
              id="waitingCheckDate"
              name="waitingCheckDate"
              type="date"
              defaultValue={task.waitingCheckDate ?? ""}
            />
          </Field>
          <Field label="依頼メモ" htmlFor="waitingRequestMemo">
            <Textarea
              id="waitingRequestMemo"
              name="waitingRequestMemo"
              defaultValue={task.waitingRequestMemo ?? ""}
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "保存中…" : "待ちにする"}
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
