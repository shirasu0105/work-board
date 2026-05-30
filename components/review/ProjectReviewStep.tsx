"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/common/EmptyState";
import type { CategoryDTO } from "@/lib/db/category";
import type { ReviewProject } from "@/lib/db/review";

export type ProjectReviewStepProps = {
  initialProjects: ReviewProject[];
  categories: CategoryDTO[];
};

/**
 * ステップ 2: 進行中プロジェクト確認（要件 §10.13.2）。
 *
 * Next Action（未完了タスク）が無いプロジェクトに警告バッジを表示し、
 * その場で Next Action タスクを入力・追加できる。追加に成功するとバッジが
 * 「✓ Next Action あり」に切り替わる。
 */
export function ProjectReviewStep({
  initialProjects,
  categories,
}: ProjectReviewStepProps) {
  const [projects, setProjects] = useState<ReviewProject[]>(initialProjects);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddNextAction = useCallback(
    async (project: ReviewProject) => {
      const title = (drafts[project.id] ?? "").trim();
      if (!title) return;
      const categoryId = categories[0]?.id;
      if (!categoryId) {
        setError("先に「設定」でカテゴリを作成してください。");
        return;
      }
      setBusyId(project.id);
      setError(null);
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, categoryId, projectId: project.id }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "Next Action の追加に失敗しました");
        }
        // 追加成功: 該当プロジェクトを hasNextAction=true に更新し、入力をクリア
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id ? { ...p, hasNextAction: true } : p
          )
        );
        setDrafts((prev) => ({ ...prev, [project.id]: "" }));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Next Action の追加に失敗しました"
        );
      } finally {
        setBusyId(null);
      }
    },
    [drafts, categories]
  );

  if (projects.length === 0) {
    return (
      <EmptyState
        data-testid="review-projects-empty"
        icon="◷"
        title="進行中のプロジェクトはありません。"
        description="進行中プロジェクトが登録されると、ここで Next Action の有無を確認できます。"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="review-projects">
      {error ? (
        <p
          role="alert"
          className="rounded-[8px] border-whisper bg-[color:var(--accent-bg)] px-3 py-2 text-[12px] text-[color:var(--warning)]"
        >
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {projects.map((p) => (
          <li
            key={p.id}
            data-testid="review-project-row"
            data-has-next-action={p.hasNextAction}
            className="flex flex-col gap-2 rounded-[8px] border-whisper bg-paper px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
                {p.name}
              </span>
              <Chip>{p.categoryName}</Chip>
              {p.hasNextAction ? (
                <Badge tone="success" data-testid="review-project-badge">
                  ✓ Next Action あり
                </Badge>
              ) : (
                <Badge tone="warning" data-testid="review-project-badge">
                  ⚠ Next Action なし
                </Badge>
              )}
            </div>

            {!p.hasNextAction ? (
              <div className="flex items-center gap-2">
                <Input
                  value={drafts[p.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAddNextAction(p);
                    }
                  }}
                  placeholder="Next Action を入力"
                  data-testid="review-project-nextaction-input"
                  aria-label={`${p.name} の Next Action`}
                  disabled={busyId === p.id}
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={busyId === p.id || (drafts[p.id] ?? "").trim() === ""}
                  onClick={() => void handleAddNextAction(p)}
                  data-testid="review-project-nextaction-add"
                >
                  追加
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
