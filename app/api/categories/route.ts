import { NextResponse } from "next/server";
import { createCategory, listCategories } from "@/lib/db/category";

/**
 * GET /api/categories
 *  → カテゴリ一覧（表示順）
 *
 * POST /api/categories
 *  body: { name: string, description?: string | null }
 *  → 新規作成（201）
 */

export async function GET() {
  try {
    const categories = await listCategories();
    return NextResponse.json({ categories });
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

  const name = body.name;
  if (typeof name !== "string" || name.trim() === "") {
    return NextResponse.json(
      { error: "カテゴリ名は必須です" },
      { status: 400 }
    );
  }

  const description =
    typeof body.description === "string" || body.description === null
      ? (body.description as string | null)
      : undefined;

  try {
    const created = await createCategory({ name, description });
    return NextResponse.json({ category: created }, { status: 201 });
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
  // 業務上の検証エラー（必須欠落など）はメッセージから 400 と判定
  const status = /必須|形式|存在しない/.test(message) ? 400 : 500;
  return NextResponse.json({ error: message }, { status });
}
