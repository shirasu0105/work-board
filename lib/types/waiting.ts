/**
 * 待ち状態（WaitingState）関連の型（Phase 5・要件書 §10.6 / §13.1）。
 *
 * 待ちは「ステータス」ではなく Task のサブ状態。Task.status === "waiting" のとき、
 * 1:1 で WaitingState が紐づく。待ち相手・待ち理由は必須。
 */
import type { TaskStatus } from "./task";

/** 待ち解除後に選べるステータス（要件書 §10.6.3）。初期値は "todo"。 */
export const WAITING_RELEASE_STATUSES = ["todo", "doing"] as const;
export type WaitingReleaseStatus = (typeof WAITING_RELEASE_STATUSES)[number];

export function isWaitingReleaseStatus(
  value: unknown
): value is WaitingReleaseStatus {
  return (
    typeof value === "string" &&
    (WAITING_RELEASE_STATUSES as readonly string[]).includes(value)
  );
}

/** 待ち状態の DTO。日時は ISO 文字列で正規化。 */
export type WaitingStateDTO = {
  id: string;
  taskId: string;
  partner: string;
  reason: string;
  /** 確認予定日（任意） */
  reviewAt: string | null;
  /** 依頼メモ（任意） */
  requestNote: string | null;
  startedAt: string;
  endedAt: string | null;
  replyNote: string | null;
  updatedAt: string;
};

/** 待ちタスク一覧の 1 行分（Task と現行 WaitingState の合成）。 */
export type WaitingTaskDTO = {
  taskId: string;
  title: string;
  categoryName: string;
  projectName: string | null;
  status: TaskStatus;
  partner: string;
  reason: string;
  reviewAt: string | null;
  requestNote: string | null;
  startedAt: string;
  /** 待ち日数（startedAt から本日までの暦日差、システム TZ 基準） */
  waitingDays: number;
};
