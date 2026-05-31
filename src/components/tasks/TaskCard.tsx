"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DragHandle } from "@/components/dnd/DragHandle";
import { TASK_STATUSES, TASK_STATUS_TONE, type TaskStatus } from "@/lib/constants";
import { daysUntil, formatShortDate } from "@/lib/domain/date";
import type { TaskWithRelations } from "@/lib/queries/tasks";

interface Props {
  task: TaskWithRelations;
  handleProps?: Record<string, unknown>;
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

function DueBadge({ dueDate }: { dueDate: string | null }) {
  const d = daysUntil(dueDate);
  if (d === null) return null;
  const tone = d < 0 ? "danger" : d <= 1 ? "warning" : "neutral";
  const label = d < 0 ? `期限超過${-d}日` : d === 0 ? "本日期限" : `あと${d}日`;
  return (
    <Badge tone={tone}>
      期限 {formatShortDate(dueDate)}・{label}
    </Badge>
  );
}

export function TaskCard({ task, handleProps, onEdit, onDelete, onStatusChange }: Props) {
  const done = task.status === "完了";
  return (
    <Card className="flex items-center gap-2 px-3 py-2.5">
      {handleProps && <DragHandle handleProps={handleProps} />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={done ? "text-ink-subtle line-through" : "text-ink"}>
            {task.name}
          </span>
          <Badge tone={TASK_STATUS_TONE[task.status as TaskStatus]}>{task.status}</Badge>
          {task.categoryName && (
            <span className="text-xs text-ink-tertiary">{task.categoryName}</span>
          )}
          {task.projectName && <Badge tone="primary">{task.projectName}</Badge>}
          {!done && <DueBadge dueDate={task.dueDate} />}
        </div>
        {task.status === "待ち" && task.waitingFor && (
          <p className="mt-1 text-xs text-warning">
            待ち: {task.waitingFor}
            {task.waitingReason ? `（${task.waitingReason}）` : ""}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Select
          aria-label="ステータス変更"
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="h-8 w-24 py-1 text-[13px]"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
          編集
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)} aria-label="削除">
          🗑
        </Button>
      </div>
    </Card>
  );
}
