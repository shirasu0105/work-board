import { NextResponse } from "next/server";
import { createSomedayItem, listSomedayItems } from "@/lib/db/someday";

/**
 * GET /api/someday
 *  → Someday 一覧（status="open"）
 *
 * POST /api/someday
 *  body: { content: string, categoryId: string, reason?: string|null, reviewAt?: string|null }
 *  → 新規作成（201）
 */

export async function GET() {
  try {
    const items = await listSomedayItems();
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

  const categoryId = body.categoryId;
  if (typeof categoryId !== "string" || categoryId.trim() === "") {
    return NextResponse.json({ error: "カテゴリは必須です" }, { status: 400 });
  }

  const reason = optionalString(body.reason);
  const reviewAt = optionalString(body.reviewAt);
  if (reason === INVALID || reviewAt === INVALID) {
    return NextResponse.json(
      { error: "reason / reviewAt は文字列または null である必要があります" },
      { status: 400 }
    );
  }

  try {
    const created = await createSomedayItem({
      content,
      categoryId,
      reason,
      reviewAt,
    });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

const INVALID = Symbol("invalid");

function optionalString(
  v: unknown
): string | null | undefined | typeof INVALID {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "string") return v;
  return INVALID;
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
