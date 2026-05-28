import { PageShell } from "@/components/layout/PageShell";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function JournalPage() {
  return (
    <PageShell
      title="日次ジャーナル"
      subtitle="今日のひとことを記録し、明日やることを選ぶ"
    >
      <PagePlaceholder
        description="作業日の最後に開き、当日の振り返りと翌日に取り組むタスクの選択を行います。"
        note="Phase 1 時点では空状態のみ。Phase 7 で日次ジャーナルとホーム連携を実装します。"
      />
    </PageShell>
  );
}
