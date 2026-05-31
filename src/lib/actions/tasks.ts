"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { newId, nowIso } from "@/lib/id";
import { taskInputSchema, type TaskInput } from "@/lib/validation/tasks";
import { formatZodError, type ActionResult } from "@/lib/validation/common";
import { reassignDisplayOrder } from "@/lib/domain/reorder";
import type { TaskStatus } from "@/lib/constants";

export async function createTask(input: TaskInput): Promise<ActionResult> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;

  const now = nowIso();
  const max = db
    .select({ v: sql<number>`coalesce(max(${tasks.displayOrder}), -1)` })
    .from(tasks)
    .get();

  db.insert(tasks)
    .values({
      id: newId(),
      name: d.name,
      categoryId: d.categoryId,
      projectId: d.projectId,
      dueDate: d.dueDate,
      plannedDate: d.plannedDate,
      memo: d.memo,
      status: d.status,
      displayOrder: (max?.v ?? -1) + 1,
      waitingStartedAt: d.status === "待ち" ? now : null,
      completedAt: d.status === "完了" ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/tasks");
  return { ok: true };
}

export async function updateTask(id: string, input: TaskInput): Promise<ActionResult> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;

  const current = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!current) return { ok: false, error: "対象のタスクが見つかりません" };

  const now = nowIso();
  db.update(tasks)
    .set({
      name: d.name,
      categoryId: d.categoryId,
      projectId: d.projectId,
      dueDate: d.dueDate,
      plannedDate: d.plannedDate,
      memo: d.memo,
      status: d.status,
      // ステータス遷移に伴うタイムスタンプ補正
      completedAt:
        d.status === "完了" ? (current.completedAt ?? now) : null,
      waitingStartedAt:
        d.status === "待ち" ? (current.waitingStartedAt ?? now) : current.waitingStartedAt,
      waitingEndedAt:
        current.status === "待ち" && d.status !== "待ち" ? now : current.waitingEndedAt,
      updatedAt: now,
    })
    .where(eq(tasks.id, id))
    .run();

  revalidatePath("/tasks");
  return { ok: true };
}

/** ステータスのみ変更（一覧のインライン操作用）。 */
export async function setTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<ActionResult> {
  const current = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!current) return { ok: false, error: "対象のタスクが見つかりません" };

  const now = nowIso();
  db.update(tasks)
    .set({
      status,
      completedAt: status === "完了" ? (current.completedAt ?? now) : null,
      waitingStartedAt:
        status === "待ち" ? (current.waitingStartedAt ?? now) : current.waitingStartedAt,
      waitingEndedAt:
        current.status === "待ち" && status !== "待ち" ? now : current.waitingEndedAt,
      updatedAt: now,
    })
    .where(eq(tasks.id, id))
    .run();

  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  db.delete(tasks).where(eq(tasks.id, id)).run();
  revalidatePath("/tasks");
  return { ok: true };
}

/** D&D の並び替え結果（新しい id 順）から display_order を再採番。 */
export async function reorderTasks(orderedIds: string[]): Promise<ActionResult> {
  if (!Array.isArray(orderedIds) || orderedIds.some((v) => typeof v !== "string")) {
    return { ok: false, error: "不正な並び順です" };
  }
  const now = nowIso();
  const assignments = reassignDisplayOrder(orderedIds);

  db.transaction((tx) => {
    for (const a of assignments) {
      tx
        .update(tasks)
        .set({ displayOrder: a.displayOrder, updatedAt: now })
        .where(eq(tasks.id, a.id))
        .run();
    }
  });

  revalidatePath("/tasks");
  return { ok: true };
}
