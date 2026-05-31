import { describe, it, expect } from "vitest";
import {
  daysUntil,
  daysSince,
  todayStr,
  addDaysStr,
  weekStartStr,
  formatShortDate,
} from "@/lib/domain/date";

const TODAY = new Date(2026, 4, 31); // 2026-05-31（日曜）, ローカル

describe("daysUntil", () => {
  it("未来日は正、過去日は負、当日は0", () => {
    expect(daysUntil("2026-06-02", TODAY)).toBe(2);
    expect(daysUntil("2026-05-29", TODAY)).toBe(-2);
    expect(daysUntil("2026-05-31", TODAY)).toBe(0);
  });
  it("空/無効は null", () => {
    expect(daysUntil(null, TODAY)).toBeNull();
    expect(daysUntil("", TODAY)).toBeNull();
  });
});

describe("daysSince", () => {
  it("経過日数を返す", () => {
    expect(daysSince("2026-05-28", TODAY)).toBe(3);
    expect(daysSince("2026-05-31", TODAY)).toBe(0);
  });
});

describe("todayStr / addDaysStr", () => {
  it("ローカル日付を YYYY-MM-DD で返す", () => {
    expect(todayStr(TODAY)).toBe("2026-05-31");
  });
  it("n日後を返す（月跨ぎ）", () => {
    expect(addDaysStr("2026-05-31", 1)).toBe("2026-06-01");
    expect(addDaysStr("2026-05-31", -1)).toBe("2026-05-30");
  });
});

describe("weekStartStr", () => {
  it("週初日(月曜)を返す", () => {
    // 2026-05-31 は日曜 → 同週の月曜は 2026-05-25
    expect(weekStartStr(TODAY)).toBe("2026-05-25");
    // 2026-05-25 は月曜 → 自身
    expect(weekStartStr(new Date(2026, 4, 25))).toBe("2026-05-25");
  });
});

describe("formatShortDate", () => {
  it("M/D 形式に整形", () => {
    expect(formatShortDate("2026-06-02")).toBe("6/2");
  });
  it("空/無効は空文字", () => {
    expect(formatShortDate(null)).toBe("");
    expect(formatShortDate("")).toBe("");
  });
});
