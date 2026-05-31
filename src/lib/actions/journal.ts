"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { dailyJournals } from "@/lib/db/schema";
import { newId, nowIso } from "@/lib/id";
import { requiredText, formatZodError, type ActionResult } from "@/lib/validation/common";
import { z } from "zod";

const journalSchema = z.object({
  journalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "対象日が不正です"),
  todayComment: requiredText("今日のひとこと", 1000),
});

/** 対象日のジャーナルを upsert（journal_date が一意）。 */
export async function saveJournal(input: {
  journalDate: string;
  todayComment: string;
}): Promise<ActionResult> {
  const parsed = journalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const { journalDate, todayComment } = parsed.data;
  const now = nowIso();

  db.insert(dailyJournals)
    .values({
      id: newId(),
      journalDate,
      todayComment,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: dailyJournals.journalDate,
      set: { todayComment, updatedAt: now },
    })
    .run();

  revalidatePath("/journal");
  return { ok: true };
}
