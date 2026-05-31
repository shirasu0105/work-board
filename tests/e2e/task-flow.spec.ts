import { test, expect } from "@playwright/test";

test("タスクを作成して完了にできる", async ({ page }) => {
  await page.goto("/tasks");

  // 作成
  await page.getByRole("button", { name: "+ タスクを追加" }).click();
  const drawer = page.getByRole("dialog", { name: "タスクを追加" });
  await expect(drawer).toBeVisible();
  await drawer.getByLabel("タスク名").fill("E2E: 請求書を送る");
  await drawer.getByLabel("カテゴリ").selectOption({ label: "テスト" });
  await drawer.getByRole("button", { name: "保存" }).click();

  // 一覧に表示される
  await expect(page.getByText("E2E: 請求書を送る")).toBeVisible();

  // インラインのステータス変更で完了にする
  await page.getByLabel("ステータス変更").first().selectOption("完了");

  // 完了フィルタで表示され、未着手フィルタでは消える
  await page.getByRole("button", { name: /^完了/ }).click();
  await expect(page.getByText("E2E: 請求書を送る")).toBeVisible();
  await page.getByRole("button", { name: /^未着手/ }).click();
  await expect(page.getByText("E2E: 請求書を送る")).toHaveCount(0);
});
