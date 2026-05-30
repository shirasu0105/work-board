import { PageShell } from "@/components/layout/PageShell";
import { InboxManager } from "@/components/inbox/InboxManager";
import { listCategories } from "@/lib/db/category";
import { listInboxItems } from "@/lib/db/inbox";

// Inbox は常に最新を SSR で取得する
export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const [initialItems, allCategories] = await Promise.all([
    listInboxItems(),
    listCategories(),
  ]);

  // タスク化・プロジェクト化フォームで選べるのは有効なカテゴリのみ
  const activeCategories = allCategories.filter((c) => c.isActive);

  return (
    <PageShell
      title="Inbox"
      subtitle="思いつきや未整理項目を素早く登録し、後でタスク・プロジェクト・Somedayに振り分ける"
    >
      <InboxManager initialItems={initialItems} categories={activeCategories} />
    </PageShell>
  );
}
