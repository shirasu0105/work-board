"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { endWaiting } from "@/lib/actions/tasks";
import { daysSince, daysUntil, formatShortDate } from "@/lib/domain/date";
import type { TaskWithRelations } from "@/lib/queries/tasks";

/** 待ちフィルタ選択時の専用ビュー。待ち専用列を追加表示する（SPEC 10.6.4）。 */
export function WaitingList({ tasks }: { tasks: TaskWithRelations[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function release(id: string) {
    startTransition(async () => {
      await endWaiting(id, { status: "未着手", waitingReplyMemo: undefined });
      router.refresh();
    });
  }

  if (tasks.length === 0) {
    return <EmptyState title="待ちのタスクはありません" />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-hairline bg-surface-2 text-xs text-ink-subtle">
          <tr>
            <th className="px-3 py-2 font-medium">タスク</th>
            <th className="px-3 py-2 font-medium">待ち相手</th>
            <th className="px-3 py-2 font-medium">理由</th>
            <th className="px-3 py-2 font-medium">開始日</th>
            <th className="px-3 py-2 font-medium">確認予定日</th>
            <th className="px-3 py-2 font-medium">待ち日数</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const days = daysSince(t.waitingStartedAt);
            const checkDue = daysUntil(t.waitingCheckDate);
            const checkOverdue = checkDue !== null && checkDue <= 0;
            return (
              <tr key={t.id} className="border-b border-hairline last:border-0">
                <td className="px-3 py-2 text-ink">{t.name}</td>
                <td className="px-3 py-2 text-ink-muted">{t.waitingFor ?? "—"}</td>
                <td className="max-w-48 truncate px-3 py-2 text-ink-subtle">
                  {t.waitingReason ?? "—"}
                </td>
                <td className="px-3 py-2 text-ink-subtle">
                  {formatShortDate(t.waitingStartedAt) || "—"}
                </td>
                <td className="px-3 py-2">
                  {t.waitingCheckDate ? (
                    <Badge tone={checkOverdue ? "danger" : "neutral"}>
                      {formatShortDate(t.waitingCheckDate)}
                    </Badge>
                  ) : (
                    <span className="text-ink-tertiary">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-muted">
                  {days !== null ? `${days}日` : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => release(t.id)}
                  >
                    待ち解除
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
