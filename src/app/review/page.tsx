import { PageShell } from "@/components/layout/PageShell";
import { ReviewView } from "@/components/review/ReviewView";
import { listTasks } from "@/lib/queries/tasks";
import { listProjects } from "@/lib/queries/projects";
import { listUnorganizedInbox } from "@/lib/queries/inbox";
import { listSomeday } from "@/lib/queries/someday";
import { listRecentReviews } from "@/lib/queries/review";
import { weekStartStr, formatShortDate } from "@/lib/domain/date";
import { TASK_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function ReviewPage() {
  const weekOf = weekStartStr();
  const tasks = listTasks();

  const inbox = listUnorganizedInbox().map((i) => ({ id: i.id, primary: i.content }));
  const projects = listProjects()
    .filter((p) => p.status === "active")
    .map((p) => ({
      id: p.id,
      primary: p.name,
      secondary: p.dueDate ? `期限 ${formatShortDate(p.dueDate)}` : undefined,
    }));
  const taskCounts = TASK_STATUSES.map((s) => ({
    label: s,
    count: tasks.filter((t) => t.status === s).length,
  }));
  const waiting = tasks
    .filter((t) => t.status === "待ち")
    .map((t) => ({
      id: t.id,
      primary: t.name,
      secondary: t.waitingFor
        ? `→ ${t.waitingFor}${t.waitingCheckDate ? `（${formatShortDate(t.waitingCheckDate)}）` : ""}`
        : undefined,
    }));
  const someday = listSomeday()
    .filter((s) => s.status === "active")
    .map((s) => ({ id: s.id, primary: s.content }));
  const recentReviews = listRecentReviews();

  return (
    <PageShell title="週次レビュー">
      <ReviewView
        weekOf={weekOf}
        inbox={inbox}
        projects={projects}
        taskCounts={taskCounts}
        waiting={waiting}
        someday={someday}
        recentReviews={recentReviews}
      />
    </PageShell>
  );
}
