import { NextResponse } from "next/server";
import { getJournalByDate } from "@/lib/db/journal";
import { isDateKey } from "@/lib/date";

/**
 * GET /api/journals/:date  （date = YYYY-MM-DD）
 *  → 対象日のジャーナルを取得。未作成なら journal:null を 200 で返す。
 */

type RouteContext = {
  params: Promise<{ date: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { date } = await context.params;
  if (!isDateKey(date)) {
    return NextResponse.json(
      { error: "対象日の日付形式が不正です（YYYY-MM-DD）" },
      { status: 400 }
    );
  }
  try {
    const journal = await getJournalByDate(date);
    return NextResponse.json({ journal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "内部エラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
