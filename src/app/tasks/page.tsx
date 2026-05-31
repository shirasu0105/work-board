import { PageShell } from "@/components/layout/PageShell";
import { listTasks } from "@/lib/queries/tasks";
import { listActiveCategories } from "@/lib/queries/categories";
import { listProjects } from "@/lib/queries/projects";
import { TasksView } from "@/components/tasks/TasksView";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  const tasks = listTasks();
  const categories = listActiveCategories();
  const projects = listProjects().filter((p) => p.status === "active");

  return (
    <PageShell title="タスク">
      <TasksView
        tasks={tasks}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </PageShell>
  );
}
