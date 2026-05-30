"use client";

import type { CategoryDTO } from "@/lib/db/category";
import {
  MEMO_KIND_LABELS,
  MEMO_KIND_ORDER,
  type MemoKind,
} from "@/lib/types/memo";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export type MemoFiltersValue = {
  /** タイトル部分一致キーワード */
  keyword: string;
  /** カテゴリ ID（空＝すべて） */
  categoryId: string;
  /** 種別（空＝すべて） */
  kind: MemoKind | "";
  /** 日付範囲 from（YYYY-MM-DD、空＝下限なし） */
  from: string;
  /** 日付範囲 to（YYYY-MM-DD、空＝上限なし） */
  to: string;
};

export const EMPTY_MEMO_FILTERS: MemoFiltersValue = {
  keyword: "",
  categoryId: "",
  kind: "",
  from: "",
  to: "",
};

export type MemoFiltersProps = {
  categories: CategoryDTO[];
  value: MemoFiltersValue;
  onChange: (next: MemoFiltersValue) => void;
};

const SELECT_CLASS = cn(
  "rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2 py-1",
  "text-[13px] text-ink",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
);

const DATE_CLASS = cn(
  "rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2 py-1",
  "text-[13px] text-ink",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
);

/**
 * メモ一覧の検索・絞り込み（Phase 8 / 要件書 §10.10 簡易実装）。
 *
 * 「キーワード（タイトル部分一致）」「カテゴリ」「種別」「日付範囲(from/to)」の 4 条件を
 * クライアント側で AND 合成する。実フィルタ適用は MemoTimeline 側で行う。
 */
export function MemoFilters({ categories, value, onChange }: MemoFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="memo-filters">
      <div className="min-w-[200px] flex-1">
        <Input
          type="search"
          placeholder="タイトルで検索"
          value={value.keyword}
          onChange={(e) => onChange({ ...value, keyword: e.target.value })}
          data-testid="memo-filter-keyword"
          aria-label="メモのタイトルで検索"
        />
      </div>

      <label className="flex items-center gap-2 text-[12px] text-ink-2">
        種別
        <select
          value={value.kind}
          onChange={(e) =>
            onChange({ ...value, kind: e.target.value as MemoKind | "" })
          }
          data-testid="memo-filter-kind"
          className={SELECT_CLASS}
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
          value={value.categoryId}
          onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
          data-testid="memo-filter-category"
          className={SELECT_CLASS}
        >
          <option value="">すべて</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-[12px] text-ink-2">
        期間
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          data-testid="memo-filter-from"
          aria-label="作成日 開始"
          className={DATE_CLASS}
        />
        <span className="text-ink-3">〜</span>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          data-testid="memo-filter-to"
          aria-label="作成日 終了"
          className={DATE_CLASS}
        />
      </label>
    </div>
  );
}
