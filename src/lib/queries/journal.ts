import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyJournals, type DailyJournal } from "@/lib/db/schema";

export function getJournal(date: string): DailyJournal | null {
  return (
    db.select().from(dailyJournals).where(eq(dailyJournals.journalDate, date)).get() ??
    null
  );
}
