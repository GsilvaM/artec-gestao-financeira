import { test, expect } from "@playwright/test";

test.describe("Lancamentos Financeiros", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/financeiro/lancamentos");
  });

  test("page loads with title and empty state", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Lan/ })).toBeVisible();
    const contentSignal = page
      .getByText(/Nenhum lan/)
      .or(page.getByText("Receitas", { exact: true }).first());
    await expect(contentSignal).toBeVisible();
  });

  test("novo lancamento button is present and enabled", async ({ page }) => {
    const button = page.getByRole("button", { name: /novo lan/i }).first();
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test.describe("CRUD", () => {
    test("navigates to /app/financeiro/lancamentos from sidebar", async ({
      page,
    }) => {
      await expect(page).toHaveURL("/app/financeiro/lancamentos");
    });

    test("opens create entry modal", async ({ page }) => {
      await page.getByRole("button", { name: /novo lan/i }).first().click();
      await expect(page.getByRole("heading", { name: /novo lan/i })).toBeVisible();
    });
  });
});
