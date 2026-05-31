"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { computeReorder } from "@/lib/domain/reorder";
import { daysUntil, daysSince, formatShortDate } from "@/lib/domain/date";
import { reorderTasks, setTaskStatus } from "@/lib/actions/tasks";
import type { TaskWithRelations } from "@/lib/queries/tasks";

const COL_PREFIX = "col:";

interface Props {
  tasks: TaskWithRelations[];
  onEdit: (task: TaskWithRelations) => void;
  /** 「待ち」列へドロップされたとき、待ち入力ドロワーを開く。 */
  onRequestWaiting: (task: TaskWithRelations) => void;
}

export function KanbanBoard({ tasks, onEdit, onRequestWaiting }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // props を起点にしたローカル状態（楽観更新用）。
  // 親が tasks の署名を key に渡すため、サーバ更新時はこのコンポーネントが再マウントされ初期化される。
  const [items, setItems] = useState<TaskWithRelations[]>(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const byStatus = (status: TaskStatus) =>
    items
      .filter((t) => t.status === status)
      .sort((a, b) => a.displayOrder - b.displayOrder);

  function statusOf(id: string): TaskStatus | null {
    return (items.find((t) => t.id === id)?.status as TaskStatus) ?? null;
  }

  function resolveTargetStatus(overId: string): TaskStatus | null {
    if (overId.startsWith(COL_PREFIX)) {
      return overId.slice(COL_PREFIX.length) as TaskStatus;
    }
    return statusOf(overId);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const sourceStatus = statusOf(activeIdStr);
    const targetStatus = resolveTargetStatus(overIdStr);
    if (!sourceStatus || !targetStatus) return;

    if (sourceStatus === targetStatus) {
      // 同一列内の並び替え（over が列自身なら何もしない）
      if (overIdStr.startsWith(COL_PREFIX) || activeIdStr === overIdStr) return;
      const globalIds = items
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((t) => t.id);
      const nextIds = computeReorder(globalIds, activeIdStr, overIdStr);
      // 楽観的に display_order を振り直す
      const orderMap = new Map(nextIds.map((id, i) => [id, i]));
      setItems((prev) =>
        prev.map((t) => ({ ...t, displayOrder: orderMap.get(t.id) ?? t.displayOrder })),
      );
      startTransition(async () => {
        await reorderTasks(nextIds);
        router.refresh();
      });
      return;
    }

    // 列間移動 = ステータス変更
    const task = items.find((t) => t.id === activeIdStr);
    if (!task) return;

    if (targetStatus === "待ち") {
      // 待ち必須項目の入力を促す（確定は待ちドロワー側）
      onRequestWaiting(task);
      return;
    }

    setItems((prev) =>
      prev.map((t) => (t.id === activeIdStr ? { ...t, status: targetStatus } : t)),
    );
    startTransition(async () => {
      await setTaskStatus(activeIdStr, targetStatus);
      router.refresh();
    });
  }

  const activeTask = activeId ? items.find((t) => t.id === activeId) ?? null : null;

  return (
    <DndContext
      id="task-kanban"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} tasks={byStatus(status)}>
            {byStatus(status).map((task) => (
              <KanbanCard key={task.id} task={task} onEdit={onEdit} />
            ))}
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <CardSurface task={activeTask} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  tasks,
  children,
}: {
  status: TaskStatus;
  tasks: TaskWithRelations[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: COL_PREFIX + status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-40 flex-col gap-2 rounded-lg border border-hairline bg-surface-2/40 p-2",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between px-1 py-0.5">
        <span className="text-[13px] font-semibold text-ink">{status}</span>
        <Badge tone="neutral">{tasks.length}</Badge>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">{children}</div>
      </SortableContext>
    </div>
  );
}

function KanbanCard({
  task,
  onEdit,
}: {
  task: TaskWithRelations;
  onEdit: (task: TaskWithRelations) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  } as const;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardSurface task={task} onEdit={onEdit} />
    </div>
  );
}

/** カードの見た目（DragOverlay と共用）。 */
function CardSurface({
  task,
  onEdit,
  dragging,
}: {
  task: TaskWithRelations;
  onEdit?: (task: TaskWithRelations) => void;
  dragging?: boolean;
}) {
  const due = daysUntil(task.dueDate);
  const waitingDays =
    task.status === "待ち" ? daysSince(task.waitingStartedAt) : null;

  return (
    <div
      className={cn(
        "cursor-grab touch-none rounded-md border border-hairline bg-surface p-2.5 active:cursor-grabbing",
        dragging && "shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[13px] leading-snug text-ink">{task.name}</span>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 rounded p-0.5 text-ink-tertiary hover:text-ink"
            aria-label="編集"
          >
            ✎
          </button>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {task.categoryName && (
          <span className="text-[11px] text-ink-tertiary">{task.categoryName}</span>
        )}
        {task.projectName && <Badge tone="primary">{task.projectName}</Badge>}
        {due !== null && task.status !== "完了" && (
          <Badge tone={due < 0 ? "danger" : due <= 1 ? "warning" : "neutral"}>
            {formatShortDate(task.dueDate)}
          </Badge>
        )}
        {waitingDays !== null && (
          <Badge tone="warning">待ち{waitingDays}日</Badge>
        )}
      </div>
      {task.status === "待ち" && task.waitingFor && (
        <p className="mt-1 text-[11px] text-warning">→ {task.waitingFor}</p>
      )}
    </div>
  );
}
