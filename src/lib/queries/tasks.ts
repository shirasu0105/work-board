import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks, categories, projects, type Task } from "@/lib/db/schema";

export interface TaskWithRelations extends Task {
  categoryName: string | null;
  projectName: string | null;
}

export function listTasks(): TaskWithRelations[] {
  return db
    .select({
      task: tasks,
      categoryName: categories.name,
      projectName: projects.name,
    })
    .from(tasks)
    .leftJoin(categories, eq(tasks.categoryId, categories.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .orderBy(asc(tasks.displayOrder))
    .all()
    .map((r) => ({
      ...r.task,
      categoryName: r.categoryName,
      projectName: r.projectName,
    }));
}
