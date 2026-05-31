import { PageShell } from "@/components/layout/PageShell";
import { listAllCategories } from "@/lib/queries/categories";
import { CategoryManager } from "@/components/categories/CategoryManager";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const categories = listAllCategories();

  return (
    <PageShell title="設定">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-ink">カテゴリ管理</h2>
        <p className="mt-1 text-sm text-ink-subtle">
          プロジェクト・タスク・メモの分類に使うカテゴリを管理します。削除はせず、非表示で運用します。
        </p>
      </div>
      <CategoryManager categories={categories} />
    </PageShell>
  );
}
