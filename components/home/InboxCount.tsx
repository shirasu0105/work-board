import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type InboxCountProps = {
  count: number;
};

/**
 * ホームの「Inbox 未整理件数」メトリックカード（要件書 §10.1 / DESIGN.md §4）。
 */
export function InboxCount({ count }: InboxCountProps) {
  return (
    <Card
      data-testid="home-inbox"
      className="flex items-center justify-between bg-paper-2"
    >
      <div>
        <div className="text-[12px] font-medium tracking-[0.04em] text-ink-3">
          INBOX 未整理
        </div>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span
            data-testid="home-inbox-count"
            className="text-[32px] font-bold leading-none text-ink"
          >
            {count}
          </span>
          <span className="text-[14px] text-ink-3">件</span>
        </div>
      </div>
      <Link
        href="/inbox"
        data-testid="home-inbox-link"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-[4px] px-3 py-2 text-[13px] font-medium transition-colors",
          "border-whisper bg-paper text-ink hover:bg-warm-gray-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
        )}
      >
        整理する →
      </Link>
    </Card>
  );
}
