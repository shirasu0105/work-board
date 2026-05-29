import { PageShell } from "@/components/layout/PageShell";
import { TaskManager } from "@/components/task/TaskManager";
import { listCategories } from "@/lib/db/category";
import { listTasks } from "@/lib/db/task";
import { getProject, listProjects } from "@/lib/db/project";

// タスク一覧は常に最新を SSR で取得する
export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { projectId: rawProjectId } = await searchParams;
  const projectId = rawProjectId?.trim() || undefined;

  const [initialTasks, allCategories, allProjects, filterProject] =
    await Promise.all([
      listTasks({ projectId }),
      listCategories(),
      listProjects(),
      projectId ? getProject(projectId) : Promise.resolve(null),
    ]);

  // フォーム・絞り込みで選べるのは有効なカテゴリのみ
  const activeCategories = allCategories.filter((c) => c.isActive);
  // タスク紐付け用のプロジェクト選択肢（完了は除外しない＝編集で参照可能なように全件）
  const projectOptions = allProjects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <PageShell
      title="タスク"
      subtitle="カテゴリ・プロジェクト・ステータスでタスクを管理する"
    >
      <TaskManager
        initialTasks={initialTasks}
        categories={activeCategories}
        projects={projectOptions}
        initialProjectId={filterProject ? filterProject.id : ""}
        initialProjectName={filterProject?.name}
      />
    </PageShell>
  );
}
