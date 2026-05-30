import type { Prisma } from "@prisma/client";
import { prisma } from "./client";
import {
  isMemoKind,
  normalizeBody,
  type MemoDTO,
  type MemoKind,
} from "@/lib/types/memo";

/**
 * メモ CRUD のサーバー側関数群（Phase 6 / 要件書 §10.8・§10.9）。
 *
 * - Server Component / Route Handler のどちらからも呼べる純関数
 * - 種別別フォーマットの内容は body（TEXT）に JSON 文字列で格納する
 * - 一覧はタイムライン用途のため createdAt 降順をソース・オブ・トゥルースとする
 * - 必須は title / categoryId / kind（要件書 §13.1）
 */

type MemoWithRelations = Prisma.MemoGetPayload<{
  include: {
    category: { select: { name: true } };
    project: { select: { name: true } };
  };
}>;

const MEMO_INCLUDE = {
  category: { select: { name: true } },
  project: { select: { name: true } },
} as const;

function toDTO(m: MemoWithRelations): MemoDTO {
  const kind: MemoKind = isMemoKind(m.kind) ? m.kind : "meeting";
  return {
    id: m.id,
    title: m.title,
    kind,
    body: normalizeBody(kind, parseBody(m.body)),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    categoryId: m.categoryId,
    categoryName: m.category.name,
    projectId: m.projectId,
    projectName: m.project?.name ?? null,
  };
}

/** body の JSON 文字列を安全にパースする。壊れていたら空オブジェクト。 */
function parseBody(raw: string): unknown {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export type ListMemosFilter = {
  /** カテゴリで絞り込む。未指定なら全件。 */
  categoryId?: string;
  /** 種別で絞り込む。未指定なら全件。 */
  kind?: MemoKind;
};

/**
 * メモ一覧。タイムライン用途のため createdAt 降順（新しい順）。
 */
export async function listMemos(
  filter: ListMemosFilter = {}
): Promise<MemoDTO[]> {
  const where: Prisma.MemoWhereInput = {};
  if (filter.categoryId) {
    where.categoryId = filter.categoryId;
  }
  if (filter.kind && isMemoKind(filter.kind)) {
    where.kind = filter.kind;
  }

  const rows = await prisma.memo.findMany({
    where,
    include: MEMO_INCLUDE,
    orderBy: [{ createdAt: "desc" }],
  });
  return rows.map(toDTO);
}

export async function getMemo(id: string): Promise<MemoDTO | null> {
  if (!id) return null;
  const row = await prisma.memo.findUnique({
    where: { id },
    include: MEMO_INCLUDE,
  });
  return row ? toDTO(row) : null;
}

export type CreateMemoInput = {
  title: string;
  categoryId: string;
  kind: MemoKind;
  body?: unknown;
  projectId?: string | null;
};

/** メモ新規作成。必須は title / categoryId / kind。 */
export async function createMemo(input: CreateMemoInput): Promise<MemoDTO> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("タイトルは必須です");
  }
  if (!input.categoryId) {
    throw new Error("カテゴリは必須です");
  }
  if (!isMemoKind(input.kind)) {
    throw new Error("不正なメモ種別です");
  }

  // カテゴリ存在チェック（不正 ID 弾き）
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });
  if (!category) {
    throw new Error("存在しないカテゴリです");
  }

  const body = normalizeBody(input.kind, input.body);

  const created = await prisma.memo.create({
    data: {
      title,
      categoryId: input.categoryId,
      kind: input.kind,
      body: JSON.stringify(body),
      projectId: input.projectId ?? null,
    },
    include: MEMO_INCLUDE,
  });
  return toDTO(created);
}

export type UpdateMemoInput = {
  title?: string;
  categoryId?: string;
  kind?: MemoKind;
  body?: unknown;
  projectId?: string | null;
};

/**
 * メモ部分更新。
 * 種別（kind）変更を許す場合、body は新しい種別のフィールドに正規化される。
 * body だけ送って kind 未指定のときは、既存種別で正規化する。
 */
export async function updateMemo(
  id: string,
  input: UpdateMemoInput
): Promise<MemoDTO> {
  if (!id) {
    throw new Error("id は必須です");
  }

  const current = await prisma.memo.findUnique({
    where: { id },
    select: { kind: true },
  });
  if (!current) {
    throw new Error("該当メモが見つかりません");
  }

  const data: Prisma.MemoUpdateInput = {};

  if (typeof input.title === "string") {
    const title = input.title.trim();
    if (!title) {
      throw new Error("タイトルは必須です");
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

  // 正規化に使う種別を決める（更新後の種別を優先）
  const effectiveKind: MemoKind =
    input.kind !== undefined
      ? input.kind
      : isMemoKind(current.kind)
        ? current.kind
        : "meeting";

  if (input.kind !== undefined) {
    if (!isMemoKind(input.kind)) {
      throw new Error("不正なメモ種別です");
    }
    data.kind = input.kind;
  }

  if (input.body !== undefined) {
    const body = normalizeBody(effectiveKind, input.body);
    data.body = JSON.stringify(body);
  }

  if (input.projectId !== undefined) {
    if (input.projectId === null) {
      data.project = { disconnect: true };
    } else {
      data.project = { connect: { id: input.projectId } };
    }
  }

  const updated = await prisma.memo.update({
    where: { id },
    data,
    include: MEMO_INCLUDE,
  });
  return toDTO(updated);
}

/** メモ削除。 */
export async function deleteMemo(id: string): Promise<void> {
  if (!id) {
    throw new Error("id は必須です");
  }
  await prisma.memo.delete({ where: { id } });
}
