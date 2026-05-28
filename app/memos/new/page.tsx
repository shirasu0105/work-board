import { PageShell } from "@/components/layout/PageShell";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function MemoNewPage() {
  return (
    <PageShell
      title="メモを書く"
      subtitle="メモ種別を選択してフォーマット付きで新しいメモを作成する"
    >
      <PagePlaceholder
        description="議事録・TTメモ・思いつきメモ・調査メモ・作業ログから種別を選び、入力フォーマットを切り替えて記録します。"
        note="Phase 1 時点では空状態のみ。Phase 6 でメモ種別の入力フォームを実装します。"
      />
    </PageShell>
  );
}
