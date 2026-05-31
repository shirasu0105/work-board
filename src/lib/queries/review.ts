import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { weeklyReviews, type WeeklyReview } from "@/lib/db/schema";

export function listRecentReviews(limit = 5): WeeklyReview[] {
  return db
    .select()
    .from(weeklyReviews)
    .orderBy(desc(weeklyReviews.reviewedAt))
    .limit(limit)
    .all();
}
