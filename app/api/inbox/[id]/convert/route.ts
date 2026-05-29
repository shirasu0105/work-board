import { NextResponse } from "next/server";
import {
  getInboxItem,
  markInboxArchived,
  markInboxProcessed,
} from "@/lib/db/inbox";
import { createTask } from "@/lib/db/task";
import { createProject } from "@/lib/db/project";
import { isInboxConvertTarget } from "@/lib/types/inbox";

/**
 * POST /api/inbox/:id/convert
 *  body: { target: "task" | "project" | "someday", ...payload }
 *
 * - target="task"    : payload { categoryId, dueDate?, note? } でタスクを作成し Inbox を processed に
 * - target="project" : payload { categoryId, completion?, dueDate?, purpose? } でプロジェクトを作成し Inbox を processed に
 * - target="someday" : Inbox 項目を archived にして一覧から外す（Someday 簡易実装）
 *
 * いずれも作成成功後に Inbox 項目を物理削除せず status 変更し、未整理一覧から確実に外す。
 */

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

  const target = body.target;
  if (!isInboxConvertTarget(target)) {
    return NextResponse.json(
      { error: "振り分け先（target）が不正です" },
      { status: 400 }
    );
  }

  // 対象 Inbox 項目の存在確認（タスク名・プロジェクト名の元になる content を取得）
  const inbox = await getInboxItem(id);
  if (!inbox) {
    return NextResponse.json(
      { error: "該当する Inbox 項目が見つかりません" },
      { status: 404 }
    );
  }

  try {
    if (target === "task") {
      const categoryId = body.categoryId;
      if (typeof categoryId !== "string" || categoryId.trim() === "") {
        return NextResponse.json({ error: "カテゴリは必須です" }, { status: 400 });
      }
      const created = await createTask({
        title: inbox.content,
        categoryId,
        dueDate: optionalText(body.dueDate),
        note: optionalText(body.note),
      });
      const item = await markInboxProcessed(id);
      return NextResponse.json({ task: created, item }, { status: 201 });
    }

    if (target === "project") {
      const categoryId = body.categoryId;
      if (typeof categoryId !== "string" || categoryId.trim() === "") {
        return NextResponse.json({ error: "カテゴリは必須です" }, { status: 400 });
      }
      const created = await createProject({
        name: inbox.content,
        categoryId,
        completion: optionalText(body.completion),
        dueDate: optionalText(body.dueDate),
        purpose: optionalText(body.purpose),
      });
      const item = await markInboxProcessed(id);
      return NextResponse.json({ project: created, item }, { status: 201 });
    }

    // target === "someday"
    const item = await markInboxArchived(id);
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

/** 文字列を返す。null/undefined/空はそのまま（createTask 側で正規化）。 */
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
    : /必須|形式|存在しない|不正|である必要/.test(message)
      ? 400
      : 500;
  return NextResponse.json({ error: message }, { status });
}
