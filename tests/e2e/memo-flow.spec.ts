import { test, expect } from "@playwright/test";

test("メモを作成して検索でヒットする", async ({ page }) => {
  await page.goto("/memos/new");

  await page.getByLabel("メモ種別").selectOption("research");
  await page.getByLabel("カテゴリ").selectOption({ label: "テスト" });
  await page.getByLabel("調査テーマ").fill("E2E調査メモ_ユニーク語句XYZ");
  await page.getByRole("button", { name: "作成" }).click();

  // 詳細ページへ遷移
  await expect(page).toHaveURL(/\/memos\/[0-9a-f-]+$/);

  // 一覧で検索（検索バーから送信）
  await page.goto("/memos");
  await page.getByPlaceholder("キーワード", { exact: false }).fill("ユニーク語句XYZ");
  await page.getByRole("button", { name: "検索" }).click();
  await expect(page.getByText("E2E調査メモ_ユニーク語句XYZ")).toBeVisible();

  // 無関係な語ではヒットしない（クエリ直指定で検索フィルタを検証）
  await page.goto("/memos?keyword=" + encodeURIComponent("存在しないキーワードZZZ"));
  await expect(page.getByText("メモがありません")).toBeVisible();
});
