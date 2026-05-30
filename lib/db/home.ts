import type { Prisma } from "@prisma/client";
import { prisma } from "./client";
import type {
  ActiveProjectSummary,
  HomeData,
  RecentMemoSummary,
} from "@/lib/types/home";
import type { TaskDTO, TaskStatus } from "@/lib/types/task";
import { isTaskStatus } from "@/lib/types/task";
import { isMemoKind } from "@/lib/types/memo";
import {
  addDaysToKey,
  dateKeyToUtcDate,
  isDateKey,
  todayKey,
  waitingDays,
} from "@/lib/date";
import { getSelectedTaskIdsForDate } from "./journal";

/**
 * ホーム画面の集約クエリ群（Phase 7 / 要件書 §10.1）。
 *
 * - 「今日やること」は前日（対象日 - 1）の日次ジャーナルで選択したタスク。
 *   完了済みでも表示し、UI 側で取り消し線にする（要件書 §10.1.1 / 受入基準）。
 * - 「確認予定日を迎えた待ち」は reviewAt <= 対象日末 の未解除待ち。
 * - 集約は Promise.all で並列に発行し、各クエリは include / where で
 *   1 回にまとめて N+1 を避ける。
 */

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
 * ホーム集約データを取得する。
 *
 * @param dateKey 表示対象日の日付キー（YYYY-MM-DD）。省略時は今日。
 *                Verifier が翌日のホームを再現できるよう、開発用クエリで差し替え可能。
 */
export async function getHomeData(dateKey?: string): Promise<HomeData> {
  const targetDate = dateKey && isDateKey(dateKey) ? dateKey : todayKey();
  // 「今日やること」= 前日のジャーナルで選んだタスク
  const prevDate = addDaysToKey(targetDate, -1);

  // 確認予定日 <= 対象日 の判定境界（対象日の翌日 00:00 UTC 未満）
  const reviewBoundary = dateKeyToUtcDate(addDaysToKey(targetDate, 1));

  const selectedTaskIds = await getSelectedTaskIdsForDate(prevDate);

  const [
    todayTaskRows,
    dueWaitingRows,
    inboxCount,
    projectRows,
    memoRows,
  ] = await Promise.all([
    // 今日やること: 前日ジャーナルの選択タスク（完了含む。表示順を保つ）
    selectedTaskIds.length > 0
      ? prisma.task.findMany({
          where: { id: { in: selectedTaskIds } },
          include: TASK_INCLUDE,
        })
      : Promise.resolve([] as TaskWithRelations[]),
    // 確認予定日を迎えた待ち: status=waiting・未解除・reviewAt<=対象日
    prisma.task.findMany({
      where: {
        status: "waiting",
        waitingState: {
          is: {
            endedAt: null,
            reviewAt: { not: null, lt: reviewBoundary },
          },
        },
      },
      include: TASK_INCLUDE,
      orderBy: [{ updatedAt: "asc" }],
    }),
    // Inbox 未整理件数
    prisma.inboxItem.count({ where: { status: "pending" } }),
    // 進行中プロジェクト（status=active）＋進捗集計用にタスクのステータスだけ取る
    prisma.project.findMany({
      where: { status: "active" },
      include: {
        category: { select: { name: true } },
        tasks: { select: { status: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    }),
    // 最近のメモ（更新日時の新しい順、上位 5 件）
    prisma.memo.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
      select: { id: true, title: true, kind: true, updatedAt: true },
    }),
  ]);

  // 今日やることは選択 ID の順序を保つ（findMany は順不同のため並べ直す）
  const todayMap = new Map(todayTaskRows.map((t) => [t.id, t]));
  const todayTasks: TaskDTO[] = selectedTaskIds
    .map((id) => todayMap.get(id))
    .filter((t): t is TaskWithRelations => Boolean(t))
    .map(toTaskDTO);

  const dueWaitings: TaskDTO[] = dueWaitingRows.map(toTaskDTO);

  const activeProjects: ActiveProjectSummary[] = projectRows.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "done").length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    return {
      id: p.id,
      name: p.name,
      categoryName: p.category.name,
      progress,
    };
  });

  const recentMemos: RecentMemoSummary[] = memoRows.map((m) => ({
    id: m.id,
    title: m.title,
    kind: isMemoKind(m.kind) ? m.kind : "meeting",
    updatedAt: m.updatedAt.toISOString(),
  }));

  return {
    targetDate,
    todayTasks,
    dueWaitings,
    inboxCount,
    activeProjects,
    recentMemos,
  };
}
