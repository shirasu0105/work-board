import type { Category } from "@prisma/client";
import { prisma } from "./client";

/**
 * カテゴリ CRUD のサーバー側関数群。
 *
 * - Server Component / Route Handler / Server Action のいずれからも呼べる純関数
 * - 入力バリデーションは「呼び出し側で行う」ことを前提に、ここでは型と必須前提のみ確認
 * - 並び替えはアプリ全体で `displayOrder` の昇順をソース・オブ・トゥルースとする
 */

export type CategoryDTO = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function toDTO(c: Category): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    displayOrder: c.displayOrder,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/** カテゴリ一覧（表示順昇順 → 作成順）。無効カテゴリも含める。 */
export async function listCategories(): Promise<CategoryDTO[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toDTO);
}

export type CreateCategoryInput = {
  name: string;
  description?: string | null;
};

/** カテゴリ新規作成。`displayOrder` は末尾に追加。 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<CategoryDTO> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("カテゴリ名は必須です");
  }

  // 既存最大の displayOrder + 1 を末尾に割り当てる
  const last = await prisma.category.findFirst({
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });
  const nextOrder = (last?.displayOrder ?? -1) + 1;

  const created = await prisma.category.create({
    data: {
      name,
      description: normalizeDescription(input.description),
      displayOrder: nextOrder,
      isActive: true,
    },
  });
  return toDTO(created);
}

export type UpdateCategoryInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

/** カテゴリ編集（名前 / 説明 / 有効状態）。指定されたフィールドのみ更新。 */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<CategoryDTO> {
  if (!id) {
    throw new Error("id は必須です");
  }

  const data: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  } = {};

  if (typeof input.name === "string") {
    const name = input.name.trim();
    if (!name) {
      throw new Error("カテゴリ名は必須です");
    }
    data.name = name;
  }

  if (input.description !== undefined) {
    data.description = normalizeDescription(input.description);
  }

  if (typeof input.isActive === "boolean") {
    data.isActive = input.isActive;
  }

  const updated = await prisma.category.update({
    where: { id },
    data,
  });
  return toDTO(updated);
}

/** 表示 ON/OFF 切替。`isActive` を反転する。 */
export async function toggleCategoryActive(id: string): Promise<CategoryDTO> {
  const current = await prisma.category.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!current) {
    throw new Error("該当カテゴリが見つかりません");
  }
  const updated = await prisma.category.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
  return toDTO(updated);
}

/**
 * 並び順の一括更新。
 * `orderedIds` の並びどおりに `displayOrder` を 0..n に振り直す。
 * トランザクションで全件を一括更新するため、一部失敗時はロールバックされる。
 */
export async function reorderCategories(
  orderedIds: string[]
): Promise<CategoryDTO[]> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new Error("orderedIds が空です");
  }

  // 存在件数チェック（不正 ID 混入を弾く）
  const existing = await prisma.category.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true },
  });
  if (existing.length !== orderedIds.length) {
    throw new Error("存在しないカテゴリ ID が含まれています");
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { displayOrder: index },
      })
    )
  );

  return listCategories();
}

/** カテゴリ削除（関連プロジェクト等がある場合は Prisma 側で Restrict によりエラー）。 */
export async function deleteCategory(id: string): Promise<void> {
  if (!id) {
    throw new Error("id は必須です");
  }
  await prisma.category.delete({ where: { id } });
}

function normalizeDescription(
  value: string | null | undefined
): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
