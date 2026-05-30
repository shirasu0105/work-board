import type { Prisma } from "@prisma/client";
import { prisma } from "./client";
import { waitingDays } from "@/lib/date";
import {
  isWaitingReleaseStatus,
  type WaitingStateDTO,
  type WaitingTaskDTO,
  type WaitingReleaseStatus,
} from "@/lib/types/waiting";
import { isTaskStatus, type TaskStatus } from "@/lib/types/task";

/**
 * 待ち状態（WaitingState）のサーバー側関数群（Phase 5・要件書 §10.6）。
 *
 * - 待ち化: Task.status を "waiting" にし、WaitingState を作成（待ち相手・理由必須）
 * - 待ち解除: WaitingState.endedAt を打刻し、Task.status を todo/doing に戻す
 * - いずれも Task と WaitingState を 1 トランザクションで整合させる
 *
 * 「現在待ち中」の定義 = WaitingState が存在し endedAt が null。
 */

type WaitingStateRow = Prisma.WaitingStateGetPayload<{
  // 関連 include なし（待ち状態テーブルの素のレコード）
  select: undefined;
}>;

function toDTO(w: WaitingStateRow): WaitingStateDTO {
  return {
    id: w.id,
    taskId: w.taskId,
    partner: w.partner,
    reason: w.reason,
    reviewAt: w.reviewAt ? w.reviewAt.toISOString() : null,
    requestNote: w.requestNote,
    startedAt: w.startedAt.toISOString(),
    endedAt: w.endedAt ? w.endedAt.toISOString() : null,
    replyNote: w.replyNote,
    updatedAt: w.updatedAt.toISOString(),
  };
}

export type StartWaitingInput = {
  partner: string;
  reason: string;
  /** 確認予定日（任意・YYYY-MM-DD or ISO） */
  reviewAt?: string | null;
  /** 依頼メモ（任意） */
  requestNote?: string | null;
};

/**
 * タスクを待ち状態にする。
 * - 待ち相手・待ち理由は必須（空はエラー）
 * - Task.status を "waiting" に変更
 * - 既存の待ち状態レコードがあれば作り直す（前回の解除済みレコードは履歴として残さず上書き）
 */
export async function startWaiting(
  taskId: string,
  input: StartWaitingInput
): Promise<WaitingStateDTO> {
  if (!taskId) {
    throw new Error("taskId は必須です");
  }
  const partner = input.partner?.trim() ?? "";
  const reason = input.reason?.trim() ?? "";
  if (!partner) {
    throw new Error("待ち相手は必須です");
  }
  if (!reason) {
    throw new Error("待ち理由は必須です");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true },
  });
  if (!task) {
    throw new Error("該当タスクが見つかりません");
  }

  const reviewAt = parseDate(input.reviewAt);
  const requestNote = normalizeText(input.requestNote);

  const result = await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { status: "waiting", completedAt: null },
    });
    // 1:1（taskId @unique）。upsert で待ち化を冪等にする。
    return tx.waitingState.upsert({
      where: { taskId },
      create: {
        taskId,
        partner,
        reason,
        reviewAt,
        requestNote,
        startedAt: new Date(),
        endedAt: null,
        replyNote: null,
      },
      update: {
        partner,
        reason,
        reviewAt,
        requestNote,
        startedAt: new Date(),
        endedAt: null,
        replyNote: null,
      },
    });
  });

  return toDTO(result);
}

export type ReleaseWaitingInput = {
  /** 解除後ステータス（未着手 or 対応中）。初期値 "todo"。 */
  nextStatus?: WaitingReleaseStatus;
  /** 返答メモ（任意） */
  replyNote?: string | null;
};

/**
 * タスクの待ち状態を解除する。
 * - 解除後ステータスを "todo"（初期値）または "doing" に設定
 * - WaitingState.endedAt を打刻し replyNote を保存（待ち日数表示は消える）
 */
export async function releaseWaiting(
  taskId: string,
  input: ReleaseWaitingInput = {}
): Promise<{ taskId: string; status: TaskStatus }> {
  if (!taskId) {
    throw new Error("taskId は必須です");
  }

  const nextStatus: WaitingReleaseStatus = input.nextStatus ?? "todo";
  if (!isWaitingReleaseStatus(nextStatus)) {
    throw new Error("解除後ステータスは「未着手」または「対応中」のみ選べます");
  }

  const existing = await prisma.waitingState.findUnique({
    where: { taskId },
    select: { id: true, endedAt: true },
  });
  if (!existing) {
    throw new Error("待ち状態が見つかりません");
  }

  const replyNote = normalizeText(input.replyNote);

  await prisma.$transaction(async (tx) => {
    await tx.waitingState.update({
      where: { taskId },
      data: { endedAt: new Date(), replyNote },
    });
    await tx.task.update({
      where: { id: taskId },
      data: { status: nextStatus },
    });
  });

  return { taskId, status: nextStatus };
}

/** タスクの現在の待ち状態（解除済みは null）。 */
export async function getActiveWaiting(
  taskId: string
): Promise<WaitingStateDTO | null> {
  if (!taskId) return null;
  const row = await prisma.waitingState.findUnique({ where: { taskId } });
  if (!row || row.endedAt !== null) return null;
  return toDTO(row);
}

/**
 * 現在待ち中のタスク一覧（要件書 §10.6.4 表示要件）。
 * Task.status === "waiting" かつ WaitingState.endedAt が null のものを
 * 待ち開始日が古い順に並べる。各行に待ち日数を付与する。
 */
export async function listWaitingTasks(
  now: Date = new Date()
): Promise<WaitingTaskDTO[]> {
  const rows = await prisma.waitingState.findMany({
    where: { endedAt: null, task: { status: "waiting" } },
    orderBy: { startedAt: "asc" },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          category: { select: { name: true } },
          project: { select: { name: true } },
        },
      },
    },
  });

  return rows.map((w) => ({
    taskId: w.taskId,
    title: w.task.title,
    categoryName: w.task.category.name,
    projectName: w.task.project?.name ?? null,
    status: isTaskStatus(w.task.status) ? w.task.status : "waiting",
    partner: w.partner,
    reason: w.reason,
    reviewAt: w.reviewAt ? w.reviewAt.toISOString() : null,
    requestNote: w.requestNote,
    startedAt: w.startedAt.toISOString(),
    waitingDays: waitingDays(w.startedAt, now),
  }));
}

function parseDate(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    throw new Error("確認予定日の日付形式が不正です");
  }
  return d;
}

function normalizeText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
