import { PageShell } from "@/components/layout/PageShell";
import { ProjectManager } from "@/components/project/ProjectManager";
import { listCategories } from "@/lib/db/category";
import { listProjects } from "@/lib/db/project";

// プロジェクト一覧は常に最新を SSR で取得する
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [initialProjects, allCategories] = await Promise.all([
    listProjects(),
    listCategories(),
  ]);

  // フォームで選べるのは有効なカテゴリのみ
  const activeCategories = allCategories.filter((c) => c.isActive);

  return (
    <PageShell
      title="プロジェクト"
      subtitle="複数のタスクを束ねた完了条件付きの作業単位を管理する"
    >
      <ProjectManager
        initialProjects={initialProjects}
        categories={activeCategories}
      />
    </PageShell>
  );
}
