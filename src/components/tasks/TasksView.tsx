"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useViewMode } from "@/lib/useViewMode";
import { ViewToggle } from "./ViewToggle";
import { TaskListView } from "./TaskListView";
import { KanbanBoard } from "./KanbanBoard";
import { TaskFormDrawer, type Option } from "./TaskFormDrawer";
import { WaitingDrawer } from "./WaitingDrawer";
import type { TaskWithRelations } from "@/lib/queries/tasks";

interface Props {
  tasks: TaskWithRelations[];
  categories: Option[];
  projects: Option[];
}

export function TasksView({ tasks, categories, projects }: Props) {
  const [mode, setMode] = useViewMode();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);
  const [waitingTask, setWaitingTask] = useState<TaskWithRelations | null>(null);

  const hasCategories = categories.length > 0;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(task: TaskWithRelations) {
    setEditing(task);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle mode={mode} onChange={setMode} />
        <Button onClick={openCreate} disabled={!hasCategories}>
          + タスクを追加
        </Button>
      </div>

      {!hasCategories && (
        <p className="text-sm text-warning">
          先に設定画面でカテゴリを1つ以上作成してください。
        </p>
      )}

      {mode === "list" ? (
        <TaskListView
          tasks={tasks}
          onEdit={openEdit}
          onRequestWaiting={setWaitingTask}
        />
      ) : (
        <KanbanBoard
          key={tasks.map((t) => `${t.id}:${t.status}:${t.displayOrder}`).join("|")}
          tasks={tasks}
          onEdit={openEdit}
          onRequestWaiting={setWaitingTask}
        />
      )}

      <TaskFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={categories}
        projects={projects}
        task={editing}
      />
      <WaitingDrawer task={waitingTask} onClose={() => setWaitingTask(null)} />
    </div>
  );
}
