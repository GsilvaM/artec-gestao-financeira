import { test as setup } from "@playwright/test";

const authFile = ".auth/user.json";

setup("authenticate with Supabase", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables must be set",
    );
  }

  await page.goto("/");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("/app");
  await page.context().storageState({ path: authFile });
});
