import { NextResponse } from "next/server";
import {
  releaseWaiting,
  startWaiting,
  type ReleaseWaitingInput,
  type StartWaitingInput,
} from "@/lib/db/waiting";
import { isWaitingReleaseStatus } from "@/lib/types/waiting";

/**
 * POST /api/tasks/:id/wait     → タスクを待ち状態にする（待ち相手・待ち理由必須）
 *   body: { partner, reason, reviewAt?, requestNote? }
 * DELETE /api/tasks/:id/wait   → 待ち状態を解除する
 *   body: { nextStatus?: "todo" | "doing", replyNote? }（省略時 nextStatus="todo"）
 */

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "id が指定されていません" },
      { status: 400 }
    );
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

  if (typeof body.partner !== "string" || body.partner.trim() === "") {
    return NextResponse.json({ error: "待ち相手は必須です" }, { status: 400 });
  }
  if (typeof body.reason !== "string" || body.reason.trim() === "") {
    return NextResponse.json({ error: "待ち理由は必須です" }, { status: 400 });
  }

  const input: StartWaitingInput = {
    partner: body.partner,
    reason: body.reason,
    reviewAt: optionalText(body.reviewAt),
    requestNote: optionalText(body.requestNote),
  };

  try {
    const waiting = await startWaiting(id, input);
    return NextResponse.json({ waiting }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "id が指定されていません" },
      { status: 400 }
    );
  }

  let body: unknown = {};
  try {
    // 解除はボディ任意。空ボディ（DELETE）でも動くようにする。
    const text = await request.text();
    if (text.trim() !== "") body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "JSON が解析できません" }, { status: 400 });
  }

  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "リクエストボディの形式が不正です" },
      { status: 400 }
    );
  }

  const input: ReleaseWaitingInput = {};

  if ("nextStatus" in body && body.nextStatus !== undefined) {
    if (!isWaitingReleaseStatus(body.nextStatus)) {
      return NextResponse.json(
        { error: "解除後ステータスは「未着手」または「対応中」のみ選べます" },
        { status: 400 }
      );
    }
    input.nextStatus = body.nextStatus;
  }

  input.replyNote = optionalText(body.replyNote);

  try {
    const result = await releaseWaiting(id, input);
    return NextResponse.json({ task: result });
  } catch (error) {
    return errorResponse(error);
  }
}

function optionalText(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "string") return v;
  return undefined;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "内部エラーが発生しました";
  const status = /見つかりません/.test(message)
    ? 404
    : /必須|形式|存在しない|不正|である必要|のみ|フォーム/.test(message)
      ? 400
      : 500;
  return NextResponse.json({ error: message }, { status });
}
