"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { newId, nowIso } from "@/lib/id";
import { categoryInputSchema, type CategoryInput } from "@/lib/validation/categories";
import { formatZodError, type ActionResult } from "@/lib/validation/common";

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const now = nowIso();
  const max = db
    .select({ v: sql<number>`coalesce(max(${categories.displayOrder}), -1)` })
    .from(categories)
    .get();

  db.insert(categories)
    .values({
      id: newId(),
      name: parsed.data.name,
      description: parsed.data.description,
      displayOrder: (max?.v ?? -1) + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<ActionResult> {
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  db.update(categories)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      updatedAt: nowIso(),
    })
    .where(eq(categories.id, id))
    .run();

  revalidatePath("/settings");
  return { ok: true };
}

/** 非表示/再表示の切替（物理削除はしない）。 */
export async function setCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  db.update(categories)
    .set({ isActive, updatedAt: nowIso() })
    .where(eq(categories.id, id))
    .run();

  revalidatePath("/settings");
  return { ok: true };
}
