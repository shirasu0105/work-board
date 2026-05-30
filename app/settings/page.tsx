import { PageShell } from "@/components/layout/PageShell";
import { CategoryManager } from "@/components/category/CategoryManager";
import { listCategories } from "@/lib/db/category";

// カテゴリ管理は常に最新を SSR で取得する（dev でも本番でもキャッシュしない）
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const initialCategories = await listCategories();

  return (
    <PageShell
      title="設定"
      subtitle="初期 MVP の設定対象はカテゴリ管理のみ"
    >
      <div className="flex gap-6">
        {/* 左側: 設定メニュー（カテゴリ管理のみアクティブ） */}
        <aside
          aria-label="設定メニュー"
          className="hidden w-[180px] shrink-0 flex-col gap-1 md:flex"
        >
          <div
            aria-current="page"
            className="rounded-[6px] border-whisper bg-paper px-3 py-2 text-[13px] font-semibold text-ink shadow-card"
          >
            カテゴリ管理
          </div>
          <div className="px-3 py-1.5 text-[12px] text-ink-3">
            表示設定（後で）
          </div>
          <div className="px-3 py-1.5 text-[12px] text-ink-3">
            バックアップ（後で）
          </div>
          <div className="px-3 py-1.5 text-[12px] text-ink-3">
            データエクスポート（後で）
          </div>
        </aside>

        {/* 右側: カテゴリ管理本体 */}
        <div className="min-w-0 flex-1">
          <CategoryManager initialCategories={initialCategories} />
        </div>
      </div>
    </PageShell>
  );
}
