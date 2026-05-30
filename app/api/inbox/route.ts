import { NextResponse } from "next/server";
import { createInboxItem, listInboxItems } from "@/lib/db/inbox";

/**
 * GET /api/inbox    → 未整理 Inbox 一覧（新しい順）
 * POST /api/inbox   body: { content: string } → 新規作成（201）
 */

export async function GET() {
  try {
    const items = await listInboxItems();
    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
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

  const content = body.content;
  if (typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "内容は必須です" }, { status: 400 });
  }

  try {
    const created = await createInboxItem(content);
    return NextResponse.json({ item: created }, { status: 201 });
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
  const status = /必須|形式|存在しない|不正/.test(message) ? 400 : 500;
  return NextResponse.json({ error: message }, { status });
}
