"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/cn";
import type { CategoryDTO } from "@/lib/db/category";
import { formatLocalDate } from "@/lib/date";
import {
  MEMO_KIND_LABELS,
  MEMO_KIND_ORDER,
  type MemoDTO,
} from "@/lib/types/memo";
import {
  EMPTY_MEMO_FILTERS,
  MemoFilters,
  type MemoFiltersValue,
} from "./MemoFilters";

export type MemoTimelineProps = {
  initialMemos: MemoDTO[];
  categories: CategoryDTO[];
};

/**
 * メモ一覧（タイムライン）。createdAt 降順で時系列に並べる（要件書 §10.8）。
 *
 * 全件をクライアントで保持し、キーワード（タイトル部分一致）・カテゴリ・種別・
 * 日付範囲(from/to) の 4 条件で AND 絞り込みする（要件書 §10.10 簡易実装）。
 * 削除のみサーバーへ反映し、その後ローカル state からも除去する。
 */
export function MemoTimeline({ initialMemos, categories }: MemoTimelineProps) {
  const router = useRouter();
  const [memos, setMemos] = useState<MemoDTO[]>(initialMemos);
  const [filters, setFilters] = useState<MemoFiltersValue>(EMPTY_MEMO_FILTERS);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setMemos((prev) => prev.filter((m) => m.id !== memo.id));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
      } finally {
        setBusyId(null);
      }
    },
    [router]
  );

  // フィルタ適用後のメモ（AND 条件）。
  const visibleMemos = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    // 日付範囲はローカル暦日の境界で判定する。
    const fromTime = filters.from
      ? new Date(`${filters.from}T00:00:00`).getTime()
      : null;
    const toTime = filters.to
      ? new Date(`${filters.to}T23:59:59.999`).getTime()
      : null;

    return memos.filter((m) => {
      if (kw && !m.title.toLowerCase().includes(kw)) return false;
      if (filters.categoryId && m.categoryId !== filters.categoryId)
        return false;
      if (filters.kind && m.kind !== filters.kind) return false;
      if (fromTime !== null || toTime !== null) {
        const created = new Date(m.createdAt).getTime();
        if (fromTime !== null && created < fromTime) return false;
        if (toTime !== null && created > toTime) return false;
      }
      return true;
    });
  }, [memos, filters]);

  const isFiltered =
    filters.keyword.trim() !== "" ||
    filters.categoryId !== "" ||
    filters.kind !== "" ||
    filters.from !== "" ||
    filters.to !== "";

  // 種別別カウント（現在表示中のメモを集計）。
  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of visibleMemos) {
      counts[m.kind] = (counts[m.kind] ?? 0) + 1;
    }
    return counts;
  }, [visibleMemos]);

  return (
    <div className="flex flex-col gap-4">
      {/* ツールバー: 検索・絞り込み + 新規導線 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <MemoFilters
            categories={categories}
            value={filters}
            onChange={setFilters}
          />
        </div>

        <Link
          href="/memos/new"
          data-testid="memo-new-link"
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-4 py-2 text-[14px] font-medium transition-colors",
            "bg-accent text-paper hover:bg-accent-hover",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
          )}
        >
          ＋ メモを書く
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span data-testid="memo-count" className="text-[12px] text-ink-3">
          {isFiltered
            ? `${visibleMemos.length} 件 / 計 ${memos.length} 件`
            : `${memos.length} 件`}
        </span>
      </div>

      {/* 種別別カウント（簡易集計） */}
      {visibleMemos.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" data-testid="memo-kind-counts">
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
      {visibleMemos.length === 0 ? (
        <EmptyState
          data-testid="memo-empty"
          icon="✎"
          title={
            isFiltered
              ? "条件に合うメモがありません。"
              : "まだメモがありません。"
          }
          description={
            isFiltered
              ? "検索条件を変えるか解除してください。"
              : "「＋ メモを書く」から最初のメモを記録しましょう。"
          }
          action={
            !isFiltered ? (
              <Link
                href="/memos/new"
                data-testid="memo-empty-new"
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-[4px] px-4 py-2 text-[14px] font-medium transition-colors",
                  "bg-accent text-paper hover:bg-accent-hover",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
                )}
              >
                ＋ メモを書く
              </Link>
            ) : null
          }
        />
      ) : (
        <ol data-testid="memo-timeline" className="flex flex-col gap-2">
          {visibleMemos.map((memo) => (
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
