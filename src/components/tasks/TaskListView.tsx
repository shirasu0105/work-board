"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SortableList } from "@/components/dnd/SortableList";
import { StatusFilter, type StatusFilterValue } from "./StatusFilter";
import { TaskCard } from "./TaskCard";
import { TaskFormDrawer, type Option } from "./TaskFormDrawer";
import { deleteTask, reorderTasks, setTaskStatus } from "@/lib/actions/tasks";
import type { TaskStatus } from "@/lib/constants";
import type { TaskWithRelations } from "@/lib/queries/tasks";

interface Props {
  tasks: TaskWithRelations[];
  categories: Option[];
  projects: Option[];
}

export function TaskListView({ tasks, categories, projects }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<StatusFilterValue>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);

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
  const hasCategories = categories.length > 0;

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(task: TaskWithRelations) {
    setEditing(task);
    setOpen(true);
  }
  function handleStatusChange(id: string, status: TaskStatus) {
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusFilter value={filter} onChange={setFilter} counts={counts} />
        <Button onClick={openCreate} disabled={!hasCategories}>
          + タスクを追加
        </Button>
      </div>

      {!hasCategories && (
        <p className="text-sm text-warning">
          先に設定画面でカテゴリを1つ以上作成してください。
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "タスクがありません" : "該当するタスクがありません"}
          description={
            filter === "all" ? "「+ タスクを追加」から登録できます。" : undefined
          }
        />
      ) : reorderEnabled ? (
        <>
          <p className="text-xs text-ink-tertiary">
            ⠿ をドラッグして並び替えできます。
          </p>
          <SortableList
            items={visible}
            onReorder={handleReorder}
            className="flex flex-col gap-2"
            renderItem={(task, drag) => (
              <TaskCard
                task={task}
                handleProps={drag.handleProps}
                onEdit={openEdit}
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
                onEdit={openEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </>
      )}

      <TaskFormDrawer
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        projects={projects}
        task={editing}
      />
    </div>
  );
}
