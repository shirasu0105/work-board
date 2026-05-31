"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { memos } from "@/lib/db/schema";
import { newId, nowIso } from "@/lib/id";
import { memoBaseSchema, sanitizeMemoContent } from "@/lib/validation/memos";
import { formatZodError, type ActionResult } from "@/lib/validation/common";

interface MemoFormInput {
  title: string;
  categoryId: string;
  memoType: string;
  projectId?: string;
  content: Record<string, string>;
}

export async function createMemo(
  input: MemoFormInput,
): Promise<ActionResult & { id?: string }> {
  const parsed = memoBaseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;
  const content = sanitizeMemoContent(d.memoType, input.content ?? {});

  const id = newId();
  const now = nowIso();
  db.insert(memos)
    .values({
      id,
      title: d.title,
      categoryId: d.categoryId,
      memoType: d.memoType,
      projectId: d.projectId,
      content: JSON.stringify(content),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/memos");
  return { ok: true, id };
}

export async function updateMemo(
  id: string,
  input: MemoFormInput,
): Promise<ActionResult> {
  const parsed = memoBaseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;
  const content = sanitizeMemoContent(d.memoType, input.content ?? {});

  db.update(memos)
    .set({
      title: d.title,
      categoryId: d.categoryId,
      memoType: d.memoType,
      projectId: d.projectId,
      content: JSON.stringify(content),
      updatedAt: nowIso(),
    })
    .where(eq(memos.id, id))
    .run();

  revalidatePath("/memos");
  revalidatePath(`/memos/${id}`);
  return { ok: true };
}

export async function deleteMemo(id: string): Promise<void> {
  db.delete(memos).where(eq(memos.id, id)).run();
  revalidatePath("/memos");
  redirect("/memos");
}
