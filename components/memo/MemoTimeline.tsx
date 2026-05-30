"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import type { CategoryDTO } from "@/lib/db/category";
import { formatLocalDate } from "@/lib/date";
import {
  MEMO_KIND_LABELS,
  MEMO_KIND_ORDER,
  type MemoDTO,
  type MemoKind,
} from "@/lib/types/memo";

export type MemoTimelineProps = {
  initialMemos: MemoDTO[];
  categories: CategoryDTO[];
};

/**
 * メモ一覧（タイムライン）。createdAt 降順で時系列に並べる（要件書 §10.8）。
 *
 * 各行に: 日付 / タイトル / 種別バッジ / カテゴリチップ / 関連プロジェクト（あれば）。
 * 種別・カテゴリでの簡易絞り込みと、種別別カウントの集計を備える。
 */
export function MemoTimeline({ initialMemos, categories }: MemoTimelineProps) {
  const router = useRouter();
  const [memos, setMemos] = useState<MemoDTO[]>(initialMemos);
  const [kindFilter, setKindFilter] = useState<MemoKind | "">("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = useCallback((kind: MemoKind | "", cat: string) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (cat) params.set("categoryId", cat);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, []);

  const refresh = useCallback(
    async (kind = kindFilter, cat = categoryFilter) => {
      const res = await fetch(`/api/memos${buildQuery(kind, cat)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("メモ一覧の取得に失敗しました");
      }
      const data = (await res.json()) as { memos: MemoDTO[] };
      setMemos(data.memos);
    },
    [buildQuery, kindFilter, categoryFilter]
  );

  const handleKindFilter = useCallback(
    async (kind: MemoKind | "") => {
      setKindFilter(kind);
      setError(null);
      try {
        await refresh(kind, categoryFilter);
      } catch (e) {
        setError(e instanceof Error ? e.message : "絞り込みに失敗しました");
      }
    },
    [refresh, categoryFilter]
  );

  const handleCategoryFilter = useCallback(
    async (cat: string) => {
      setCategoryFilter(cat);
      setError(null);
      try {
        await refresh(kindFilter, cat);
      } catch (e) {
        setError(e instanceof Error ? e.message : "絞り込みに失敗しました");
      }
    },
    [refresh, kindFilter]
  );

  const handleDelete = useCallback(
    async (memo: MemoDTO) => {
      const ok = window.confirm(`「${memo.title}」を削除しますか？`);
      if (!ok) return;
      setBusyId(memo.id);
      setError(null);
      try {
        const res = await fetch(`/api/memos/${encodeURIComponent(memo.id)}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 204) {
          const data = await safeJson(res);
          throw new Error(data?.error ?? "削除に失敗しました");
        }
        await refresh();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
      } finally {
        setBusyId(null);
      }
    },
    [refresh, router]
  );

  // 種別別カウント（フィルタ前の全件ではなく、現在表示中のメモを集計）
  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of memos) {
      counts[m.kind] = (counts[m.kind] ?? 0) + 1;
    }
    return counts;
  }, [memos]);

  return (
    <div className="flex flex-col gap-4">
      {/* ツールバー */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] text-ink-2">
            種別
            <select
              value={kindFilter}
              onChange={(e) =>
                void handleKindFilter(e.target.value as MemoKind | "")
              }
              data-testid="memo-filter-kind"
              className={cn(
                "rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2 py-1",
                "text-[13px] text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
              )}
            >
              <option value="">すべて</option>
              {MEMO_KIND_ORDER.map((k) => (
                <option key={k} value={k}>
                  {MEMO_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-[12px] text-ink-2">
            カテゴリ
            <select
              value={categoryFilter}
              onChange={(e) => void handleCategoryFilter(e.target.value)}
              data-testid="memo-filter-category"
              className={cn(
                "rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2 py-1",
                "text-[13px] text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
              )}
            >
              <option value="">すべて</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <span data-testid="memo-count" className="text-[12px] text-ink-3">
            {memos.length} 件
          </span>
        </div>

        <Link
          href="/memos/new"
          data-testid="memo-new-link"
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-[4px] px-4 py-2 text-[14px] font-medium transition-colors",
            "bg-accent text-paper hover:bg-accent-hover",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
          )}
        >
          ＋ メモを書く
        </Link>
      </div>

      {/* 種別別カウント（簡易集計） */}
      {memos.length > 0 ? (
        <div
          className="flex flex-wrap gap-1.5"
          data-testid="memo-kind-counts"
        >
          {MEMO_KIND_ORDER.filter((k) => kindCounts[k]).map((k) => (
            <Chip key={k}>
              {MEMO_KIND_LABELS[k]}
              <span className="text-ink-3">{kindCounts[k]}</span>
            </Chip>
          ))}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-[8px] border-whisper bg-[color:var(--accent-bg)] px-3 py-2 text-[12px] text-[color:var(--warning)]"
        >
          {error}
        </div>
      ) : null}

      {/* タイムライン本体 */}
      {memos.length === 0 ? (
        <div
          data-testid="memo-empty"
          className="rounded-[12px] border-whisper bg-paper px-6 py-10 text-center"
        >
          <p className="text-[14px] text-ink-2">まだメモがありません。</p>
          <p className="mt-1 text-[12px] text-ink-3">
            「＋ メモを書く」から最初のメモを記録しましょう。
          </p>
        </div>
      ) : (
        <ol data-testid="memo-timeline" className="flex flex-col gap-2">
          {memos.map((memo) => (
            <li key={memo.id} data-testid="memo-row" data-memo-id={memo.id}>
              <div className="flex items-start gap-3 rounded-[12px] border-whisper bg-paper px-4 py-3 shadow-card">
                {/* 日付（左カラム） */}
                <div className="w-[88px] shrink-0 pt-0.5">
                  <span
                    className="text-[12px] font-medium text-ink-3"
                    data-testid="memo-date"
                  >
                    {formatLocalDate(memo.createdAt)}
                  </span>
                </div>

                {/* 本体 */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent" data-testid="memo-kind-badge">
                      {MEMO_KIND_LABELS[memo.kind]}
                    </Badge>
                    <Link
                      href={`/memos/${encodeURIComponent(memo.id)}`}
                      className="truncate text-[15px] font-semibold text-ink hover:text-accent"
                      data-testid="memo-title"
                    >
                      {memo.title}
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip data-testid="memo-category">{memo.categoryName}</Chip>
                    {memo.projectName ? (
                      <Chip data-testid="memo-project">
                        ◷ {memo.projectName}
                      </Chip>
                    ) : null}
                  </div>
                </div>

                {/* アクション */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/memos/${encodeURIComponent(memo.id)}`}
                    data-testid="memo-edit-link"
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[13px] font-medium transition-colors",
                      "border-whisper bg-paper-2 text-ink hover:bg-warm-gray-50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
                    )}
                  >
                    編集
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === memo.id}
                    onClick={() => void handleDelete(memo)}
                    data-testid="memo-delete"
                  >
                    削除
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

async function safeJson(res: Response): Promise<{ error?: string } | null> {
  try {
    return (await res.json()) as { error?: string };
  } catch {
    return null;
  }
}
