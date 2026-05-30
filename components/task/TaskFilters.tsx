"use client";

import type { CategoryDTO } from "@/lib/db/category";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/types/task";
import { cn } from "@/lib/cn";

/** プロジェクト有無フィルタの 3 値（あり / なし / 問わない）。 */
export const PROJECT_PRESENCE = ["any", "with", "without"] as const;
export type ProjectPresence = (typeof PROJECT_PRESENCE)[number];

export const PROJECT_PRESENCE_LABELS: Record<ProjectPresence, string> = {
  any: "問わない",
  with: "プロジェクトありのみ",
  without: "プロジェクトなしのみ",
};

export type TaskFiltersValue = {
  /** カテゴリ ID（空＝すべて） */
  categoryId: string;
  /** ステータス（空＝すべて） */
  status: TaskStatus | "";
  /** プロジェクト有無 */
  projectPresence: ProjectPresence;
  /** 完了タスク表示 */
  showDone: boolean;
};

export type TaskFiltersProps = {
  categories: CategoryDTO[];
  value: TaskFiltersValue;
  onChange: (next: TaskFiltersValue) => void;
};

const SELECT_CLASS = cn(
  "rounded-[4px] border border-[color:var(--border-whisper)] bg-paper px-2 py-1",
  "text-[13px] text-ink",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
);

/**
 * タスク一覧のフィルタ群（Phase 8 / 要件書 §10.11 簡易実装）。
 *
 * 「カテゴリ」「ステータス」「プロジェクト有無（あり/なし/問わない）」の 3 フィルタと
 * 既存の完了表示トグルをまとめる。複数指定は AND 条件として TaskManager 側で適用される。
 */
export function TaskFilters({ categories, value, onChange }: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="task-filters">
      <label className="flex items-center gap-2 text-[12px] text-ink-2">
        カテゴリ
        <select
          value={value.categoryId}
          onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
          data-testid="task-filter-category"
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

      <label className="flex items-center gap-2 text-[12px] text-ink-2">
        ステータス
        <select
          value={value.status}
          onChange={(e) =>
            onChange({ ...value, status: e.target.value as TaskStatus | "" })
          }
          data-testid="task-filter-status"
          className={SELECT_CLASS}
        >
          <option value="">すべて</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-[12px] text-ink-2">
        プロジェクト
        <select
          value={value.projectPresence}
          onChange={(e) =>
            onChange({
              ...value,
              projectPresence: e.target.value as ProjectPresence,
            })
          }
          data-testid="task-filter-project-presence"
          className={SELECT_CLASS}
        >
          {PROJECT_PRESENCE.map((p) => (
            <option key={p} value={p}>
              {PROJECT_PRESENCE_LABELS[p]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-[12px] text-ink-2">
        <input
          type="checkbox"
          checked={value.showDone}
          onChange={() => onChange({ ...value, showDone: !value.showDone })}
          data-testid="task-filter-showdone"
          className="h-4 w-4 accent-[color:var(--accent)] cursor-pointer"
        />
        完了タスクを表示
      </label>
    </div>
  );
}
