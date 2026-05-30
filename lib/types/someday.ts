/**
 * Someday / Maybe 関連の型定義とステータス enum 相当（Phase 8 / 要件書 §10.7）。
 *
 * 「今すぐやらないが将来的にやる可能性がある内容」を管理する簡易実装。
 * SQLite は enum を持たないため status は String 列に保存し、
 * `as const` のユニオン型で値を制約する。
 *
 * status:
 * - open     : 保留中（一覧に表示）
 * - promoted : タスク化済み
 * - dropped  : 取りやめ
 */

export const SOMEDAY_STATUSES = ["open", "promoted", "dropped"] as const;

export type SomedayStatus = (typeof SOMEDAY_STATUSES)[number];

export function isSomedayStatus(value: unknown): value is SomedayStatus {
  return (
    typeof value === "string" &&
    (SOMEDAY_STATUSES as readonly string[]).includes(value)
  );
}

/** API / Server から UI へ渡す Someday DTO。日時は ISO 文字列で正規化する。 */
export type SomedayItemDTO = {
  id: string;
  content: string;
  /** 理由（任意） */
  reason: string | null;
  /** 見直し日（任意・ISO 文字列） */
  reviewAt: string | null;
  status: SomedayStatus;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  categoryName: string;
};
