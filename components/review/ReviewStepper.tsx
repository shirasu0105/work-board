"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { CategoryDTO } from "@/lib/db/category";
import type { ReviewData } from "@/lib/db/review";
import { InboxReviewStep } from "./InboxReviewStep";
import { ProjectReviewStep } from "./ProjectReviewStep";
import { TaskReviewStep } from "./TaskReviewStep";
import { WaitingReviewStep } from "./WaitingReviewStep";
import { SomedayReviewStep } from "./SomedayReviewStep";
import { NextWeekFocusStep } from "./NextWeekFocusStep";

export type ReviewStepperProps = {
  data: ReviewData;
  categories: CategoryDTO[];
};

type StepDef = {
  key: string;
  label: string;
  /** 左ペインに出す件数ヒント（任意） */
  count?: number;
  render: () => ReactNode;
};

/**
 * 週次レビュー 6 ステップのステッパー（要件 §10.13.3）。
 *
 * 左ペイン: ステップリスト（クリックで移動・完了マークで取り消し線）。
 * 右ペイン: 現在ステップの詳細。「前へ / 次へ」で順次進行できる。
 * 1024px 幅で横スクロールしないよう lg で 2 カラム、それ未満は縦積み。
 */
export function ReviewStepper({ data, categories }: ReviewStepperProps) {
  const steps: StepDef[] = [
    {
      key: "inbox",
      label: "Inbox 整理",
      count: data.inboxItems.length,
      render: () => <InboxReviewStep items={data.inboxItems} />,
    },
    {
      key: "projects",
      label: "進行中プロジェクト確認",
      count: data.activeProjects.length,
      render: () => (
        <ProjectReviewStep
          initialProjects={data.activeProjects}
          categories={categories}
        />
      ),
    },
    {
      key: "tasks",
      label: "未完了タスク確認",
      count: data.undoneTasks.length,
      render: () => <TaskReviewStep tasks={data.undoneTasks} />,
    },
    {
      key: "waiting",
      label: "待ちタスク確認",
      count: data.waitingTasks.length,
      render: () => <WaitingReviewStep tasks={data.waitingTasks} />,
    },
    {
      key: "someday",
      label: "Someday 見直し",
      count: data.somedayItems.length,
      render: () => (
        <SomedayReviewStep
          initialItems={data.somedayItems}
          categories={categories}
        />
      ),
    },
    {
      key: "nextweek",
      label: "来週の重点プロジェクト",
      render: () => <NextWeekFocusStep projects={data.allProjects} />,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const active = steps[activeIndex];

  const toggleComplete = (index: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div
      data-testid="review-stepper"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]"
    >
      {/* 左ペイン: ステップリスト */}
      <nav
        aria-label="週次レビューのステップ"
        data-testid="review-step-list"
        className="flex flex-col gap-1.5 rounded-[12px] border-whisper bg-paper p-3 shadow-card"
      >
        <p className="mb-1 px-1 text-[12px] font-semibold text-ink-2">
          ステップ（{completed.size} / {steps.length} 完了）
        </p>
        <ol className="flex flex-col gap-1">
          {steps.map((s, i) => {
            const isActive = i === activeIndex;
            const isDone = completed.has(i);
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-current={isActive ? "step" : undefined}
                  data-testid="review-step-item"
                  data-step={s.key}
                  data-active={isActive}
                  data-completed={isDone}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus",
                    isActive
                      ? "bg-accent-bg text-ink font-semibold"
                      : "text-ink-2 hover:bg-paper-2"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none",
                      isDone
                        ? "bg-[#e8f7eb] text-[color:var(--success)]"
                        : isActive
                          ? "bg-accent text-paper"
                          : "bg-paper-2 text-ink-3"
                    )}
                  >
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      isDone && "text-ink-3 line-through"
                    )}
                  >
                    {s.label}
                  </span>
                  {typeof s.count === "number" ? (
                    <span className="shrink-0 text-[11px] text-ink-3">
                      {s.count}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* 右ペイン: 現在ステップ詳細 */}
      <section
        data-testid="review-step-detail"
        data-step={active.key}
        className="flex min-w-0 flex-col gap-4 rounded-[12px] border-whisper bg-paper p-5 shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            className="text-[18px] font-semibold leading-tight text-ink"
            data-testid="review-step-title"
          >
            {activeIndex + 1}. {active.label}
          </h2>
          <label className="flex items-center gap-2 text-[12px] text-ink-2">
            <input
              type="checkbox"
              checked={completed.has(activeIndex)}
              onChange={() => toggleComplete(activeIndex)}
              data-testid="review-step-complete"
              className="h-4 w-4 accent-[color:var(--accent)] cursor-pointer"
            />
            このステップを完了にする
          </label>
        </div>

        <div className="min-w-0">{active.render()}</div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-[color:var(--border-whisper)] pt-4">
          <Button
            variant="secondary"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            data-testid="review-prev"
          >
            ← 前へ
          </Button>
          <Button
            variant="primary"
            disabled={activeIndex === steps.length - 1}
            onClick={() =>
              setActiveIndex((i) => Math.min(steps.length - 1, i + 1))
            }
            data-testid="review-next"
          >
            次へ →
          </Button>
        </div>
      </section>
    </div>
  );
}
