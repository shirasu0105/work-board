import { NextResponse } from "next/server";
import { createMemo, listMemos } from "@/lib/db/memo";
import { isMemoKind } from "@/lib/types/memo";

/**
 * GET /api/memos
 *  query: categoryId?（カテゴリ絞り込み） / kind?（種別絞り込み）
 *  → メモ一覧（createdAt 降順）
 *
 * POST /api/memos
 *  body: { title: string, categoryId: string, kind: MemoKind,
 *          body?: Record<string,string>, projectId?: string|null }
 *  → 新規作成（201）
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const kindParam = searchParams.get("kind") ?? undefined;
  const kind = kindParam && isMemoKind(kindParam) ? kindParam : undefined;

  try {
    const memos = await listMemos({
      categoryId: categoryId || undefined,
      kind,
    });
    return NextResponse.json({ memos });
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

  const title = body.title;
  if (typeof title !== "string" || title.trim() === "") {
    return NextResponse.json(
      { error: "タイトルは必須です" },
      { status: 400 }
    );
  }

  const categoryId = body.categoryId;
  if (typeof categoryId !== "string" || categoryId.trim() === "") {
    return NextResponse.json(
      { error: "カテゴリは必須です" },
      { status: 400 }
    );
  }

  const kind = body.kind;
  if (!isMemoKind(kind)) {
    return NextResponse.json(
      { error: "不正なメモ種別です" },
      { status: 400 }
    );
  }

  const projectId = optionalString(body.projectId);
  if (projectId === INVALID) {
    return NextResponse.json(
      { error: "projectId は文字列または null である必要があります" },
      { status: 400 }
    );
  }

  try {
    const created = await createMemo({
      title,
      categoryId,
      kind,
      body: body.body,
      projectId,
    });
    return NextResponse.json({ memo: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

const INVALID = Symbol("invalid");

/** 文字列 or null or 未指定（undefined）を許容。それ以外は INVALID を返す。 */
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
