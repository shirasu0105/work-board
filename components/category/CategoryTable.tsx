"use client";

import type { CategoryDTO } from "@/lib/db/category";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type CategoryTableProps = {
  categories: CategoryDTO[];
  busyId?: string | null;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleActive: (id: string) => void;
  onEdit: (id: string) => void;
};

/**
 * カテゴリ一覧テーブル。
 *
 * - 並び替えは ↑ / ↓ ボタンで実装（ドラッグ依存を避け、Playwright で安定検証可能）
 * - 表示 ON/OFF はトグルボタンで切替。OFF 行は薄字＋"OFF" バッジで識別
 * - `screens-4.jsx` の SettingsScreen の構成を Notion 風に再現
 */
export function CategoryTable({
  categories,
  busyId,
  onMoveUp,
  onMoveDown,
  onToggleActive,
  onEdit,
}: CategoryTableProps) {
  if (categories.length === 0) {
    return (
      <div
        data-testid="category-empty"
        className={cn(
          "rounded-[12px] border-whisper bg-paper px-6 py-10 text-center"
        )}
      >
        <p className="text-[14px] text-ink">
          カテゴリがまだ登録されていません。
        </p>
        <p className="mt-1 text-[12px] text-ink-2">
          右上の「＋ カテゴリを追加」から作成してください。
        </p>
      </div>
    );
  }

  return (
    <div
      role="table"
      aria-label="カテゴリ一覧"
      data-testid="category-table"
      className={cn(
        "overflow-hidden rounded-[12px] border-whisper bg-paper shadow-card"
      )}
    >
      {/* ヘッダ行 */}
      <div
        role="row"
        className={cn(
          "grid items-center gap-3 border-b border-[color:var(--border-whisper)]",
          "bg-paper-2 px-4 py-2.5",
          // 列幅: 並べ替え(72) / 名前(180) / 説明(flex) / 表示(96) / 操作(96)
          "grid-cols-[72px_180px_minmax(0,1fr)_96px_96px]"
        )}
      >
        <div role="columnheader" className="text-[11px] font-medium text-ink-2">
          並び替え
        </div>
        <div role="columnheader" className="text-[11px] font-medium text-ink-2">
          カテゴリ名
        </div>
        <div role="columnheader" className="text-[11px] font-medium text-ink-2">
          説明
        </div>
        <div
          role="columnheader"
          className="text-center text-[11px] font-medium text-ink-2"
        >
          表示
        </div>
        <div
          role="columnheader"
          className="text-center text-[11px] font-medium text-ink-2"
        >
          操作
        </div>
      </div>

      {/* データ行 */}
      <ul className="divide-y divide-[color:var(--border-whisper)]">
        {categories.map((c, index) => {
          const isFirst = index === 0;
          const isLast = index === categories.length - 1;
          const isBusy = busyId === c.id;
          return (
            <li
              key={c.id}
              role="row"
              data-testid="category-row"
              data-category-id={c.id}
              data-active={c.isActive ? "true" : "false"}
              className={cn(
                "grid items-center gap-3 px-4 py-2.5 transition-opacity",
                "grid-cols-[72px_180px_minmax(0,1fr)_96px_96px]",
                !c.isActive && "opacity-60"
              )}
            >
              {/* 並び替え */}
              <div role="cell" className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`「${c.name}」を上へ移動`}
                  disabled={isFirst || isBusy}
                  onClick={() => onMoveUp(c.id)}
                  className="px-1.5"
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`「${c.name}」を下へ移動`}
                  disabled={isLast || isBusy}
                  onClick={() => onMoveDown(c.id)}
                  className="px-1.5"
                >
                  ↓
                </Button>
              </div>

              {/* 名前 */}
              <div
                role="cell"
                className={cn(
                  "truncate text-[14px] font-semibold",
                  c.isActive ? "text-ink" : "text-ink-2"
                )}
              >
                {c.name}
              </div>

              {/* 説明 */}
              <div
                role="cell"
                className="truncate text-[13px] text-ink-2"
                title={c.description ?? undefined}
              >
                {c.description ?? (
                  <span className="text-ink-3">—</span>
                )}
              </div>

              {/* 表示 ON/OFF */}
              <div role="cell" className="flex justify-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={c.isActive}
                  aria-label={`「${c.name}」の表示を切り替える`}
                  data-state={c.isActive ? "on" : "off"}
                  disabled={isBusy}
                  onClick={() => onToggleActive(c.id)}
                  className={cn(
                    "inline-flex h-6 w-12 items-center rounded-full border transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    c.isActive
                      ? "bg-accent border-transparent"
                      : "bg-paper-2 border-[color:var(--border-whisper)]"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "ml-0.5 inline-block h-5 w-5 rounded-full bg-paper shadow-card transition-transform",
                      c.isActive ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                  <span className="sr-only">{c.isActive ? "ON" : "OFF"}</span>
                </button>
                {!c.isActive ? (
                  <Badge tone="muted" className="ml-2 self-center">
                    OFF
                  </Badge>
                ) : null}
              </div>

              {/* 操作 */}
              <div role="cell" className="flex justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`「${c.name}」を編集`}
                  disabled={isBusy}
                  onClick={() => onEdit(c.id)}
                >
                  編集
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
