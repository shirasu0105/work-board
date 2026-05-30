import type { Prisma } from "@prisma/client";
import { prisma } from "./client";
import type { JournalDTO, JournalPageData } from "@/lib/types/journal";
import type { TaskDTO, TaskStatus } from "@/lib/types/task";
import { isTaskStatus } from "@/lib/types/task";
import {
  addDaysToKey,
  dateKeyToUtcDate,
  isDateKey,
  toDateKeyFromUtc,
  todayKey,
  waitingDays,
} from "@/lib/date";

/**
 * 日次ジャーナル CRUD のサーバー側関数群（Phase 7 / 要件書 §10.12）。
 *
 * - 対象日（targetDate）は「暦日」に対して一意（schema の @unique）。
 *   日付キー（YYYY-MM-DD）を受け取り、UTC 00:00 の Date として保存する。
 * - 「今日のひとこと（oneLiner）」と「明日やること（selectedTaskIds）」が必須入力（§13.1）。
 * - 保存は UPSERT。同じ対象日に複数ジャーナルは作れない。
 * - 選択タスクは中間テーブル JournalSelection で管理し、保存ごとに洗い替える。
 */

type JournalWithSelections = Prisma.DailyJournalGetPayload<{
  include: { selections: { select: { taskId: true } } };
}>;

const JOURNAL_INCLUDE = {
  selections: { select: { taskId: true } },
} as const;

function toDTO(j: JournalWithSelections): JournalDTO {
  return {
    id: j.id,
    targetDate: toDateKeyFromUtc(j.targetDate),
    oneLiner: j.oneLiner,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    selectedTaskIds: j.selections.map((s) => s.taskId),
  };
}

/** 対象日（日付キー）のジャーナルを取得。未作成なら null。 */
export async function getJournalByDate(
  dateKey: string
): Promise<JournalDTO | null> {
  if (!isDateKey(dateKey)) {
    return null;
  }
  const row = await prisma.dailyJournal.findUnique({
    where: { targetDate: dateKeyToUtcDate(dateKey) },
    include: JOURNAL_INCLUDE,
  });
  return row ? toDTO(row) : null;
}

/**
 * 対象日 + 1 日のジャーナルで「明日やること」に選ばれたタスク ID 群を返す。
 *
 * ホームの「今日やること」は、前日（= 表示日の前日）のジャーナルで
 * 選択された未完了タスクを表示するため、この関数で前日分の選択を引く。
 */
export async function getSelectedTaskIdsForDate(
  dateKey: string
): Promise<string[]> {
  const journal = await getJournalByDate(dateKey);
  return journal?.selectedTaskIds ?? [];
}

export type SaveJournalInput = {
  /** 対象日の日付キー（YYYY-MM-DD） */
  targetDate: string;
  /** 今日のひとこと（必須） */
  oneLiner: string;
  /** 明日やること（必須・1 件以上） */
  selectedTaskIds: string[];
};

/**
 * 日次ジャーナルを保存（UPSERT）。
 *
 * - oneLiner は必須（空不可）。
 * - selectedTaskIds は必須（1 件以上）。要件書 §13.1。
 * - 選択タスクは存在チェックのうえ洗い替える（重複は除去）。
 */
export async function saveJournal(
  input: SaveJournalInput
): Promise<JournalDTO> {
  if (!isDateKey(input.targetDate)) {
    throw new Error("対象日の日付形式が不正です");
  }
  const oneLiner = input.oneLiner.trim();
  if (!oneLiner) {
    throw new Error("今日のひとことは必須です");
  }

  // 重複除去
  const uniqueTaskIds = Array.from(new Set(input.selectedTaskIds ?? []));
  if (uniqueTaskIds.length === 0) {
    throw new Error("明日やることを 1 件以上選択してください");
  }

  // 選択タスクの存在チェック（不正 ID 弾き）
  const existing = await prisma.task.findMany({
    where: { id: { in: uniqueTaskIds } },
    select: { id: true },
  });
  if (existing.length !== uniqueTaskIds.length) {
    throw new Error("存在しないタスクが選択されています");
  }

  const targetDate = dateKeyToUtcDate(input.targetDate);

  // UPSERT + 選択の洗い替えをトランザクションで実施
  const saved = await prisma.$transaction(async (tx) => {
    const journal = await tx.dailyJournal.upsert({
      where: { targetDate },
      create: { targetDate, oneLiner },
      update: { oneLiner },
    });

    // 既存選択を全削除して入れ直す（洗い替え）
    await tx.journalSelection.deleteMany({
      where: { journalId: journal.id },
    });
    await tx.journalSelection.createMany({
      data: uniqueTaskIds.map((taskId) => ({
        journalId: journal.id,
        taskId,
      })),
    });

    return tx.dailyJournal.findUniqueOrThrow({
      where: { id: journal.id },
      include: JOURNAL_INCLUDE,
    });
  });

  return toDTO(saved);
}

// ---------------------------------------------------------------------------
// ジャーナル画面の初期表示データ
// ---------------------------------------------------------------------------

type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    category: { select: { name: true } };
    project: { select: { name: true } };
    waitingState: true;
  };
}>;

const TASK_INCLUDE = {
  category: { select: { name: true } },
  project: { select: { name: true } },
  waitingState: true,
} as const;

function toTaskDTO(t: TaskWithRelations): TaskDTO {
  const status: TaskStatus = isTaskStatus(t.status) ? t.status : "todo";
  const w = t.waitingState;
  const waiting =
    status === "waiting" && w && w.endedAt === null
      ? {
          partner: w.partner,
          reason: w.reason,
          reviewAt: w.reviewAt ? w.reviewAt.toISOString() : null,
          startedAt: w.startedAt.toISOString(),
          waitingDays: waitingDays(w.startedAt),
        }
      : null;

  return {
    id: t.id,
    title: t.title,
    note: t.note,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    status,
    displayOrder: t.displayOrder,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    categoryId: t.categoryId,
    categoryName: t.category.name,
    projectId: t.projectId,
    projectName: t.project?.name ?? null,
    waiting,
  };
}

/**
 * 日次ジャーナル画面の初期表示データを取得する。
 *
 * - undoneTasks: 未完了タスク（明日やること候補）
 * - doneTasks: 対象日に完了したタスク（completedAt が対象日の暦日）
 * - journal: 既存の対象日ジャーナル（復元用、未作成なら null）
 *
 * @param dateKey 対象日の日付キー。省略時は今日。
 */
export async function getJournalPageData(
  dateKey?: string
): Promise<JournalPageData> {
  const targetDate = dateKey && isDateKey(dateKey) ? dateKey : todayKey();

  // 対象日の暦日範囲（UTC 00:00 以上 ～ 翌日 00:00 未満）で完了タスクを抽出
  const dayStart = dateKeyToUtcDate(targetDate);
  const dayEnd = dateKeyToUtcDate(addDaysToKey(targetDate, 1));

  const [journal, undoneRows, doneRows] = await Promise.all([
    getJournalByDate(targetDate),
    prisma.task.findMany({
      where: { status: { not: "done" } },
      include: TASK_INCLUDE,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.task.findMany({
      where: {
        status: "done",
        completedAt: { gte: dayStart, lt: dayEnd },
      },
      include: TASK_INCLUDE,
      orderBy: [{ completedAt: "desc" }],
    }),
  ]);

  return {
    targetDate,
    journal,
    undoneTasks: undoneRows.map(toTaskDTO),
    doneTasks: doneRows.map(toTaskDTO),
  };
}
