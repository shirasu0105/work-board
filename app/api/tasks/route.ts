import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/db/task";

/**
 * GET /api/tasks
 *  query: categoryId?（カテゴリ絞り込み） / includeDone?（"false" で完了除外）
 *  → タスク一覧
 *
 * POST /api/tasks
 *  body: { title: string, categoryId: string, dueDate?: string|null, note?: string|null, projectId?: string|null }
 *  → 新規作成（201）
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;
  const includeDoneParam = searchParams.get("includeDone");
  const includeDone = includeDoneParam === "false" ? false : true;

  try {
    const tasks = await listTasks({
      categoryId: categoryId || undefined,
      projectId: projectId || undefined,
      includeDone,
    });
    return NextResponse.json({ tasks });
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
      { error: "タスク名は必須です" },
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

  const dueDate = optionalString(body.dueDate);
  if (dueDate === INVALID) {
    return NextResponse.json(
      { error: "dueDate は文字列または null である必要があります" },
      { status: 400 }
    );
  }

  const note = optionalString(body.note);
  if (note === INVALID) {
    return NextResponse.json(
      { error: "note は文字列または null である必要があります" },
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
    const created = await createTask({
      title,
      categoryId,
      dueDate,
      note,
      projectId,
    });
    return NextResponse.json({ task: created }, { status: 201 });
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
