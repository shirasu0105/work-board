import { NextResponse } from "next/server";
import {
  deleteInboxItem,
  getInboxItem,
  updateInboxItem,
} from "@/lib/db/inbox";

/**
 * GET /api/inbox/:id     → 単一取得（200 / 404）
 * PATCH /api/inbox/:id   body: { content: string } → 内容編集（200）
 * DELETE /api/inbox/:id  → 削除（204）
 */

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id が指定されていません" }, { status: 400 });
  }
  try {
    const item = await getInboxItem(id);
    if (!item) {
      return NextResponse.json(
        { error: "該当する Inbox 項目が見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id が指定されていません" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON が解析できません" }, { status: 400 });
  }

  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "リクエストボディの形式が不正です" },
      { status: 400 }
    );
  }

  const content = body.content;
  if (typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "内容は必須です" }, { status: 400 });
  }

  try {
    const updated = await updateInboxItem(id, content);
    return NextResponse.json({ item: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id が指定されていません" }, { status: 400 });
  }
  try {
    await deleteInboxItem(id);
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
    : /必須|形式|存在しない|不正/.test(message)
      ? 400
      : 500;
  return NextResponse.json({ error: message }, { status });
}
