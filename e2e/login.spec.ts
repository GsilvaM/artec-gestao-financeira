import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login", () => {
  test("renders login form with all required fields", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Artec Gestão" }),
    ).toBeVisible();
    await expect(page.getByText("Entre com sua conta")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/");
    await page.locator("#email").fill("invalid@test.com");
    await page.locator("#password").fill("wrong-password-123");
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page.getByText(/invalid/i).first()).toBeVisible();
  });

  test("successful login redirects to /app", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    await page.goto("/");
    await page.locator("#email").fill(email!);
    await page.locator("#password").fill(password!);
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page).toHaveURL("/app");
    await expect(page.getByText("Dashboard")).toBeVisible();
  });
});
