import { PageShell } from "@/components/layout/PageShell";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function ReviewPage() {
  return (
    <PageShell
      title="週次レビュー"
      subtitle="Inbox・プロジェクト・タスク・待ち・Someday を順に見直す"
    >
      <PagePlaceholder
        description="週に1回、6 ステップで管理状態を整える棚卸し画面です。"
        note="Phase 1 時点では空状態のみ。Phase 8 で 6 ステップフローを実装します。"
      />
    </PageShell>
  );
}
