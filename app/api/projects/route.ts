import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/db/project";
import { isProjectStatus, type ProjectStatus } from "@/lib/types/project";

/**
 * GET /api/projects
 *  query: categoryId?（カテゴリ絞り込み） / status?（ステータス絞り込み）
 *  → プロジェクト一覧（進捗集計含む）
 *
 * POST /api/projects
 *  body: { name, categoryId, completion?, dueDate?, purpose?, status? }
 *  → 新規作成（201）
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const statusParam = searchParams.get("status");
  const status =
    statusParam && isProjectStatus(statusParam) ? statusParam : undefined;

  try {
    const projects = await listProjects({
      categoryId: categoryId || undefined,
      status,
    });
    return NextResponse.json({ projects });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
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

  const name = body.name;
  if (typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "プロジェクト名は必須です" }, { status: 400 });
  }

  const categoryId = body.categoryId;
  if (typeof categoryId !== "string" || categoryId.trim() === "") {
    return NextResponse.json({ error: "カテゴリは必須です" }, { status: 400 });
  }

  const completion = optionalString(body.completion);
  const dueDate = optionalString(body.dueDate);
  const purpose = optionalString(body.purpose);
  if (
    completion === INVALID ||
    dueDate === INVALID ||
    purpose === INVALID
  ) {
    return NextResponse.json(
      { error: "completion / dueDate / purpose は文字列または null である必要があります" },
      { status: 400 }
    );
  }

  let status: ProjectStatus | undefined;
  if ("status" in body && body.status !== undefined) {
    if (!isProjectStatus(body.status)) {
      return NextResponse.json({ error: "不正なステータスです" }, { status: 400 });
    }
    status = body.status;
  }

  try {
    const created = await createProject({
      name,
      categoryId,
      completion,
      dueDate,
      purpose,
      status,
    });
    return NextResponse.json({ project: created }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

const INVALID = Symbol("invalid");

function optionalString(v: unknown): string | null | undefined | typeof INVALID {
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
