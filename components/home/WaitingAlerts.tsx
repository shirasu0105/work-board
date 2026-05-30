import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { formatLocalDate } from "@/lib/date";
import type { TaskDTO } from "@/lib/types/task";

export type WaitingAlertsProps = {
  tasks: TaskDTO[];
};

/**
 * ホームの「確認予定日を迎えた待ち」セクション（要件書 §10.1）。
 * 確認予定日 <= 対象日 の未解除待ちタスクのみを表示する。
 */
export function WaitingAlerts({ tasks }: WaitingAlertsProps) {
  return (
    <Card data-testid="home-waitings">
      <CardHeader>
        <CardTitle>確認予定日を迎えた待ち</CardTitle>
        <span
          className="text-[12px] text-ink-3"
          data-testid="home-waitings-count"
        >
          {tasks.length} 件
        </span>
      </CardHeader>

      {tasks.length === 0 ? (
        <p
          data-testid="home-waitings-empty"
          className="rounded-[8px] bg-paper-2 px-3 py-4 text-center text-[13px] text-ink-3"
        >
          確認予定日を迎えた待ちはありません
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="home-waitings-list">
          {tasks.map((task) => (
            <li
              key={task.id}
              data-testid="home-waiting-item"
              data-task-id={task.id}
              className="flex items-start gap-3 rounded-[8px] border-whisper bg-[#fff8f3] px-3 py-2.5"
            >
              <span
                aria-hidden
                className="mt-0.5 text-[14px] text-[color:var(--accent)]"
              >
                ⏳
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[14px] text-ink">{task.title}</span>
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-2">
                  {task.waiting ? (
                    <>
                      <Chip>待ち相手: {task.waiting.partner}</Chip>
                      <span data-testid="home-waiting-days">
                        待ち日数 {task.waiting.waitingDays} 日
                      </span>
                      {task.waiting.reviewAt ? (
                        <span data-testid="home-waiting-review">
                          確認予定 {formatLocalDate(task.waiting.reviewAt)}
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
