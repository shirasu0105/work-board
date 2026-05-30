import { PageShell } from "@/components/layout/PageShell";
import { MemoFormByKind } from "@/components/memo/MemoFormByKind";
import { listCategories } from "@/lib/db/category";
import { listProjects } from "@/lib/db/project";

export const dynamic = "force-dynamic";

export default async function MemoNewPage() {
  const [allCategories, allProjects] = await Promise.all([
    listCategories(),
    listProjects(),
  ]);

  const activeCategories = allCategories.filter((c) => c.isActive);
  const projectOptions = allProjects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <PageShell
      title="メモを書く"
      subtitle="メモ種別を選択してフォーマット付きで新しいメモを作成する"
    >
      <MemoFormByKind
        mode="create"
        categories={activeCategories}
        projects={projectOptions}
      />
    </PageShell>
  );
}
