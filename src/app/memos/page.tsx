import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemoSearchBar } from "@/components/memos/MemoSearchBar";
import { listMemos, type MemoFilters } from "@/lib/queries/memos";
import { listActiveCategories } from "@/lib/queries/categories";
import { memoTypeLabel } from "@/lib/memoTypes";
import { formatShortDate } from "@/lib/domain/date";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function MemosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters: MemoFilters = {
    keyword: one(sp.keyword),
    categoryId: one(sp.categoryId),
    memoType: one(sp.memoType),
    dateFrom: one(sp.dateFrom),
    dateTo: one(sp.dateTo),
  };
  const memos = listMemos(filters);
  const categories = listActiveCategories().map((c) => ({ id: c.id, name: c.name }));

  return (
    <PageShell
      title="メモ"
      actions={
        <Link href="/memos/new">
          <Button>+ メモを作成</Button>
        </Link>
      }
    >
      <div className="flex flex-col gap-4">
        <MemoSearchBar categories={categories} initial={filters} />

        {memos.length === 0 ? (
          <EmptyState
            title="メモがありません"
            description="「+ メモを作成」から議事録・調査・作業ログなどを記録できます。"
          />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-subtle">{memos.length}件</p>
            {memos.map((m) => (
              <Link key={m.id} href={`/memos/${m.id}`}>
                <Card className="transition-colors hover:border-hairline-strong">
                  <CardBody className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{memoTypeLabel(m.memoType)}</Badge>
                        <span className="truncate font-medium text-ink">{m.title}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-tertiary">
                        {m.categoryName && <span>{m.categoryName}</span>}
                        {m.projectName && <span>· {m.projectName}</span>}
                        <span>· {formatShortDate(m.createdAt)}</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
