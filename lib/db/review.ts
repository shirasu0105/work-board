import { prisma } from "./client";
import { listInboxItems } from "./inbox";
import { listSomedayItems } from "./someday";
import type { InboxItemDTO } from "@/lib/types/inbox";
import type { SomedayItemDTO } from "@/lib/types/someday";
import type { TaskDTO, TaskStatus } from "@/lib/types/task";
import { isTaskStatus } from "@/lib/types/task";
import { waitingDays } from "@/lib/date";

/**
 * 週次レビュー画面の集約データ（Phase 8 / 要件書 §10.13）。
 *
 * 6 ステップ（Inbox 整理 / 進行中プロジェクト確認 / 未完了タスク確認 /
 * 待ちタスク確認 / Someday 見直し / 来週の重点プロジェクト）に必要なデータを
 * 1 回の SSR でまとめて取得する。各ステップはクライアントで順次表示する。
 */

type TaskRelations = {
  category: { name: string };
  project: { name: string } | null;
  waitingState: {
    partner: string;
    reason: string;
    reviewAt: Date | null;
    startedAt: Date;
    endedAt: Date | null;
  } | null;
};

function toTaskDTO(t: {
  id: string;
  title: string;
  note: string | null;
  dueDate: Date | null;
  status: string;
  displayOrder: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  projectId: string | null;
} & TaskRelations): TaskDTO {
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

/** レビュー用プロジェクト要約（Next Action 有無を含む）。 */
export type ReviewProject = {
  id: string;
  name: string;
  categoryName: string;
  status: string;
  /** 未完了タスク（=Next Action 候補）が 1 件以上あるか */
  hasNextAction: boolean;
};

export type ReviewData = {
  inboxItems: InboxItemDTO[];
  /** 進行中（active）プロジェクト＋ Next Action 有無 */
  activeProjects: ReviewProject[];
  /** 未完了タスク（done 以外） */
  undoneTasks: TaskDTO[];
  /** 待ちタスク（status=waiting・未解除） */
  waitingTasks: TaskDTO[];
  /** Someday 一覧（open） */
  somedayItems: SomedayItemDTO[];
  /** 来週の重点プロジェクト選択肢（全プロジェクト） */
  allProjects: { id: string; name: string; categoryName: string }[];
};

const TASK_INCLUDE = {
  category: { select: { name: true } },
  project: { select: { name: true } },
  waitingState: true,
} as const;

/** 週次レビュー画面の初期表示データを取得する。 */
export async function getReviewData(): Promise<ReviewData> {
  const [
    inboxItems,
    somedayItems,
    activeProjectRows,
    undoneRows,
    waitingRows,
    allProjectRows,
  ] = await Promise.all([
    listInboxItems(),
    listSomedayItems(),
    // 進行中プロジェクト＋未完了タスク有無の判定用にタスク status を取る
    prisma.project.findMany({
      where: { status: "active" },
      include: {
        category: { select: { name: true } },
        tasks: { select: { status: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    }),
    // 未完了タスク
    prisma.task.findMany({
      where: { status: { not: "done" } },
      include: TASK_INCLUDE,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    }),
    // 待ちタスク（未解除）
    prisma.task.findMany({
      where: {
        status: "waiting",
        waitingState: { is: { endedAt: null } },
      },
      include: TASK_INCLUDE,
      orderBy: [{ updatedAt: "asc" }],
    }),
    // 来週の重点プロジェクト選択肢（全件）
    prisma.project.findMany({
      include: { category: { select: { name: true } } },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const activeProjects: ReviewProject[] = activeProjectRows.map((p) => ({
    id: p.id,
    name: p.name,
    categoryName: p.category.name,
    status: p.status,
    hasNextAction: p.tasks.some((t) => t.status !== "done"),
  }));

  return {
    inboxItems,
    activeProjects,
    undoneTasks: undoneRows.map(toTaskDTO),
    waitingTasks: waitingRows.map(toTaskDTO),
    somedayItems,
    allProjects: allProjectRows.map((p) => ({
      id: p.id,
      name: p.name,
      categoryName: p.category.name,
    })),
  };
}
