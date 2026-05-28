import { PageShell } from "@/components/layout/PageShell";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function HomePage() {
  return (
    <PageShell
      title="ホーム"
      subtitle="今日やること・待ち・Inbox・進行中プロジェクト・最近のメモを一望する画面"
    >
      <PagePlaceholder
        description="ここでは前日の日次ジャーナルで選んだ「明日やること」が「今日やること」として表示されます。"
        note="Phase 1 時点では空状態のみ。Phase 7 でホーム集約と日次ジャーナル連携を実装します。"
      />
    </PageShell>
  );
}
