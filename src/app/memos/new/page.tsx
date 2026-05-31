import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemoForm } from "@/components/memos/MemoForm";
import { listActiveCategories } from "@/lib/queries/categories";
import { listProjects } from "@/lib/queries/projects";

export const dynamic = "force-dynamic";

export default function NewMemoPage() {
  const categories = listActiveCategories().map((c) => ({ id: c.id, name: c.name }));
  const projects = listProjects()
    .filter((p) => p.status === "active")
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <PageShell title="メモを作成">
      {categories.length === 0 ? (
        <EmptyState
          title="先にカテゴリを作成してください"
          description="メモにはカテゴリが必須です。設定画面でカテゴリを追加してください。"
        />
      ) : (
        <MemoForm categories={categories} projects={projects} />
      )}
    </PageShell>
  );
}
