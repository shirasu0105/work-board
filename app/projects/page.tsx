import { PageShell } from "@/components/layout/PageShell";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function ProjectsPage() {
  return (
    <PageShell
      title="プロジェクト"
      subtitle="複数のタスクを束ねた完了条件付きの作業単位を管理する"
    >
      <PagePlaceholder
        description="プロジェクトは複数のタスクを束ね、完了条件を持つ作業単位です。"
        note="Phase 1 時点では空状態のみ。Phase 4 でプロジェクトの作成・編集・タスク紐づけを実装します。"
      />
    </PageShell>
  );
}
