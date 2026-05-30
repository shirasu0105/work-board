import { NextResponse } from "next/server";
import {
  deleteProject,
  getProject,
  updateProject,
  type UpdateProjectInput,
} from "@/lib/db/project";
import { isProjectStatus } from "@/lib/types/project";

/**
 * GET /api/projects/:id     → 単一取得（200 / 404）
 * PATCH /api/projects/:id   body: { name?, categoryId?, completion?, dueDate?, purpose?, status? }
 * DELETE /api/projects/:id  → 削除（204）
 */

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id が指定されていません" }, { status: 400 });
  }
  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json(
        { error: "該当プロジェクトが見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ project });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id が指定されていません" }, { status: 400 });
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

  const input: UpdateProjectInput = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "プロジェクト名は必須です" }, { status: 400 });
    }
    input.name = body.name;
  }

  if ("categoryId" in body) {
    if (typeof body.categoryId !== "string" || body.categoryId.trim() === "") {
      return NextResponse.json({ error: "カテゴリは必須です" }, { status: 400 });
    }
    input.categoryId = body.categoryId;
  }

  if ("completion" in body) {
    if (typeof body.completion !== "string" && body.completion !== null) {
      return NextResponse.json(
        { error: "completion は文字列または null である必要があります" },
        { status: 400 }
      );
    }
    input.completion = body.completion as string | null;
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

  if ("purpose" in body) {
    if (typeof body.purpose !== "string" && body.purpose !== null) {
      return NextResponse.json(
        { error: "purpose は文字列または null である必要があります" },
        { status: 400 }
      );
    }
    input.purpose = body.purpose as string | null;
  }

  if ("status" in body) {
    if (!isProjectStatus(body.status)) {
      return NextResponse.json({ error: "不正なステータスです" }, { status: 400 });
    }
    input.status = body.status;
  }

  try {
    const updated = await updateProject(id, input);
    return NextResponse.json({ project: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "id が指定されていません" }, { status: 400 });
  }
  try {
    await deleteProject(id);
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
  const status = /見つかりません/.test(message)
    ? 404
    : /必須|形式|存在しない|不正|である必要/.test(message)
      ? 400
      : 500;
  return NextResponse.json({ error: message }, { status });
}
