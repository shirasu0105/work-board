"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import {
  PROJECT_STATUS_LABELS,
  type ProjectDTO,
} from "@/lib/types/project";

export type ProjectCardProps = {
  project: ProjectDTO;
  busy?: boolean;
  onEdit: (id: string) => void;
};

const STATUS_CHIP_CLASS: Record<string, string> = {
  active: "bg-accent-bg text-[color:var(--accent-focus)]",
  todo: "bg-paper-2 text-ink-2",
  paused: "bg-paper-2 text-ink-3",
  done: "bg-[#e8f7eb] text-[color:var(--success)]",
};

/**
 * プロジェクトカード（screens-2.jsx ProjectsScreen 参考）。
 * カテゴリチップ / ステータス / 完了条件 / 進捗バー（done/total・%）/ 期限 / 編集・タスク導線。
 */
export function ProjectCard({ project, busy = false, onEdit }: ProjectCardProps) {
  const p = project;
  return (
    <div
      data-testid="project-card"
      data-project-id={p.id}
      className={cn(
        "flex flex-col gap-3 rounded-[12px] border-whisper bg-paper p-4 shadow-card transition-opacity",
        busy && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="project-name"
            className="text-[16px] font-semibold text-ink"
          >
            {p.name}
          </span>
          <Chip data-testid="project-category">{p.categoryName}</Chip>
        </div>
        <span
          data-testid="project-status"
          data-status={p.status}
          className={cn(
            "inline-flex items-center justify-center rounded-full px-2 py-0.5",
            "text-[11px] font-semibold tracking-[0.02em] leading-none whitespace-nowrap",
            STATUS_CHIP_CLASS[p.status] ?? "bg-paper-2 text-ink-2"
          )}
        >
          {PROJECT_STATUS_LABELS[p.status]}
        </span>
      </div>

      {p.completion ? (
        <p className="text-[13px] text-ink-2">完了条件: {p.completion}</p>
      ) : (
        <p className="text-[13px] text-ink-3">完了条件: 未設定</p>
      )}

      {/* 進捗 */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span data-testid="project-progress-count" className="text-[12px] text-ink-2">
            進捗 {p.taskDone}/{p.taskTotal} タスク
          </span>
          <span data-testid="project-progress-percent" className="text-[12px] text-ink-2">
            {p.progress}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={p.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`進捗 ${p.progress}%`}
          className="h-2 w-full overflow-hidden rounded-full bg-paper-2"
        >
          <div
            data-testid="project-progress-bar"
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${p.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-ink-3">
          {p.dueDate ? `期限 ${formatDate(p.dueDate)}` : "期限なし"}
        </span>
        <div className="flex items-center gap-1">
          <Link
            href={`/tasks?projectId=${encodeURIComponent(p.id)}`}
            data-testid="project-view-tasks"
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[4px] font-medium transition-colors",
              "px-2.5 py-1 text-[13px]",
              "bg-paper-2 text-ink hover:bg-warm-gray-50 border border-whisper",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
            )}
          >
            タスクを見る
          </Link>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onEdit(p.id)}
            data-testid="project-edit"
            aria-label={`「${p.name}」を編集`}
          >
            編集
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}
