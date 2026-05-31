import { PageShell } from "@/components/layout/PageShell";
import { JournalView } from "@/components/journal/JournalView";
import { listTasks } from "@/lib/queries/tasks";
import { getJournal } from "@/lib/queries/journal";
import { todayStr, addDaysStr } from "@/lib/domain/date";

export const dynamic = "force-dynamic";

export default function JournalPage() {
  const today = todayStr();
  const tomorrow = addDaysStr(today, 1);
  const journal = getJournal(today);
  const tasks = listTasks().filter((t) => t.status !== "完了");

  return (
    <PageShell title="日次ジャーナル">
      <JournalView
        journalDate={today}
        tomorrow={tomorrow}
        initialComment={journal?.todayComment ?? ""}
        tasks={tasks}
      />
    </PageShell>
  );
}
