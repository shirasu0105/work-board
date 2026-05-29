/**
 * Inbox 関連の型定義とステータス enum 相当（要件書 §10.2）。
 *
 * status:
 * - pending  : 未整理（一覧に表示）
 * - processed: タスク化 / プロジェクト化で整理済み（一覧から除外）
 * - archived : Someday 化で整理済み（一覧から除外）
 */

export const INBOX_STATUSES = [
  "pending",
  "processed",
  "archived",
] as const;

export type InboxStatus = (typeof INBOX_STATUSES)[number];

export function isInboxStatus(value: unknown): value is InboxStatus {
  return (
    typeof value === "string" &&
    (INBOX_STATUSES as readonly string[]).includes(value)
  );
}

/** Inbox 振り分け先（タスク化 / プロジェクト化 / Someday 化）。 */
export const INBOX_CONVERT_TARGETS = [
  "task",
  "project",
  "someday",
] as const;

export type InboxConvertTarget = (typeof INBOX_CONVERT_TARGETS)[number];

export function isInboxConvertTarget(
  value: unknown
): value is InboxConvertTarget {
  return (
    typeof value === "string" &&
    (INBOX_CONVERT_TARGETS as readonly string[]).includes(value)
  );
}

/** API / Server から UI へ渡す Inbox DTO。日時は ISO 文字列で正規化する。 */
export type InboxItemDTO = {
  id: string;
  content: string;
  status: InboxStatus;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
};
