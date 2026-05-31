import { describe, it, expect } from "vitest";
import { reassignDisplayOrder, computeReorder } from "@/lib/domain/reorder";

describe("reassignDisplayOrder", () => {
  it("id 順に 0..n-1 を割り当てる", () => {
    expect(reassignDisplayOrder(["a", "b", "c"])).toEqual([
      { id: "a", displayOrder: 0 },
      { id: "b", displayOrder: 1 },
      { id: "c", displayOrder: 2 },
    ]);
  });

  it("空配列は空を返す", () => {
    expect(reassignDisplayOrder([])).toEqual([]);
  });
});

describe("computeReorder", () => {
  const ids = ["a", "b", "c", "d"];

  it("末尾を先頭へ移動", () => {
    expect(computeReorder(ids, "d", "a")).toEqual(["d", "a", "b", "c"]);
  });

  it("先頭を末尾の位置へ移動", () => {
    expect(computeReorder(ids, "a", "d")).toEqual(["b", "c", "d", "a"]);
  });

  it("同一要素なら変化なし（新しい配列を返す）", () => {
    const result = computeReorder(ids, "b", "b");
    expect(result).toEqual(ids);
    expect(result).not.toBe(ids);
  });

  it("存在しない id は無視して元の順序を返す", () => {
    expect(computeReorder(ids, "x", "a")).toEqual(ids);
  });
});
