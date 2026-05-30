import { NextResponse } from "next/server";
import { deleteSomedayItem, getSomedayItem } from "@/lib/db/someday";

/**
 * DELETE /api/someday/:id
 *  → Someday 項目を削除（204）
 */

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "id が指定されていません" },
      { status: 400 }
    );
  }

  const existing = await getSomedayItem(id);
  if (!existing) {
    return NextResponse.json(
      { error: "該当する Someday 項目が見つかりません" },
      { status: 404 }
    );
  }

  try {
    await deleteSomedayItem(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "内部エラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
