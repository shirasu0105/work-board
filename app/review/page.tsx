import { PageShell } from "@/components/layout/PageShell";
import { ReviewStepper } from "@/components/review/ReviewStepper";
import { getReviewData } from "@/lib/db/review";
import { listCategories } from "@/lib/db/category";

// 週次レビューは当日基準のデータを常に最新で取得する
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const [data, allCategories] = await Promise.all([
    getReviewData(),
    listCategories(),
  ]);

  // Next Action 追加・Someday 追加で選べるのは有効なカテゴリのみ
  const activeCategories = allCategories.filter((c) => c.isActive);

  return (
    <PageShell
      title="週次レビュー"
      subtitle="Inbox・プロジェクト・タスク・待ち・Someday を 6 ステップで順に見直す"
    >
      <ReviewStepper data={data} categories={activeCategories} />
    </PageShell>
  );
}
