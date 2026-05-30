import { NextResponse } from "next/server";
import { reorderCategories } from "@/lib/db/category";

/**
 * POST /api/categories/reorder
 *  body: { orderedIds: string[] }
 *  → 並び替え後の最新一覧（200）
 */
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

  const ids = body.orderedIds;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    !ids.every((s) => typeof s === "string")
  ) {
    return NextResponse.json(
      { error: "orderedIds は文字列配列で 1 件以上必要です" },
      { status: 400 }
    );
  }

  try {
    const categories = await reorderCategories(ids as string[]);
    return NextResponse.json({ categories });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "内部エラーが発生しました";
    const status = /存在しない|空です/.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
