import { NextResponse } from "next/server";
import { listWaitingTasks } from "@/lib/db/waiting";

/**
 * GET /api/tasks/waiting → 現在待ち中のタスク一覧（待ち日数付き）
 */
export async function GET() {
  try {
    const items = await listWaitingTasks();
    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "内部エラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
