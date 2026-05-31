"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { inboxItems, tasks, projects, somedayItems } from "@/lib/db/schema";
import { newId, nowIso } from "@/lib/id";
import { formatZodError, type ActionResult } from "@/lib/validation/common";
import { inboxInputSchema } from "@/lib/validation/inbox";
import { taskInputSchema, type TaskInput } from "@/lib/validation/tasks";
import { projectInputSchema, type ProjectInput } from "@/lib/validation/projects";
import { somedayInputSchema, type SomedayInput } from "@/lib/validation/someday";

export async function addInboxItem(input: { content: string }): Promise<ActionResult> {
  const parsed = inboxInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const now = nowIso();
  db.insert(inboxItems)
    .values({
      id: newId(),
      content: parsed.data.content,
      status: "未整理",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/inbox");
  return { ok: true };
}

// drizzle の同期トランザクション型（最小限の型注釈用）
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function markOrganized(
  tx: Tx,
  inboxId: string,
  organizedTo: string,
  relatedId: string | null,
  now: string,
) {
  tx
    .update(inboxItems)
    .set({ status: "整理済み", organizedTo, relatedId, organizedAt: now, updatedAt: now })
    .where(eq(inboxItems.id, inboxId))
    .run();
}

export async function organizeToTask(
  inboxId: string,
  input: TaskInput,
): Promise<ActionResult> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;
  const now = nowIso();

  db.transaction((tx) => {
    const id = newId();
    const max = tx
      .select({ v: sql<number>`coalesce(max(${tasks.displayOrder}), -1)` })
      .from(tasks)
      .get();
    tx
      .insert(tasks)
      .values({
        id,
        name: d.name,
        categoryId: d.categoryId,
        projectId: d.projectId,
        dueDate: d.dueDate,
        plannedDate: d.plannedDate,
        memo: d.memo,
        status: d.status,
        displayOrder: (max?.v ?? -1) + 1,
        sourceInboxId: inboxId,
        waitingStartedAt: d.status === "待ち" ? now : null,
        completedAt: d.status === "完了" ? now : null,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    markOrganized(tx, inboxId, "task", id, now);
  });

  revalidatePath("/inbox");
  revalidatePath("/tasks");
  return { ok: true };
}

export async function organizeToProject(
  inboxId: string,
  input: ProjectInput,
): Promise<ActionResult> {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;
  const now = nowIso();

  db.transaction((tx) => {
    const id = newId();
    const max = tx
      .select({ v: sql<number>`coalesce(max(${projects.displayOrder}), -1)` })
      .from(projects)
      .get();
    tx
      .insert(projects)
      .values({
        id,
        name: d.name,
        categoryId: d.categoryId,
        purpose: d.purpose,
        completionCondition: d.completionCondition,
        dueDate: d.dueDate,
        status: "active",
        displayOrder: (max?.v ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    markOrganized(tx, inboxId, "project", id, now);
  });

  revalidatePath("/inbox");
  revalidatePath("/projects");
  return { ok: true };
}

export async function organizeToSomeday(
  inboxId: string,
  input: SomedayInput,
): Promise<ActionResult> {
  const parsed = somedayInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;
  const now = nowIso();

  db.transaction((tx) => {
    const id = newId();
    tx
      .insert(somedayItems)
      .values({
        id,
        content: d.content,
        categoryId: d.categoryId,
        reason: d.reason,
        reviewDate: d.reviewDate,
        status: "active",
        sourceInboxId: inboxId,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    markOrganized(tx, inboxId, "someday", id, now);
  });

  revalidatePath("/inbox");
  revalidatePath("/someday");
  return { ok: true };
}

/** 削除（論理）。関連元として残すため物理削除せず organized_to=deleted にする。 */
export async function discardInboxItem(inboxId: string): Promise<ActionResult> {
  const now = nowIso();
  db.update(inboxItems)
    .set({ status: "整理済み", organizedTo: "deleted", organizedAt: now, updatedAt: now })
    .where(eq(inboxItems.id, inboxId))
    .run();
  revalidatePath("/inbox");
  return { ok: true };
}
