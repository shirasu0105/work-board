"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { somedayItems, tasks } from "@/lib/db/schema";
import { newId, nowIso } from "@/lib/id";
import { somedayInputSchema, type SomedayInput } from "@/lib/validation/someday";
import { formatZodError, type ActionResult } from "@/lib/validation/common";

export async function createSomeday(input: SomedayInput): Promise<ActionResult> {
  const parsed = somedayInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;
  const now = nowIso();

  db.insert(somedayItems)
    .values({
      id: newId(),
      content: d.content,
      categoryId: d.categoryId,
      reason: d.reason,
      reviewDate: d.reviewDate,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/someday");
  return { ok: true };
}

export async function updateSomeday(
  id: string,
  input: SomedayInput,
): Promise<ActionResult> {
  const parsed = somedayInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;

  db.update(somedayItems)
    .set({
      content: d.content,
      categoryId: d.categoryId,
      reason: d.reason,
      reviewDate: d.reviewDate,
      updatedAt: nowIso(),
    })
    .where(eq(somedayItems.id, id))
    .run();

  revalidatePath("/someday");
  return { ok: true };
}

/** タスクへ昇格。タスクを生成し、Someday を promoted にする（トランザクション）。 */
export async function promoteSomeday(id: string): Promise<ActionResult> {
  const item = db.select().from(somedayItems).where(eq(somedayItems.id, id)).get();
  if (!item) return { ok: false, error: "対象が見つかりません" };
  const now = nowIso();

  db.transaction((tx) => {
    const max = tx
      .select({ v: sql<number>`coalesce(max(${tasks.displayOrder}), -1)` })
      .from(tasks)
      .get();
    tx
      .insert(tasks)
      .values({
        id: newId(),
        name: item.content,
        categoryId: item.categoryId,
        status: "未着手",
        displayOrder: (max?.v ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    tx
      .update(somedayItems)
      .set({ status: "promoted", updatedAt: now })
      .where(eq(somedayItems.id, id))
      .run();
  });

  revalidatePath("/someday");
  revalidatePath("/tasks");
  return { ok: true };
}

export async function dropSomeday(id: string): Promise<ActionResult> {
  db.update(somedayItems)
    .set({ status: "dropped", updatedAt: nowIso() })
    .where(eq(somedayItems.id, id))
    .run();
  revalidatePath("/someday");
  return { ok: true };
}

export async function reactivateSomeday(id: string): Promise<ActionResult> {
  db.update(somedayItems)
    .set({ status: "active", updatedAt: nowIso() })
    .where(eq(somedayItems.id, id))
    .run();
  revalidatePath("/someday");
  return { ok: true };
}
