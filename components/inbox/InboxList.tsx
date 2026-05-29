"use client";

import { cn } from "@/lib/cn";
import type { InboxItemDTO } from "@/lib/types/inbox";
import { Button } from "@/components/ui/Button";

export type InboxListProps = {
  items: InboxItemDTO[];
  busyId?: string | null;
  onConvertTask: (id: string) => void;
  onConvertProject: (id: string) => void;
  onSomeday: (id: string) => void;
  onDelete: (id: string) => void;
};

/**
 * Inbox 未整理一覧（screens-1.jsx InboxScreen 参考）。
 * 各行: 経過時間 / 内容 / アクション（タスク化・プロジェクト化・Someday化・削除）。
 */
export function InboxList({
  items,
  busyId,
  onConvertTask,
  onConvertProject,
  onSomeday,
  onDelete,
}: InboxListProps) {
  if (items.length === 0) {
    return (
      <div
        data-testid="inbox-empty"
        className="rounded-[12px] border-whisper bg-paper px-6 py-10 text-center"
      >
        <p className="text-[14px] text-ink">未整理の項目はありません。</p>
        <p className="mt-1 text-[12px] text-ink-2">
          上のバーから思いついたことを素早く追加してください。
        </p>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Inbox 一覧"
      data-testid="inbox-list"
      className="flex flex-col gap-2"
    >
      {items.map((it) => {
        const isBusy = busyId === it.id;
        return (
          <div
            key={it.id}
            role="listitem"
            data-testid="inbox-row"
            data-inbox-id={it.id}
            className={cn(
              "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border-whisper bg-paper px-4 py-3 shadow-card transition-opacity",
              isBusy && "opacity-60"
            )}
          >
            <span
              className="w-9 shrink-0 text-[12px] text-ink-3"
              aria-hidden
              title={new Date(it.createdAt).toLocaleString("ja-JP")}
            >
              {formatAge(it.createdAt)}
            </span>
            <span
              data-testid="inbox-content"
              className="min-w-[160px] flex-1 truncate text-[14px] text-ink"
              title={it.content}
            >
              {it.content}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                size="sm"
                variant="secondary"
                disabled={isBusy}
                onClick={() => onConvertTask(it.id)}
                data-testid="inbox-to-task"
              >
                ✓ タスク化
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={isBusy}
                onClick={() => onConvertProject(it.id)}
                data-testid="inbox-to-project"
              >
                ◷ プロジェクト化
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={isBusy}
                onClick={() => onSomeday(it.id)}
                data-testid="inbox-to-someday"
              >
                ☾ Someday化
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isBusy}
                onClick={() => onDelete(it.id)}
                data-testid="inbox-delete"
                className="text-[color:var(--warning)]"
                aria-label="削除"
              >
                削除
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 作成からの経過をざっくり日本語で表す。 */
function formatAge(iso: string): string {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return "";
  const diffMs = Date.now() - created;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "今";
  if (min < 60) return `${min}分`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h`;
  const day = Math.floor(hour / 24);
  if (day === 1) return "昨日";
  return `${day}日`;
}
