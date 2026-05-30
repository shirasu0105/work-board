import type { Prisma } from "@prisma/client";
import { prisma } from "./client";
import {
  isProjectStatus,
  type ProjectDTO,
  type ProjectStatus,
} from "@/lib/types/project";

/**
 * プロジェクト CRUD のサーバー側関数群（Phase 4 / 要件書 §10.4）。
 *
 * - Server Component / Route Handler のどちらからも呼べる純関数
 * - 並び順は `displayOrder` 昇順 → 作成順をソース・オブ・トゥルースとする
 * - 進捗（taskTotal / taskDone / progress）は紐づくタスクから集計して DTO に含める
 */

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    category: { select: { name: true } };
    tasks: { select: { status: true } };
  };
}>;

const PROJECT_INCLUDE = {
  category: { select: { name: true } },
  tasks: { select: { status: true } },
} as const;

function toDTO(p: ProjectWithRelations): ProjectDTO {
  const taskTotal = p.tasks.length;
  const taskDone = p.tasks.filter((t) => t.status === "done").length;
  const progress =
    taskTotal === 0 ? 0 : Math.round((taskDone / taskTotal) * 100);

  return {
    id: p.id,
    name: p.name,
    purpose: p.purpose,
    completion: p.completion,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    status: isProjectStatus(p.status) ? p.status : "active",
    displayOrder: p.displayOrder,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    categoryId: p.categoryId,
    categoryName: p.category.name,
    taskTotal,
    taskDone,
    progress,
  };
}

export type ListProjectsFilter = {
  /** カテゴリで絞り込む。未指定なら全件。 */
  categoryId?: string;
  /** ステータスで絞り込む。未指定なら全件。 */
  status?: ProjectStatus;
};

/** プロジェクト一覧。並び順は displayOrder 昇順 → createdAt 昇順。 */
export async function listProjects(
  filter: ListProjectsFilter = {}
): Promise<ProjectDTO[]> {
  const where: Prisma.ProjectWhereInput = {};
  if (filter.categoryId) {
    where.categoryId = filter.categoryId;
  }
  if (filter.status) {
    where.status = filter.status;
  }

  const rows = await prisma.project.findMany({
    where,
    include: PROJECT_INCLUDE,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toDTO);
}

export async function getProject(id: string): Promise<ProjectDTO | null> {
  if (!id) return null;
  const row = await prisma.project.findUnique({
    where: { id },
    include: PROJECT_INCLUDE,
  });
  return row ? toDTO(row) : null;
}

export type CreateProjectInput = {
  name: string;
  categoryId: string;
  completion?: string | null;
  dueDate?: string | null;
  purpose?: string | null;
  status?: ProjectStatus;
};

/** プロジェクト新規作成。status の初期値は「進行中(active)」。displayOrder は末尾。 */
export async function createProject(
  input: CreateProjectInput
): Promise<ProjectDTO> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("プロジェクト名は必須です");
  }
  if (!input.categoryId) {
    throw new Error("カテゴリは必須です");
  }

  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });
  if (!category) {
    throw new Error("存在しないカテゴリです");
  }

  if (input.status !== undefined && !isProjectStatus(input.status)) {
    throw new Error("不正なステータスです");
  }

  const last = await prisma.project.findFirst({
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  const nextOrder = (last?.displayOrder ?? -1) + 1;

  const created = await prisma.project.create({
    data: {
      name,
      categoryId: input.categoryId,
      completion: normalizeText(input.completion),
      dueDate: parseDate(input.dueDate),
      purpose: normalizeText(input.purpose),
      status: input.status ?? "active",
      displayOrder: nextOrder,
    },
    include: PROJECT_INCLUDE,
  });
  return toDTO(created);
}

export type UpdateProjectInput = {
  name?: string;
  categoryId?: string;
  completion?: string | null;
  dueDate?: string | null;
  purpose?: string | null;
  status?: ProjectStatus;
};

/** プロジェクト部分更新（編集・ステータス変更兼用）。 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<ProjectDTO> {
  if (!id) {
    throw new Error("id は必須です");
  }

  const current = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!current) {
    throw new Error("該当プロジェクトが見つかりません");
  }

  const data: Prisma.ProjectUpdateInput = {};

  if (typeof input.name === "string") {
    const name = input.name.trim();
    if (!name) {
      throw new Error("プロジェクト名は必須です");
    }
    data.name = name;
  }

  if (typeof input.categoryId === "string") {
    if (!input.categoryId) {
      throw new Error("カテゴリは必須です");
    }
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new Error("存在しないカテゴリです");
    }
    data.category = { connect: { id: input.categoryId } };
  }

  if (input.completion !== undefined) {
    data.completion = normalizeText(input.completion);
  }

  if (input.dueDate !== undefined) {
    data.dueDate = parseDate(input.dueDate);
  }

  if (input.purpose !== undefined) {
    data.purpose = normalizeText(input.purpose);
  }

  if (input.status !== undefined) {
    if (!isProjectStatus(input.status)) {
      throw new Error("不正なステータスです");
    }
    data.status = input.status;
  }

  const updated = await prisma.project.update({
    where: { id },
    data,
    include: PROJECT_INCLUDE,
  });
  return toDTO(updated);
}

/** プロジェクト削除。紐づくタスクは projectId が SetNull される（schema 定義）。 */
export async function deleteProject(id: string): Promise<void> {
  if (!id) {
    throw new Error("id は必須です");
  }
  await prisma.project.delete({ where: { id } });
}

function parseDate(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    throw new Error("期限の日付形式が不正です");
  }
  return d;
}

function normalizeText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
