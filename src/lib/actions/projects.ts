"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { newId, nowIso } from "@/lib/id";
import { projectInputSchema, type ProjectInput } from "@/lib/validation/projects";
import { formatZodError, type ActionResult } from "@/lib/validation/common";

export async function createProject(input: ProjectInput): Promise<ActionResult> {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const now = nowIso();
  const max = db
    .select({ v: sql<number>`coalesce(max(${projects.displayOrder}), -1)` })
    .from(projects)
    .get();

  db.insert(projects)
    .values({
      id: newId(),
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      purpose: parsed.data.purpose,
      completionCondition: parsed.data.completionCondition,
      dueDate: parsed.data.dueDate,
      status: "active",
      displayOrder: (max?.v ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath("/projects");
  return { ok: true };
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<ActionResult> {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  db.update(projects)
    .set({
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      purpose: parsed.data.purpose,
      completionCondition: parsed.data.completionCondition,
      dueDate: parsed.data.dueDate,
      updatedAt: nowIso(),
    })
    .where(eq(projects.id, id))
    .run();

  revalidatePath("/projects");
  return { ok: true };
}

export async function completeProject(id: string): Promise<ActionResult> {
  const now = nowIso();
  db.update(projects)
    .set({ status: "completed", completedAt: now, updatedAt: now })
    .where(eq(projects.id, id))
    .run();

  revalidatePath("/projects");
  return { ok: true };
}

export async function reopenProject(id: string): Promise<ActionResult> {
  db.update(projects)
    .set({ status: "active", completedAt: null, updatedAt: nowIso() })
    .where(eq(projects.id, id))
    .run();

  revalidatePath("/projects");
  return { ok: true };
}
