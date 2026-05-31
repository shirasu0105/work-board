"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { setTaskPlannedDate } from "@/lib/actions/tasks";
import { TASK_STATUS_TONE, type TaskStatus } from "@/lib/constants";
import { formatShortDate } from "@/lib/domain/date";
import type { TaskWithRelations } from "@/lib/queries/tasks";

interface Props {
  today: string;
  todayTasks: TaskWithRelations[];
  candidates: TaskWithRelations[];
}

export function TodayBoard({ today, todayTasks, candidates }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function setPlanned(id: string, date: string | null) {
    startTransition(async () => {
      await setTaskPlannedDate(id, date);
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || over.id !== "today-zone") return;
    setPlanned(String(active.id), today);
  }

  return (
    <DndContext id="home-today" sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        <TodayZone count={todayTasks.length}>
          {todayTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-subtle">
              右の候補からドラッグ、または「今日やる」で追加
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {todayTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-md border border-hairline bg-surface px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{t.name}</span>
                  <Badge tone={TASK_STATUS_TONE[t.status as TaskStatus]}>{t.status}</Badge>
                  {t.dueDate && (
                    <span className="text-xs text-ink-tertiary">
                      期限 {formatShortDate(t.dueDate)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => setPlanned(t.id, null)}
                  >
                    外す
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TodayZone>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            候補（未完了・今日未設定）
          </h3>
          {candidates.length === 0 ? (
            <p className="text-sm text-ink-subtle">候補のタスクはありません。</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {candidates.map((t) => (
                <CandidateItem
                  key={t.id}
                  task={t}
                  disabled={pending}
                  onAdd={() => setPlanned(t.id, today)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}

function TodayZone({ count, children }: { count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "today-zone" });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed p-3 transition-colors",
        isOver ? "border-primary bg-primary/10" : "border-hairline-strong bg-surface-2/30",
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-ink">今日やること</span>
        <Badge tone="primary">{count}</Badge>
      </div>
      {children}
    </div>
  );
}

function CandidateItem({
  task,
  disabled,
  onAdd,
}: {
  task: TaskWithRelations;
  disabled: boolean;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  } as const;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-hairline bg-surface px-3 py-2"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none select-none text-ink-tertiary active:cursor-grabbing"
        aria-label="ドラッグして今日やることへ"
      >
        ⠿
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{task.name}</span>
      <Badge tone={TASK_STATUS_TONE[task.status as TaskStatus]}>{task.status}</Badge>
      <Button variant="ghost" size="sm" disabled={disabled} onClick={onAdd}>
        今日やる
      </Button>
    </div>
  );
}
