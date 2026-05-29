import type { Prisma } from "@prisma/client";
import { prisma } from "./client";
import {
  isTaskStatus,
  type TaskDTO,
  type TaskStatus,
} from "@/lib/types/task";

/**
 * タスク CRUD のサーバー側関数群（Phase 3）。
 *
 * - Server Component / Route Handler のどちらからも呼べる純関数
 * - 入力バリデーションは呼び出し側（Route Handler / フォーム）で行う前提だが、
 *   必須・型の最低限のチェックはここでも実施する
 * - 並び順は `displayOrder` 昇順 → 作成順をソース・オブ・トゥルースとする
 * - プロジェクト紐づけ（projectId）は Phase 4 で活性化するため、ここでは nullable のまま受け渡しのみ対応
 */

// category / project を含めて取得するための型
type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    category: { select: { name: true } };
    project: { select: { name: true } };
  };
}>;

const TASK_INCLUDE = {
  category: { select: { name: true } },
  project: { select: { name: true } },
} as const;

function toDTO(t: TaskWithRelations): TaskDTO {
  return {
    id: t.id,
    title: t.title,
    note: t.note,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    status: isTaskStatus(t.status) ? t.status : "todo",
    displayOrder: t.displayOrder,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    categoryId: t.categoryId,
    categoryName: t.category.name,
    projectId: t.projectId,
    projectName: t.project?.name ?? null,
  };
}

export type ListTasksFilter = {
  /** カテゴリで絞り込む。未指定なら全件。 */
  categoryId?: string;
  /** false のとき完了タスクを除外する。デフォルトは true（含める）。 */
  includeDone?: boolean;
};

/**
 * タスク一覧。
 * 並び順は displayOrder 昇順 → createdAt 昇順。
 * 完了タスクは末尾に寄せたいので、未完了 → 完了の順に並べ替える。
 */
export async function listTasks(
  filter: ListTasksFilter = {}
): Promise<TaskDTO[]> {
  const where: Prisma.TaskWhereInput = {};
  if (filter.categoryId) {
    where.categoryId = filter.categoryId;
  }
  if (filter.includeDone === false) {
    where.status = { not: "done" };
  }

  const rows = await prisma.task.findMany({
    where,
    include: TASK_INCLUDE,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  // 未完了を先、完了を後ろにする（安定ソート）
  const dtos = rows.map(toDTO);
  return dtos.sort((a, b) => {
    const aDone = a.status === "done" ? 1 : 0;
    const bDone = b.status === "done" ? 1 : 0;
    return aDone - bDone;
  });
}

export async function getTask(id: string): Promise<TaskDTO | null> {
  if (!id) return null;
  const row = await prisma.task.findUnique({
    where: { id },
    include: TASK_INCLUDE,
  });
  return row ? toDTO(row) : null;
}

export type CreateTaskInput = {
  title: string;
  categoryId: string;
  dueDate?: string | null;
  note?: string | null;
  projectId?: string | null;
};

/** タスク新規作成。status は常に「未着手(todo)」で開始。displayOrder は末尾。 */
export async function createTask(input: CreateTaskInput): Promise<TaskDTO> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("タスク名は必須です");
  }
  if (!input.categoryId) {
    throw new Error("カテゴリは必須です");
  }

  // カテゴリ存在チェック（不正 ID 弾き）
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });
  if (!category) {
    throw new Error("存在しないカテゴリです");
  }

  const last = await prisma.task.findFirst({
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  const nextOrder = (last?.displayOrder ?? -1) + 1;

  const created = await prisma.task.create({
    data: {
      title,
      categoryId: input.categoryId,
      dueDate: parseDate(input.dueDate),
      note: normalizeText(input.note),
      projectId: input.projectId ?? null,
      status: "todo",
      displayOrder: nextOrder,
    },
    include: TASK_INCLUDE,
  });
  return toDTO(created);
}

export type UpdateTaskInput = {
  title?: string;
  categoryId?: string;
  dueDate?: string | null;
  note?: string | null;
  projectId?: string | null;
  status?: TaskStatus;
};

/**
 * タスク部分更新（編集・ステータス変更兼用）。
 * status を "done" に変えたら completedAt を打刻、"done" から外したら null に戻す。
 */
export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<TaskDTO> {
  if (!id) {
    throw new Error("id は必須です");
  }

  const current = await prisma.task.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!current) {
    throw new Error("該当タスクが見つかりません");
  }

  const data: Prisma.TaskUpdateInput = {};

  if (typeof input.title === "string") {
    const title = input.title.trim();
    if (!title) {
      throw new Error("タスク名は必須です");
    }
    data.title = title;
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

  if (input.dueDate !== undefined) {
    data.dueDate = parseDate(input.dueDate);
  }

  if (input.note !== undefined) {
    data.note = normalizeText(input.note);
  }

  if (input.projectId !== undefined) {
    if (input.projectId === null) {
      data.project = { disconnect: true };
    } else {
      data.project = { connect: { id: input.projectId } };
    }
  }

  if (input.status !== undefined) {
    if (!isTaskStatus(input.status)) {
      throw new Error("不正なステータスです");
    }
    data.status = input.status;
    if (input.status === "done") {
      data.completedAt = new Date();
    } else if (current.status === "done") {
      // 完了 → 他ステータスへ戻したら完了日時をクリア
      data.completedAt = null;
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: TASK_INCLUDE,
  });
  return toDTO(updated);
}

/** タスク削除。 */
export async function deleteTask(id: string): Promise<void> {
  if (!id) {
    throw new Error("id は必須です");
  }
  await prisma.task.delete({ where: { id } });
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
