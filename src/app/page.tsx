import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TodayBoard } from "@/components/home/TodayBoard";
import { listTasks } from "@/lib/queries/tasks";
import { listProjects } from "@/lib/queries/projects";
import { listUnorganizedInbox } from "@/lib/queries/inbox";
import { listMemos } from "@/lib/queries/memos";
import { getJournal } from "@/lib/queries/journal";
import { extractTodayTasks, extractWaitingToCheck } from "@/lib/domain/tasks";
import { todayStr, formatShortDate } from "@/lib/domain/date";
import { memoTypeLabel } from "@/lib/memoTypes";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const today = todayStr();
  const allTasks = listTasks();

  const todayTasks = extractTodayTasks(allTasks, today);
  const todayIds = new Set(todayTasks.map((t) => t.id));
  const candidates = allTasks.filter((t) => t.status !== "完了" && !todayIds.has(t.id));
  const waitingToCheck = extractWaitingToCheck(allTasks, today);

  const inboxCount = listUnorganizedInbox().length;
  const activeProjects = listProjects().filter((p) => p.status === "active");
  const recentMemos = listMemos().slice(0, 5);
  const journal = getJournal(today);

  return (
    <PageShell title="ホーム">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* 左: 今日やること（主役） */}
        <section>
          <TodayBoard today={today} todayTasks={todayTasks} candidates={candidates} />
        </section>

        {/* 右: サイドカード */}
        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <span className="text-sm font-semibold text-ink">確認予定の待ち</span>
              <Badge tone={waitingToCheck.length ? "warning" : "neutral"}>
                {waitingToCheck.length}
              </Badge>
            </CardHeader>
            <CardBody>
              {waitingToCheck.length === 0 ? (
                <p className="text-sm text-ink-subtle">確認予定日を迎えた待ちはありません。</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {waitingToCheck.map((t) => (
                    <li key={t.id} className="text-sm">
                      <span className="text-ink">{t.name}</span>
                      <span className="ml-1 text-xs text-warning">
                        → {t.waitingFor}（{formatShortDate(t.waitingCheckDate)}）
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/tasks" className="mt-2 inline-block text-xs text-primary hover:underline">
                タスクへ →
              </Link>
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/inbox">
              <Card className="h-full transition-colors hover:border-hairline-strong">
                <CardBody>
                  <p className="text-xs text-ink-subtle">Inbox未整理</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{inboxCount}</p>
                </CardBody>
              </Card>
            </Link>
            <Link href="/projects">
              <Card className="h-full transition-colors hover:border-hairline-strong">
                <CardBody>
                  <p className="text-xs text-ink-subtle">進行中PJ</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">
                    {activeProjects.length}
                  </p>
                </CardBody>
              </Card>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <span className="text-sm font-semibold text-ink">最近のメモ</span>
              <Link href="/memos" className="text-xs text-primary hover:underline">
                一覧 →
              </Link>
            </CardHeader>
            <CardBody>
              {recentMemos.length === 0 ? (
                <p className="text-sm text-ink-subtle">メモはまだありません。</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {recentMemos.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <Badge tone="neutral">{memoTypeLabel(m.memoType)}</Badge>
                      <Link href={`/memos/${m.id}`} className="truncate text-ink hover:underline">
                        {m.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/journal">
              <Card className="h-full transition-colors hover:border-hairline-strong">
                <CardBody>
                  <p className="text-xs text-ink-subtle">日次ジャーナル</p>
                  <p className="mt-1 text-sm text-ink">
                    {journal ? "記入済み" : "未記入"}
                  </p>
                </CardBody>
              </Card>
            </Link>
            <Link href="/review">
              <Card className="h-full transition-colors hover:border-hairline-strong">
                <CardBody>
                  <p className="text-xs text-ink-subtle">週次レビュー</p>
                  <p className="mt-1 text-sm text-ink">開く →</p>
                </CardBody>
              </Card>
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
