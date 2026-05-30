import type { Prisma } from "@prisma/client";
import { prisma } from "./client";
import {
  isSomedayStatus,
  type SomedayItemDTO,
  type SomedayStatus,
} from "@/lib/types/someday";

/**
 * Someday / Maybe CRUD のサーバー側関数群（Phase 8 / 要件書 §10.7）。
 *
 * - Server Component / Route Handler のどちらからも呼べる純関数
 * - 必須は content / categoryId（要件書 §13.1）。理由・見直し日は任意。
 * - 一覧は status="open"（保留中）のみを新しい順で返す
 * - 初期 MVP では作成・一覧・削除の簡易実装（要件書 §10.7.4）
 */

type SomedayWithRelations = Prisma.SomedayItemGetPayload<{
  include: { category: { select: { name: true } } };
}>;

const SOMEDAY_INCLUDE = {
  category: { select: { name: true } },
} as const;

function toDTO(s: SomedayWithRelations): SomedayItemDTO {
  return {
    id: s.id,
    content: s.content,
    reason: s.reason,
    reviewAt: s.reviewAt ? s.reviewAt.toISOString() : null,
    status: isSomedayStatus(s.status) ? s.status : "open",
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    categoryId: s.categoryId,
    categoryName: s.category.name,
  };
}

export type ListSomedayFilter = {
  /** ステータスで絞り込む。未指定なら open のみ。 */
  status?: SomedayStatus;
};

/** Someday 一覧。既定は status="open" を作成新しい順で返す。 */
export async function listSomedayItems(
  filter: ListSomedayFilter = {}
): Promise<SomedayItemDTO[]> {
  const where: Prisma.SomedayItemWhereInput = {
    status: filter.status ?? "open",
  };
  const rows = await prisma.somedayItem.findMany({
    where,
    include: SOMEDAY_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDTO);
}

export async function getSomedayItem(
  id: string
): Promise<SomedayItemDTO | null> {
  if (!id) return null;
  const row = await prisma.somedayItem.findUnique({
    where: { id },
    include: SOMEDAY_INCLUDE,
  });
  return row ? toDTO(row) : null;
}

export type CreateSomedayInput = {
  content: string;
  categoryId: string;
  reason?: string | null;
  reviewAt?: string | null;
};

/** Someday 新規作成。必須は content / categoryId。 */
export async function createSomedayItem(
  input: CreateSomedayInput
): Promise<SomedayItemDTO> {
  const content = input.content.trim();
  if (!content) {
    throw new Error("内容は必須です");
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

  const created = await prisma.somedayItem.create({
    data: {
      content,
      categoryId: input.categoryId,
      reason: normalizeText(input.reason),
      reviewAt: parseDate(input.reviewAt),
      status: "open",
    },
    include: SOMEDAY_INCLUDE,
  });
  return toDTO(created);
}

/** Someday 項目の物理削除（要件書 §10.7.2 削除）。 */
export async function deleteSomedayItem(id: string): Promise<void> {
  if (!id) {
    throw new Error("id は必須です");
  }
  await prisma.somedayItem.delete({ where: { id } });
}

function parseDate(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    throw new Error("見直し日の日付形式が不正です");
  }
  return d;
}

function normalizeText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
