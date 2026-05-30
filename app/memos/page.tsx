import { PageShell } from "@/components/layout/PageShell";
import { MemoTimeline } from "@/components/memo/MemoTimeline";
import { listCategories } from "@/lib/db/category";
import { listMemos } from "@/lib/db/memo";

// メモ一覧は常に最新を SSR で取得する
export const dynamic = "force-dynamic";

export default async function MemosPage() {
  const [initialMemos, allCategories] = await Promise.all([
    listMemos(),
    listCategories(),
  ]);

  // 絞り込みで選べるのは有効なカテゴリのみ
  const activeCategories = allCategories.filter((c) => c.isActive);

  return (
    <PageShell
      title="メモ"
      subtitle="議事録・TTメモ・思いつき・調査・作業ログを種別ごとに記録する"
    >
      <MemoTimeline initialMemos={initialMemos} categories={activeCategories} />
    </PageShell>
  );
}
