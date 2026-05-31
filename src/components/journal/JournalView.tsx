"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { saveJournal } from "@/lib/actions/journal";
import { setTaskPlannedDate } from "@/lib/actions/tasks";
import { formatShortDate } from "@/lib/domain/date";
import type { TaskWithRelations } from "@/lib/queries/tasks";

interface Props {
  journalDate: string;
  tomorrow: string;
  initialComment: string;
  tasks: TaskWithRelations[];
}

export function JournalView({ journalDate, tomorrow, initialComment, tasks }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState(initialComment);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      const r = await saveJournal({ journalDate, todayComment: comment });
      if (r.ok) {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function togglePlanned(task: TaskWithRelations, checked: boolean) {
    startTransition(async () => {
      await setTaskPlannedDate(task.id, checked ? tomorrow : null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <span className="text-sm font-semibold text-ink">
            今日のひとこと（{formatShortDate(journalDate)}）
          </span>
          {saved && <span className="text-xs text-success">保存しました</span>}
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <Textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setSaved(false);
            }}
            rows={3}
            placeholder="今日を一言で振り返る"
          />
          <div className="flex justify-end">
            <Button onClick={save} disabled={pending || !comment.trim()}>
              {pending ? "保存中…" : "保存"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-ink">
          明日やること（{formatShortDate(tomorrow)}）を選ぶ
        </h2>
        <p className="text-xs text-ink-subtle">
          未完了タスクから明日やるものをチェックすると、翌日のホームに表示されます。
        </p>
        {tasks.length === 0 ? (
          <EmptyState title="未完了のタスクはありません" />
        ) : (
          <div className="flex flex-col gap-1.5">
            {tasks.map((t) => {
              const plannedTomorrow = (t.plannedDate ?? "").slice(0, 10) === tomorrow;
              return (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-hairline bg-surface px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={plannedTomorrow}
                    disabled={pending}
                    onChange={(e) => togglePlanned(t, e.target.checked)}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{t.name}</span>
                  <Badge tone="neutral">{t.status}</Badge>
                  {t.plannedDate && !plannedTomorrow && (
                    <span className="text-xs text-ink-tertiary">
                      予定 {formatShortDate(t.plannedDate)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
