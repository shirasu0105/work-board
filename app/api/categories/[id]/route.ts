import { NextResponse } from "next/server";
import {
  deleteCategory,
  updateCategory,
  type UpdateCategoryInput,
} from "@/lib/db/category";

/**
 * PATCH /api/categories/:id
 *  body: { name?: string, description?: string | null, isActive?: boolean }
 *  → 部分更新（200）
 *
 * DELETE /api/categories/:id
 *  → 削除（204）
 */

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "id が指定されていません" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON が解析できません" },
      { status: 400 }
    );
  }

  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "リクエストボディの形式が不正です" },
      { status: 400 }
    );
  }

  const input: UpdateCategoryInput = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json(
        { error: "カテゴリ名は必須です" },
        { status: 400 }
      );
    }
    input.name = body.name;
  }

  if ("description" in body) {
    if (
      typeof body.description !== "string" &&
      body.description !== null
    ) {
      return NextResponse.json(
        { error: "description は文字列または null である必要があります" },
        { status: 400 }
      );
    }
    input.description = body.description as string | null;
  }

  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive は boolean である必要があります" },
        { status: 400 }
      );
    }
    input.isActive = body.isActive;
  }

  try {
    const updated = await updateCategory(id, input);
    return NextResponse.json({ category: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "id が指定されていません" },
      { status: 400 }
    );
  }

  try {
    await deleteCategory(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "内部エラーが発生しました";
  const status =
    /見つかりません|存在しない/.test(message)
      ? 404
      : /必須|形式|である必要/.test(message)
        ? 400
        : 500;
  return NextResponse.json({ error: message }, { status });
}
