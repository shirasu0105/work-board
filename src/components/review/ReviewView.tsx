"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { saveWeeklyReview } from "@/lib/actions/review";
import { formatShortDate } from "@/lib/domain/date";
import type { WeeklyReview } from "@/lib/db/schema";

interface SummaryItem {
  id: string;
  primary: string;
  secondary?: string;
}

interface Props {
  weekOf: string;
  inbox: SummaryItem[];
  projects: SummaryItem[];
  taskCounts: { label: string; count: number }[];
  waiting: SummaryItem[];
  someday: SummaryItem[];
  recentReviews: WeeklyReview[];
}

interface SectionDef {
  key: string;
  title: string;
  href: string;
  body: ReactNode;
}

function ItemList({ items, empty }: { items: SummaryItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-ink-subtle">{empty}</p>;
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-2">
          <span className="text-ink">{it.primary}</span>
          {it.secondary && <span className="text-xs text-ink-tertiary">{it.secondary}</span>}
        </li>
      ))}
    </ul>
  );
}

export function ReviewView({
  weekOf,
  inbox,
  projects,
  taskCounts,
  waiting,
  someday,
  recentReviews,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const sections: SectionDef[] = [
    {
      key: "inbox",
      title: "1. Inbox を空にする",
      href: "/inbox",
      body: <ItemList items={inbox} empty="未整理はありません 🎉" />,
    },
    {
      key: "projects",
      title: "2. プロジェクトの進捗",
      href: "/projects",
      body: <ItemList items={projects} empty="進行中のプロジェクトはありません" />,
    },
    {
      key: "tasks",
      title: "3. タスクの棚卸し",
      href: "/tasks",
      body: (
        <div className="flex flex-wrap gap-2">
          {taskCounts.map((t) => (
            <Badge key={t.label} tone="neutral">
              {t.label} {t.count}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "waiting",
      title: "4. 待ちの確認",
      href: "/tasks",
      body: <ItemList items={waiting} empty="待ちのタスクはありません" />,
    },
    {
      key: "someday",
      title: "5. Someday の見直し",
      href: "/someday",
      body: <ItemList items={someday} empty="Someday はありません" />,
    },
    {
      key: "focus",
      title: "6. 来週の重点",
      href: "/tasks",
      body: (
        <Textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder="来週に集中することをメモ（任意・実施記録に保存されます）"
        />
      ),
    },
  ];

  function record() {
    setSaved(false);
    startTransition(async () => {
      const r = await saveWeeklyReview({ weekOf, note });
      if (r.ok) {
        setSaved(true);
        router.refresh();
      }
    });
  }

  const allChecked = sections.every((s) => s.key === "focus" || checked[s.key]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-subtle">
        対象週: {formatShortDate(weekOf)} の週。上から順に確認していきましょう。
      </p>

      {sections.map((s) => (
        <Card key={s.key}>
          <CardHeader>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              {s.key !== "focus" && (
                <input
                  type="checkbox"
                  checked={!!checked[s.key]}
                  onChange={(e) => setChecked((p) => ({ ...p, [s.key]: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
              )}
              {s.title}
            </label>
            <Link href={s.href} className="text-xs text-primary hover:underline">
              開く →
            </Link>
          </CardHeader>
          <CardBody>{s.body}</CardBody>
        </Card>
      ))}

      <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface px-4 py-3">
        <div className="text-sm">
          {saved ? (
            <span className="text-success">レビューを記録しました</span>
          ) : allChecked ? (
            <span className="text-ink-subtle">すべて確認済み。記録できます。</span>
          ) : (
            <span className="text-ink-tertiary">各セクションを確認してください。</span>
          )}
        </div>
        <Button onClick={record} disabled={pending}>
          {pending ? "記録中…" : "レビュー実施を記録"}
        </Button>
      </div>

      {recentReviews.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            実施履歴
          </h3>
          <ul className="text-sm text-ink-subtle">
            {recentReviews.map((r) => (
              <li key={r.id} className="py-0.5">
                {formatShortDate(r.weekOf)} の週 ・ {formatShortDate(r.reviewedAt)} 実施
                {r.note ? ` ・ ${r.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
