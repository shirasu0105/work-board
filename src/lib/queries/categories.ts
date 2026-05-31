import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, type Category } from "@/lib/db/schema";

/** 全カテゴリ（非表示含む）。設定画面用。 */
export function listAllCategories(): Category[] {
  return db.select().from(categories).orderBy(asc(categories.displayOrder)).all();
}

/** 表示中（is_active）のカテゴリのみ。選択肢用。 */
export function listActiveCategories(): Category[] {
  return db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.displayOrder))
    .all();
}
