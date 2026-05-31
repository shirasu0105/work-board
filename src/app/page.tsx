import Link from "next/link";
import { eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks, projects, categories } from "@/lib/db/schema";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody } from "@/components/ui/Card";

// DB を直接読むため動的レンダリング
export const dynamic = "force-dynamic";

export default function HomePage() {
  const openTasks = db.select().from(tasks).where(ne(tasks.status, "完了")).all().length;
  const waitingTasks = db.select().from(tasks).where(eq(tasks.status, "待ち")).all().length;
  const activeProjects = db
    .select()
    .from(projects)
    .where(eq(projects.status, "active"))
    .all().length;
  const activeCategories = db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .all().length;

  const stats = [
    { label: "未完了タスク", value: openTasks, href: "/tasks" },
    { label: "待ちタスク", value: waitingTasks, href: "/tasks" },
    { label: "進行中プロジェクト", value: activeProjects, href: "/projects" },
    { label: "カテゴリ", value: activeCategories, href: "/settings" },
  ];

  return (
    <PageShell title="ホーム">
      <p className="mb-6 text-sm text-ink-subtle">
        work-board へようこそ。現在のゴール（M0〜M3）では カテゴリ / プロジェクト /
        タスク管理が利用できます。
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:border-hairline-strong">
              <CardBody>
                <p className="text-sm text-ink-subtle">{s.label}</p>
                <p className="mt-1 text-3xl font-semibold text-ink">{s.value}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
