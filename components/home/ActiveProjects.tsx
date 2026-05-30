import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ActiveProjectSummary } from "@/lib/types/home";

export type ActiveProjectsProps = {
  projects: ActiveProjectSummary[];
};

/**
 * ホームの「進行中プロジェクト一覧」セクション（要件書 §10.1）。
 * status=進行中（active）のプロジェクトを進捗バー付きで表示する。
 */
export function ActiveProjects({ projects }: ActiveProjectsProps) {
  return (
    <Card data-testid="home-projects">
      <CardHeader>
        <CardTitle className="text-[16px]">進行中プロジェクト</CardTitle>
        <span
          className="text-[12px] text-ink-3"
          data-testid="home-projects-count"
        >
          {projects.length} 件
        </span>
      </CardHeader>

      {projects.length === 0 ? (
        <p
          data-testid="home-projects-empty"
          className="rounded-[8px] bg-paper-2 px-3 py-4 text-center text-[13px] text-ink-3"
        >
          進行中のプロジェクトはありません
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="home-projects-list">
          {projects.map((p) => (
            <li
              key={p.id}
              data-testid="home-project-item"
              data-project-id={p.id}
            >
              <Link
                href={`/tasks?projectId=${encodeURIComponent(p.id)}`}
                className="block rounded-[8px] border-whisper bg-paper px-3 py-2.5 hover:bg-warm-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">
                    ▸ {p.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-3">
                    {p.progress}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-ink-3">
                  {p.categoryName}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
