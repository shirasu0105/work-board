import { PageShell } from "@/components/layout/PageShell";
import { WaitingManager } from "@/components/task/WaitingManager";
import { listWaitingTasks } from "@/lib/db/waiting";

// 待ち日数は当日基準で算出するため、常に最新を SSR で取得する
export const dynamic = "force-dynamic";

export default async function WaitingTasksPage() {
  const items = await listWaitingTasks();

  return (
    <PageShell
      title="待ちタスク"
      subtitle="自分以外がボールを持っている状態のタスクを一覧で確認する"
    >
      <WaitingManager initialItems={items} />
    </PageShell>
  );
}
