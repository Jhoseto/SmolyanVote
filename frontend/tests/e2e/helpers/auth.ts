import type { Page } from "@playwright/test";

/** Set `E2E_USER_EMAIL` + `E2E_USER_PASSWORD` to run authenticated flows against local backend. */
export function e2eCredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_USER_EMAIL?.trim();
  const password = process.env.E2E_USER_PASSWORD?.trim();
  if (!email || !password) return null;
  return { email, password };
}

export async function loginAsE2EUser(page: Page): Promise<void> {
  const creds = e2eCredentials();
  if (!creds) throw new Error("E2E credentials missing");

  await page.goto("/login");
  await page.locator("#login-email").fill(creds.email);
  await page.locator("#login-password").fill(creds.password);
  await page.getByRole("button", { name: "Вход" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
}
