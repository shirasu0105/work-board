import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { TodayTasks } from "@/components/home/TodayTasks";
import { WaitingAlerts } from "@/components/home/WaitingAlerts";
import { InboxCount } from "@/components/home/InboxCount";
import { ActiveProjects } from "@/components/home/ActiveProjects";
import { RecentMemos } from "@/components/home/RecentMemos";
import { getHomeData } from "@/lib/db/home";
import { formatDateKeyLabel, isDateKey } from "@/lib/date";
import { cn } from "@/lib/cn";

// ホームは常に最新の集約を SSR で取得する
export const dynamic = "force-dynamic";

type HomePageProps = {
  // 開発用クエリ: ?date=YYYY-MM-DD で「対象日」のホームを直接表示できる。
  // 検証シナリオ3（明日やることがホームに反映）を Verifier が再現するための仕組み。
  searchParams: Promise<{ date?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { date: rawDate } = await searchParams;
  const dateOverride =
    rawDate && isDateKey(rawDate) ? rawDate : undefined;

  const home = await getHomeData(dateOverride);
  const dateLabel = formatDateKeyLabel(home.targetDate);

  return (
    <PageShell
      title={`今日 — ${dateLabel}`}
      subtitle="今日やること・待ち・Inbox・進行中プロジェクト・最近のメモを一望する画面"
      topBarRight={
        <span
          data-testid="home-date"
          data-date={home.targetDate}
          className="text-[12px] font-medium text-ink-2"
        >
          {dateLabel}
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* 左: 今日やること ＋ 待ち */}
        <div className="flex flex-col gap-4">
          <TodayTasks tasks={home.todayTasks} />
          <WaitingAlerts tasks={home.dueWaitings} />
        </div>

        {/* 右: Inbox 件数・プロジェクト・メモ・導線 */}
        <div className="flex flex-col gap-4">
          <InboxCount count={home.inboxCount} />
          <ActiveProjects projects={home.activeProjects} />
          <RecentMemos memos={home.recentMemos} />

          <div className="flex gap-2" data-testid="home-routines">
            <Link
              href="/journal"
              data-testid="home-journal-link"
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-[4px] px-4 py-2 text-[14px] font-medium transition-colors",
                "border-whisper bg-paper-2 text-ink hover:bg-warm-gray-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
              )}
            >
              ☾ 日次ジャーナル
            </Link>
            <Link
              href="/review"
              data-testid="home-review-link"
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-[4px] px-4 py-2 text-[14px] font-medium transition-colors",
                "border-whisper bg-paper-2 text-ink hover:bg-warm-gray-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
              )}
            >
              ↻ 週次レビュー
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
