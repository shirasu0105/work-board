import { NextResponse } from "next/server";
import {
  deleteMemo,
  getMemo,
  updateMemo,
  type UpdateMemoInput,
} from "@/lib/db/memo";
import { isMemoKind } from "@/lib/types/memo";

/**
 * GET /api/memos/:id     → 単一取得（200 / 404）
 * PATCH /api/memos/:id   → 部分更新（編集）（200）
 *   body: { title?, categoryId?, kind?, body?, projectId? }
 * DELETE /api/memos/:id  → 削除（204）
 */

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "id が指定されていません" },
      { status: 400 }
    );
  }
  try {
    const memo = await getMemo(id);
    if (!memo) {
      return NextResponse.json(
        { error: "該当メモが見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ memo });
  } catch (error) {
    return errorResponse(error);
  }
}

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

  const input: UpdateMemoInput = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return NextResponse.json(
        { error: "タイトルは必須です" },
        { status: 400 }
      );
    }
    input.title = body.title;
  }

  if ("categoryId" in body) {
    if (typeof body.categoryId !== "string" || body.categoryId.trim() === "") {
      return NextResponse.json(
        { error: "カテゴリは必須です" },
        { status: 400 }
      );
    }
    input.categoryId = body.categoryId;
  }

  if ("kind" in body) {
    if (!isMemoKind(body.kind)) {
      return NextResponse.json(
        { error: "不正なメモ種別です" },
        { status: 400 }
      );
    }
    input.kind = body.kind;
  }

  if ("body" in body) {
    // body はオブジェクト（フィールド key → 値）を想定。型は db 層で正規化する。
    input.body = body.body;
  }

  if ("projectId" in body) {
    if (typeof body.projectId !== "string" && body.projectId !== null) {
      return NextResponse.json(
        { error: "projectId は文字列または null である必要があります" },
        { status: 400 }
      );
    }
    input.projectId = body.projectId as string | null;
  }

  try {
    const updated = await updateMemo(id, input);
    return NextResponse.json({ memo: updated });
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
    await deleteMemo(id);
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
  const status = /見つかりません/.test(message)
    ? 404
    : /必須|形式|存在しない|不正|である必要/.test(message)
      ? 400
      : 500;
  return NextResponse.json({ error: message }, { status });
}
