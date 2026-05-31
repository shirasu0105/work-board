import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, categories, type Project } from "@/lib/db/schema";

export interface ProjectWithCategory extends Project {
  categoryName: string | null;
}

export function listProjects(): ProjectWithCategory[] {
  return db
    .select({
      project: projects,
      categoryName: categories.name,
    })
    .from(projects)
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .orderBy(asc(projects.displayOrder))
    .all()
    .map((r) => ({ ...r.project, categoryName: r.categoryName }));
}
