import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { somedayItems, categories, type SomedayItem } from "@/lib/db/schema";

export interface SomedayWithCategory extends SomedayItem {
  categoryName: string | null;
}

export function listSomeday(): SomedayWithCategory[] {
  return db
    .select({ item: somedayItems, categoryName: categories.name })
    .from(somedayItems)
    .leftJoin(categories, eq(somedayItems.categoryId, categories.id))
    .orderBy(asc(somedayItems.createdAt))
    .all()
    .map((r) => ({ ...r.item, categoryName: r.categoryName }));
}
