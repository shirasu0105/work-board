"use client";

import { useCallback, useMemo, useState } from "react";
import type { CategoryDTO } from "@/lib/db/category";
import { type ProjectDTO } from "@/lib/types/project";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "./ProjectCard";
import {
  ProjectFormDialog,
  type ProjectFormValue,
} from "./ProjectFormDialog";

export type ProjectManagerProps = {
  initialProjects: ProjectDTO[];
  categories: CategoryDTO[];
};

type DialogState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; projectId: string };

/**
 * プロジェクト一覧ページの状態管理コンテナ。
 * 初期データは SSR で受け取り、操作後は REST API を叩いて再フェッチ。
 */
export function ProjectManager({
  initialProjects,
  categories,
}: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectDTO[]>(initialProjects);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);

  const editingInitial = useMemo<ProjectFormValue | undefined>(() => {
    if (dialog.mode !== "edit") return undefined;
    const target = projects.find((p) => p.id === dialog.projectId);
    if (!target) return undefined;
    return {
      name: target.name,
      categoryId: target.categoryId,
      completion: target.completion ?? "",
      dueDate: target.dueDate ? target.dueDate.slice(0, 10) : "",
      purpose: target.purpose ?? "",
      status: target.status,
    };
  }, [dialog, projects]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/projects", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("プロジェクト一覧の取得に失敗しました");
    }
    const data = (await res.json()) as { projects: ProjectDTO[] };
    setProjects(data.projects);
  }, []);

  const openAdd = useCallback(() => {
    setDialogError(null);
    setDialog({ mode: "add" });
  }, []);

  const openEdit = useCallback((id: string) => {
    setDialogError(null);
    setDialog({ mode: "edit", projectId: id });
  }, []);

  const closeDialog = useCallback(() => {
    if (dialogBusy) return;
    setDialog({ mode: "closed" });
    setDialogError(null);
  }, [dialogBusy]);

  const submitDialog = useCallback(
    async (value: ProjectFormValue) => {
      setDialogBusy(true);
      setDialogError(null);
      try {
        const payload = {
          name: value.name,
          categoryId: value.categoryId,
          completion: value.completion === "" ? null : value.completion,
          dueDate: value.dueDate === "" ? null : value.dueDate,
          purpose: value.purpose === "" ? null : value.purpose,
          status: value.status,
        };
        if (dialog.mode === "add") {
          const res = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data?.error ?? "作成に失敗しました");
          }
        } else if (dialog.mode === "edit") {
          const res = await fetch(
            `/api/projects/${encodeURIComponent(dialog.projectId)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(data?.error ?? "更新に失敗しました");
          }
        }
        await refresh();
        setDialog({ mode: "closed" });
      } catch (e) {
        setDialogError(e instanceof Error ? e.message : "保存に失敗しました");
      } finally {
        setDialogBusy(false);
      }
    },
    [dialog, refresh]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span data-testid="project-count" className="text-[12px] text-ink-3">
          {projects.length} 件
        </span>
        <Button
          variant="primary"
          onClick={openAdd}
          data-testid="add-project-button"
        >
          ＋ プロジェクト
        </Button>
      </div>

      {projects.length === 0 ? (
        <div
          data-testid="project-empty"
          className="rounded-[12px] border-whisper bg-paper px-6 py-10 text-center"
        >
          <p className="text-[14px] text-ink">プロジェクトがまだありません。</p>
          <p className="mt-1 text-[12px] text-ink-2">
            右上の「＋ プロジェクト」から作成してください。
          </p>
        </div>
      ) : (
        <div
          data-testid="project-grid"
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={openEdit} />
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={dialog.mode !== "closed"}
        mode={dialog.mode === "edit" ? "edit" : "add"}
        categories={categories}
        initial={editingInitial}
        hideStatus={dialog.mode === "add"}
        busy={dialogBusy}
        errorMessage={dialogError}
        onCancel={closeDialog}
        onSubmit={submitDialog}
      />
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
