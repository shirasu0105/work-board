import { PageShell } from "@/components/layout/PageShell";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { getJournalPageData } from "@/lib/db/journal";
import { formatDateKeyLabel, isDateKey } from "@/lib/date";

// 日次ジャーナルは常に最新を SSR で取得する
export const dynamic = "force-dynamic";

type JournalPageProps = {
  // 開発用クエリ: ?date=YYYY-MM-DD で対象日を切り替えられる（既定は今日）。
  searchParams: Promise<{ date?: string }>;
};

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const { date: rawDate } = await searchParams;
  const dateOverride = rawDate && isDateKey(rawDate) ? rawDate : undefined;

  const data = await getJournalPageData(dateOverride);
  const dateLabel = formatDateKeyLabel(data.targetDate);

  return (
    <PageShell
      title={`日次ジャーナル — ${dateLabel}`}
      subtitle="今日のひとことを記録し、明日やることを選ぶ"
    >
      <JournalEditor data={data} />
    </PageShell>
  );
}
