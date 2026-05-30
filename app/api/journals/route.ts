import { NextResponse } from "next/server";
import { saveJournal } from "@/lib/db/journal";

/**
 * POST /api/journals
 *  body: { targetDate: string(YYYY-MM-DD), oneLiner: string, selectedTaskIds: string[] }
 *  → 日次ジャーナルを UPSERT 保存（200）
 *
 * 必須: oneLiner（今日のひとこと）／ selectedTaskIds（明日やること・1 件以上）。要件書 §13.1。
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

  const targetDate = body.targetDate;
  if (typeof targetDate !== "string" || targetDate.trim() === "") {
    return NextResponse.json(
      { error: "対象日は必須です" },
      { status: 400 }
    );
  }

  const oneLiner = body.oneLiner;
  if (typeof oneLiner !== "string" || oneLiner.trim() === "") {
    return NextResponse.json(
      { error: "今日のひとことは必須です" },
      { status: 400 }
    );
  }

  const rawIds = body.selectedTaskIds;
  if (
    !Array.isArray(rawIds) ||
    !rawIds.every((v) => typeof v === "string")
  ) {
    return NextResponse.json(
      { error: "selectedTaskIds は文字列配列である必要があります" },
      { status: 400 }
    );
  }
  if (rawIds.length === 0) {
    return NextResponse.json(
      { error: "明日やることを 1 件以上選択してください" },
      { status: 400 }
    );
  }

  try {
    const journal = await saveJournal({
      targetDate,
      oneLiner,
      selectedTaskIds: rawIds as string[],
    });
    return NextResponse.json({ journal });
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
  const status = /必須|形式|存在しない|不正|選択/.test(message) ? 400 : 500;
  return NextResponse.json({ error: message }, { status });
}
