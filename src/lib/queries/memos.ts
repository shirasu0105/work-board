import "server-only";
import { and, desc, eq, gte, lte, like, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { memos, categories, projects, type Memo } from "@/lib/db/schema";

export interface MemoWithRelations extends Memo {
  categoryName: string | null;
  projectName: string | null;
}

export interface MemoFilters {
  keyword?: string;
  categoryId?: string;
  memoType?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
}

export function listMemos(filters: MemoFilters = {}): MemoWithRelations[] {
  const conds: SQL[] = [];

  if (filters.keyword) {
    const kw = `%${filters.keyword}%`;
    const cond = or(like(memos.title, kw), like(memos.content, kw));
    if (cond) conds.push(cond);
  }
  if (filters.categoryId) conds.push(eq(memos.categoryId, filters.categoryId));
  if (filters.memoType) conds.push(eq(memos.memoType, filters.memoType));
  if (filters.dateFrom) conds.push(gte(memos.createdAt, `${filters.dateFrom}T00:00:00`));
  if (filters.dateTo) conds.push(lte(memos.createdAt, `${filters.dateTo}T23:59:59`));

  return db
    .select({ memo: memos, categoryName: categories.name, projectName: projects.name })
    .from(memos)
    .leftJoin(categories, eq(memos.categoryId, categories.id))
    .leftJoin(projects, eq(memos.projectId, projects.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(memos.createdAt))
    .all()
    .map((r) => ({ ...r.memo, categoryName: r.categoryName, projectName: r.projectName }));
}

export function getMemo(id: string): MemoWithRelations | null {
  const r = db
    .select({ memo: memos, categoryName: categories.name, projectName: projects.name })
    .from(memos)
    .leftJoin(categories, eq(memos.categoryId, categories.id))
    .leftJoin(projects, eq(memos.projectId, projects.id))
    .where(eq(memos.id, id))
    .get();
  if (!r) return null;
  return { ...r.memo, categoryName: r.categoryName, projectName: r.projectName };
}
