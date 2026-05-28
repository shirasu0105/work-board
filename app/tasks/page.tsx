import { PageShell } from "@/components/layout/PageShell";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function TasksPage() {
  return (
    <PageShell
      title="タスク"
      subtitle="カテゴリ・プロジェクト・ステータスでタスクを管理する"
    >
      <PagePlaceholder
        description="タスクを未着手・対応中・待ち・保留・完了で管理します。"
        note="Phase 1 時点では空状態のみ。Phase 3 でタスクの CRUD とステータス変更を実装します。"
      />
    </PageShell>
  );
}
