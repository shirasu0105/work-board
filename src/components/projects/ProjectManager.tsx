"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectFormDrawer, type CategoryOption } from "./ProjectFormDrawer";
import { completeProject, reopenProject } from "@/lib/actions/projects";
import { daysUntil, formatShortDate } from "@/lib/domain/date";
import type { Project } from "@/lib/db/schema";
import type { ProjectWithCategory } from "@/lib/queries/projects";

function DueBadge({ dueDate }: { dueDate: string | null }) {
  const d = daysUntil(dueDate);
  if (d === null) return null;
  const tone = d < 0 ? "danger" : d <= 3 ? "warning" : "neutral";
  const label =
    d < 0 ? `期限超過 ${-d}日` : d === 0 ? "本日期限" : `あと${d}日`;
  return (
    <Badge tone={tone}>
      {formatShortDate(dueDate)}・{label}
    </Badge>
  );
}

function ProjectRow({
  project,
  onEdit,
  onComplete,
  onReopen,
}: {
  project: ProjectWithCategory;
  onEdit: (p: Project) => void;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  const done = project.status === "completed";
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                done
                  ? "font-medium text-ink-subtle line-through"
                  : "font-medium text-ink"
              }
            >
              {project.name}
            </span>
            {project.categoryName && <Badge tone="primary">{project.categoryName}</Badge>}
            {!done && <DueBadge dueDate={project.dueDate} />}
            {done && <Badge tone="success">完了</Badge>}
          </div>
          {project.purpose && (
            <p className="mt-1 text-sm text-ink-subtle">{project.purpose}</p>
          )}
          {project.completionCondition && (
            <p className="mt-1 text-xs text-ink-tertiary">
              完了条件: {project.completionCondition}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
            編集
          </Button>
          {done ? (
            <Button variant="ghost" size="sm" onClick={() => onReopen(project.id)}>
              再開
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onComplete(project.id)}>
              完了
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function ProjectManager({
  projects,
  categories,
}: {
  projects: ProjectWithCategory[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const { active, completed } = useMemo(() => {
    return {
      active: projects.filter((p) => p.status !== "completed"),
      completed: projects.filter((p) => p.status === "completed"),
    };
  }, [projects]);

  const hasCategories = categories.length > 0;

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(p: Project) {
    setEditing(p);
    setOpen(true);
  }
  function handleComplete(id: string) {
    startTransition(async () => {
      await completeProject(id);
      router.refresh();
    });
  }
  function handleReopen(id: string) {
    startTransition(async () => {
      await reopenProject(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-subtle">
          進行中 {active.length}件 / 完了 {completed.length}件
        </p>
        <Button onClick={openCreate} disabled={!hasCategories}>
          + プロジェクトを追加
        </Button>
      </div>

      {!hasCategories && (
        <p className="text-sm text-warning">
          先に設定画面でカテゴリを1つ以上作成してください。
        </p>
      )}

      {projects.length === 0 ? (
        <EmptyState
          title="プロジェクトがありません"
          description="目的のある複数タスクのまとまりをプロジェクトとして管理します。"
        />
      ) : (
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            {active.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                onEdit={openEdit}
                onComplete={handleComplete}
                onReopen={handleReopen}
              />
            ))}
            {active.length === 0 && (
              <p className="text-sm text-ink-subtle">進行中のプロジェクトはありません。</p>
            )}
          </section>

          {completed.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                完了済み
              </h3>
              {completed.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onEdit={openEdit}
                  onComplete={handleComplete}
                  onReopen={handleReopen}
                />
              ))}
            </section>
          )}
        </div>
      )}

      <ProjectFormDrawer
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        project={editing}
      />
    </div>
  );
}
