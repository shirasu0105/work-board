import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemoFormByKind } from "@/components/memo/MemoFormByKind";
import { listCategories } from "@/lib/db/category";
import { listProjects } from "@/lib/db/project";
import { getMemo } from "@/lib/db/memo";

export const dynamic = "force-dynamic";

type MemoEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemoEditPage({ params }: MemoEditPageProps) {
  const { id } = await params;

  const [memo, allCategories, allProjects] = await Promise.all([
    getMemo(id),
    listCategories(),
    listProjects(),
  ]);

  if (!memo) {
    notFound();
  }

  // 編集では、選択中カテゴリが無効化されていても選べるよう全件渡す。
  // ただし新規選択肢としては有効カテゴリ＋現在のカテゴリを優先表示する。
  const categoryOptions = allCategories.filter(
    (c) => c.isActive || c.id === memo.categoryId
  );
  const projectOptions = allProjects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <PageShell
      title="メモを編集"
      subtitle="保存済みメモを作成時の種別フォーマットで編集する"
    >
      <MemoFormByKind
        mode="edit"
        categories={categoryOptions}
        projects={projectOptions}
        initial={memo}
      />
    </PageShell>
  );
}
