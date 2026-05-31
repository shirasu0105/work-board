import { PageShell } from "@/components/layout/PageShell";
import { listProjects } from "@/lib/queries/projects";
import { listActiveCategories } from "@/lib/queries/categories";
import { ProjectManager } from "@/components/projects/ProjectManager";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = listProjects();
  const categories = listActiveCategories();

  return (
    <PageShell title="プロジェクト">
      <ProjectManager
        projects={projects}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </PageShell>
  );
}
