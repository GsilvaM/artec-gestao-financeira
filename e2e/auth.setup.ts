import { test as setup } from "@playwright/test";
import { ensureE2EUserAndData } from "./seed-user.js";
import { getE2ECredentials } from "./env.js";

const authFile = ".auth/user.json";

setup("authenticate with Supabase", async ({ page }) => {
  await ensureE2EUserAndData();
  const { email, password } = getE2ECredentials();

  await page.goto("/");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("/app");
  await page.waitForFunction(() =>
    Object.keys(window.localStorage).some((key) =>
      key.startsWith("sb-") && key.endsWith("-auth-token"),
    ),
  );
  await page.context().storageState({ path: authFile });
});
