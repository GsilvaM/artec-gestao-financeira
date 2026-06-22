import { test, expect } from "@playwright/test";

test.describe("Lançamentos Financeiros", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/financeiro/lancamentos");
  });

  test("page loads with title and empty state", async ({ page }) => {
    await expect(page.getByText("Lançamentos Financeiros")).toBeVisible();
    await expect(page.getByText("Nenhum lançamento encontrado.")).toBeVisible();
  });

  test("novo lançamento button is present and enabled", async ({ page }) => {
    const button = page.getByRole("button", { name: /novo lançamento/i });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test.describe("CRUD", () => {
    test("navigates to /app/financeiro/lancamentos from sidebar", async ({
      page,
    }) => {
      await expect(page).toHaveURL("/app/financeiro/lancamentos");
    });

    test.fixme("creates a new entry and displays it in the table", async ({
      page,
    }) => {
      await page.getByRole("button", { name: /novo lançamento/i }).click();
    });

    test.fixme("edits an existing entry", async ({ page: _page }) => {});

    test.fixme("deletes an entry", async ({ page: _page }) => {});
  });
});
