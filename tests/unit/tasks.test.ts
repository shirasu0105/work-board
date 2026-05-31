import { describe, it, expect } from "vitest";
import { extractTodayTasks, extractWaitingToCheck } from "@/lib/domain/tasks";

const TODAY = "2026-05-31";

const tasks = [
  { id: "1", status: "未着手", plannedDate: "2026-05-31" },
  { id: "2", status: "完了", plannedDate: "2026-05-31" }, // 完了は除外
  { id: "3", status: "対応中", plannedDate: "2026-06-01" }, // 別日
  { id: "4", status: "対応中", plannedDate: null },
  { id: "5", status: "待ち", waitingCheckDate: "2026-05-30" }, // 期限到来
  { id: "6", status: "待ち", waitingCheckDate: "2026-06-05" }, // 未来
  { id: "7", status: "待ち", waitingCheckDate: null }, // 未設定
];

describe("extractTodayTasks", () => {
  it("未完了かつ planned_date が今日のものだけ", () => {
    expect(extractTodayTasks(tasks, TODAY).map((t) => t.id)).toEqual(["1"]);
  });
});

describe("extractWaitingToCheck", () => {
  it("待ち かつ check_date<=今日 のものだけ", () => {
    expect(extractWaitingToCheck(tasks, TODAY).map((t) => t.id)).toEqual(["5"]);
  });
});
