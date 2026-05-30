import { NextResponse } from "next/server";
import {
  deleteTask,
  getTask,
  updateTask,
  type UpdateTaskInput,
} from "@/lib/db/task";
import { isTaskStatus } from "@/lib/types/task";

/**
 * GET /api/tasks/:id     → 単一取得（200 / 404）
 * PATCH /api/tasks/:id   → 部分更新（編集・ステータス変更）（200）
 *   body: { title?, categoryId?, dueDate?, note?, projectId?, status? }
 * DELETE /api/tasks/:id  → 削除（204）
 */

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "id が指定されていません" },
      { status: 400 }
    );
  }
  try {
    const task = await getTask(id);
    if (!task) {
      return NextResponse.json(
        { error: "該当タスクが見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const input: UpdateTaskInput = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return NextResponse.json(
        { error: "タスク名は必須です" },
        { status: 400 }
      );
    }
    input.title = body.title;
  }

  if ("categoryId" in body) {
    if (typeof body.categoryId !== "string" || body.categoryId.trim() === "") {
      return NextResponse.json(
        { error: "カテゴリは必須です" },
        { status: 400 }
      );
    }
    input.categoryId = body.categoryId;
  }

  if ("dueDate" in body) {
    if (typeof body.dueDate !== "string" && body.dueDate !== null) {
      return NextResponse.json(
        { error: "dueDate は文字列または null である必要があります" },
        { status: 400 }
      );
    }
    input.dueDate = body.dueDate as string | null;
  }

  if ("note" in body) {
    if (typeof body.note !== "string" && body.note !== null) {
      return NextResponse.json(
        { error: "note は文字列または null である必要があります" },
        { status: 400 }
      );
    }
    input.note = body.note as string | null;
  }

  if ("projectId" in body) {
    if (typeof body.projectId !== "string" && body.projectId !== null) {
      return NextResponse.json(
        { error: "projectId は文字列または null である必要があります" },
        { status: 400 }
      );
    }
    input.projectId = body.projectId as string | null;
  }

  if ("status" in body) {
    if (!isTaskStatus(body.status)) {
      return NextResponse.json(
        { error: "不正なステータスです" },
        { status: 400 }
      );
    }
    input.status = body.status;
  }

  try {
    const updated = await updateTask(id, input);
    return NextResponse.json({ task: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "id が指定されていません" },
      { status: 400 }
    );
  }
  try {
    await deleteTask(id);
    return new NextResponse(null, { status: 204 });
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
  const status =
    /見つかりません/.test(message)
      ? 404
      : /必須|形式|存在しない|不正|である必要/.test(message)
        ? 400
        : 500;
  return NextResponse.json({ error: message }, { status });
}
