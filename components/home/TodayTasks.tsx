"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { StatusBadge } from "@/components/task/StatusBadge";
import { cn } from "@/lib/cn";
import type { TaskDTO } from "@/lib/types/task";

export type TodayTasksProps = {
  tasks: TaskDTO[];
};

/**
 * ホームの「今日やること」セクション（要件書 §10.1）。
 *
 * 前日の日次ジャーナルで選んだタスクを表示する。チェックボックスで完了に切り替えられ、
 * 完了済みは取り消し線で表現する（受入基準）。なければ「未設定」を表示。
 */
export function TodayTasks({ tasks: initial }: TodayTasksProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskDTO[]>(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleDone = useCallback(
    async (task: TaskDTO) => {
      const nextStatus = task.status === "done" ? "todo" : "done";
      setBusyId(task.id);
      setError(null);
      try {
        const res = await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "ステータス更新に失敗しました");
        }
        const data = (await res.json()) as { task: TaskDTO };
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? data.task : t))
        );
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "更新に失敗しました");
      } finally {
        setBusyId(null);
      }
    },
    [router]
  );

  return (
    <Card data-testid="home-today">
      <CardHeader>
        <CardTitle>今日やること</CardTitle>
        <span className="text-[12px] text-ink-3" data-testid="home-today-count">
          {tasks.length} 件
        </span>
      </CardHeader>

      {error ? (
        <div
          role="alert"
          className="mb-2 rounded-[8px] border-whisper bg-[color:var(--accent-bg)] px-3 py-2 text-[12px] text-[color:var(--warning)]"
        >
          {error}
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <p
          data-testid="home-today-empty"
          className="rounded-[8px] bg-paper-2 px-3 py-4 text-center text-[13px] text-ink-3"
        >
          未設定（前日の日次ジャーナルで「明日やること」を選ぶと表示されます）
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="home-today-list">
          {tasks.map((task) => {
            const done = task.status === "done";
            return (
              <li
                key={task.id}
                data-testid="home-today-item"
                data-task-id={task.id}
                data-done={done}
                className="flex items-start gap-3 rounded-[8px] border-whisper bg-paper px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={done}
                  disabled={busyId === task.id}
                  onChange={() => void toggleDone(task)}
                  data-testid="home-today-checkbox"
                  aria-label={`${task.title} を完了にする`}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--accent)]"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span
                    data-testid="home-today-title"
                    className={cn(
                      "text-[14px] text-ink",
                      done && "text-ink-3 line-through"
                    )}
                  >
                    {task.title}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip>{task.categoryName}</Chip>
                    {task.projectName ? (
                      <Chip>▸ {task.projectName}</Chip>
                    ) : null}
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
