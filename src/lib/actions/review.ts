"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { weeklyReviews } from "@/lib/db/schema";
import { newId, nowIso } from "@/lib/id";
import { optionalText, formatZodError, type ActionResult } from "@/lib/validation/common";

const reviewSchema = z.object({
  weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "対象週が不正です"),
  note: optionalText(2000),
});

/** 週次レビューの実施を記録する。 */
export async function saveWeeklyReview(input: {
  weekOf: string;
  note: string;
}): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const now = nowIso();
  db.insert(weeklyReviews)
    .values({
      id: newId(),
      weekOf: parsed.data.weekOf,
      reviewedAt: now,
      note: parsed.data.note,
      createdAt: now,
    })
    .run();

  revalidatePath("/review");
  return { ok: true };
}
