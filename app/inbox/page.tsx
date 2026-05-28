import { PageShell } from "@/components/layout/PageShell";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function InboxPage() {
  return (
    <PageShell
      title="Inbox"
      subtitle="思いつきや未整理項目を素早く登録し、後でタスク・プロジェクト・Somedayに振り分ける"
    >
      <PagePlaceholder
        description="Inbox は「とりあえず入れる」場所です。整理は週次レビューで行います。"
        note="Phase 1 時点では空状態のみ。Phase 4 で Inbox の追加と振り分けを実装します。"
      />
    </PageShell>
  );
}
