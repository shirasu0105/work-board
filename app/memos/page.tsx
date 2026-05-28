import { PageShell } from "@/components/layout/PageShell";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function MemosPage() {
  return (
    <PageShell
      title="メモ"
      subtitle="議事録・TTメモ・思いつき・調査・作業ログを種別ごとに記録する"
    >
      <PagePlaceholder
        description="メモは種別ごとの入力フォーマットで記録し、後から検索できる形で保存します。"
        note="Phase 1 時点では空状態のみ。Phase 6 でメモ種別の切替と一覧表示を実装します。"
      />
    </PageShell>
  );
}
