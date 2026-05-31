"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { SortableList } from "@/components/dnd/SortableList";
import { StatusFilter, type StatusFilterValue } from "./StatusFilter";
import { TaskCard } from "./TaskCard";
import { WaitingList } from "./WaitingList";
import { deleteTask, reorderTasks, setTaskStatus } from "@/lib/actions/tasks";
import type { TaskStatus } from "@/lib/constants";
import type { TaskWithRelations } from "@/lib/queries/tasks";

interface Props {
  tasks: TaskWithRelations[];
  onEdit: (task: TaskWithRelations) => void;
  /** ステータスを「待ち」に変えるときは待ち入力ドロワーを開く。 */
  onRequestWaiting: (task: TaskWithRelations) => void;
}

export function TaskListView({ tasks, onEdit, onRequestWaiting }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<StatusFilterValue>("all");

  const counts = useMemo(() => {
    const c: Record<StatusFilterValue, number> = {
      all: tasks.length,
      未着手: 0,
      対応中: 0,
      待ち: 0,
      保留: 0,
      完了: 0,
    };
    for (const t of tasks) c[t.status as TaskStatus] += 1;
    return c;
  }, [tasks]);

  const visible = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  );

  const reorderEnabled = filter === "all";

  function handleStatusChange(id: string, status: TaskStatus) {
    const task = tasks.find((t) => t.id === id);
    if (status === "待ち" && task && task.status !== "待ち") {
      onRequestWaiting(task);
      return;
    }
    startTransition(async () => {
      await setTaskStatus(id, status);
      router.refresh();
    });
  }
  function handleDelete(id: string) {
    if (!window.confirm("このタスクを削除しますか？")) return;
    startTransition(async () => {
      await deleteTask(id);
      router.refresh();
    });
  }
  function handleReorder(orderedIds: string[]) {
    startTransition(async () => {
      await reorderTasks(orderedIds);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <StatusFilter value={filter} onChange={setFilter} counts={counts} />

      {filter === "待ち" ? (
        <WaitingList tasks={visible} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "タスクがありません" : "該当するタスクがありません"}
          description={filter === "all" ? "「+ タスクを追加」から登録できます。" : undefined}
        />
      ) : reorderEnabled ? (
        <>
          <p className="text-xs text-ink-tertiary">⠿ をドラッグして並び替えできます。</p>
          <SortableList
            items={visible}
            onReorder={handleReorder}
            className="flex flex-col gap-2"
            renderItem={(task, drag) => (
              <TaskCard
                task={task}
                handleProps={drag.handleProps}
                onEdit={onEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            )}
          />
        </>
      ) : (
        <>
          <p className="text-xs text-ink-tertiary">
            並び替えは「すべて」表示のときに行えます。
          </p>
          <div className="flex flex-col gap-2">
            {visible.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
