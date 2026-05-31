import { randomUUID } from "node:crypto";

/** 新規エンティティ用の文字列ID（uuid）。 */
export function newId(): string {
  return randomUUID();
}

/** 現在時刻の ISO 文字列。created_at / updated_at 共通で使用。 */
export function nowIso(): string {
  return new Date().toISOString();
}
