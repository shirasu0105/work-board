import type { InboxItem } from "@prisma/client";
import { prisma } from "./client";
import { type InboxItemDTO } from "@/lib/types/inbox";

/**
 * Inbox CRUD のサーバー側関数群（Phase 4 / 要件書 §10.2）。
 *
 * - 一覧は status="pending"（未整理）のみを新しい順で返す
 * - 振り分け（タスク化 / プロジェクト化 / Someday 化）は呼び出し側で対象を作成したうえで
 *   `markProcessed` / `markArchived` を呼び、一覧から外す
 */

function toDTO(i: InboxItem): InboxItemDTO {
  return {
    id: i.id,
    content: i.content,
    status: i.status === "processed" || i.status === "archived"
      ? i.status
      : "pending",
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    processedAt: i.processedAt ? i.processedAt.toISOString() : null,
  };
}

/** 未整理（pending）の Inbox 一覧。新しい順（createdAt 降順）。 */
export async function listInboxItems(): Promise<InboxItemDTO[]> {
  const rows = await prisma.inboxItem.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDTO);
}

export async function getInboxItem(id: string): Promise<InboxItemDTO | null> {
  if (!id) return null;
  const row = await prisma.inboxItem.findUnique({ where: { id } });
  return row ? toDTO(row) : null;
}

/** Inbox 追加。内容のみ必須。status は pending で開始。 */
export async function createInboxItem(content: string): Promise<InboxItemDTO> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("内容は必須です");
  }
  const created = await prisma.inboxItem.create({
    data: { content: trimmed, status: "pending" },
  });
  return toDTO(created);
}

/** Inbox 内容の編集。 */
export async function updateInboxItem(
  id: string,
  content: string
): Promise<InboxItemDTO> {
  if (!id) {
    throw new Error("id は必須です");
  }
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("内容は必須です");
  }
  const updated = await prisma.inboxItem.update({
    where: { id },
    data: { content: trimmed },
  });
  return toDTO(updated);
}

/** Inbox 項目の物理削除（要件書 §10.2.3 削除）。 */
export async function deleteInboxItem(id: string): Promise<void> {
  if (!id) {
    throw new Error("id は必須です");
  }
  await prisma.inboxItem.delete({ where: { id } });
}

/**
 * タスク化 / プロジェクト化で整理済みにする。
 * 物理削除せず status を processed にして processedAt を打刻し、一覧から外す。
 */
export async function markInboxProcessed(
  id: string
): Promise<InboxItemDTO> {
  if (!id) {
    throw new Error("id は必須です");
  }
  const updated = await prisma.inboxItem.update({
    where: { id },
    data: { status: "processed", processedAt: new Date() },
  });
  return toDTO(updated);
}

/**
 * Someday 化で整理済みにする。
 * status を archived にして processedAt を打刻し、一覧から外す。
 */
export async function markInboxArchived(
  id: string
): Promise<InboxItemDTO> {
  if (!id) {
    throw new Error("id は必須です");
  }
  const updated = await prisma.inboxItem.update({
    where: { id },
    data: { status: "archived", processedAt: new Date() },
  });
  return toDTO(updated);
}
