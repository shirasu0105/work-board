import { PageShell } from "@/components/layout/PageShell";
import { TaskManager } from "@/components/task/TaskManager";
import { listCategories } from "@/lib/db/category";
import { listTasks } from "@/lib/db/task";

// タスク一覧は常に最新を SSR で取得する
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [initialTasks, allCategories] = await Promise.all([
    listTasks(),
    listCategories(),
  ]);

  // フォーム・絞り込みで選べるのは有効なカテゴリのみ
  const activeCategories = allCategories.filter((c) => c.isActive);

  return (
    <PageShell
      title="タスク"
      subtitle="カテゴリ・プロジェクト・ステータスでタスクを管理する"
    >
      <TaskManager
        initialTasks={initialTasks}
        categories={activeCategories}
      />
    </PageShell>
  );
}
