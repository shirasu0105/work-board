import { PageShell } from "@/components/layout/PageShell";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function SettingsPage() {
  return (
    <PageShell
      title="設定"
      subtitle="初期 MVP の設定対象はカテゴリ管理のみ"
    >
      <PagePlaceholder
        description="カテゴリの作成・編集・非表示・並び替えを行います。"
        note="Phase 1 時点では空状態のみ。Phase 2 でカテゴリ管理 UI を実装します。"
      />
    </PageShell>
  );
}
