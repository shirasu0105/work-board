import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatLocalDate } from "@/lib/date";
import { isMemoKind, MEMO_KIND_LABELS } from "@/lib/types/memo";
import type { RecentMemoSummary } from "@/lib/types/home";

export type RecentMemosProps = {
  memos: RecentMemoSummary[];
};

/**
 * ホームの「最近のメモ」セクション（要件書 §10.1）。
 * 更新日時の新しい順で上位件を表示する。
 */
export function RecentMemos({ memos }: RecentMemosProps) {
  return (
    <Card data-testid="home-memos">
      <CardHeader>
        <CardTitle className="text-[16px]">最近のメモ</CardTitle>
      </CardHeader>

      {memos.length === 0 ? (
        <p
          data-testid="home-memos-empty"
          className="rounded-[8px] bg-paper-2 px-3 py-4 text-center text-[13px] text-ink-3"
        >
          まだメモがありません
        </p>
      ) : (
        <ul className="flex flex-col" data-testid="home-memos-list">
          {memos.map((m) => (
            <li
              key={m.id}
              data-testid="home-memo-item"
              className="border-b border-[color:var(--border-whisper)] last:border-b-0"
            >
              <Link
                href={`/memos/${encodeURIComponent(m.id)}`}
                className="flex items-center justify-between gap-2 py-2 hover:text-accent"
              >
                <span className="truncate text-[13px] text-ink">
                  {m.title}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-ink-3">
                    {formatLocalDate(m.updatedAt)}
                  </span>
                  <Badge tone="muted">
                    {isMemoKind(m.kind) ? MEMO_KIND_LABELS[m.kind] : m.kind}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
