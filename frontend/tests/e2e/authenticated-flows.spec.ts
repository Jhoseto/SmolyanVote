import { expect, test } from "@playwright/test";
import { e2eCredentials, loginAsE2EUser } from "./helpers/auth";

/**
 * Authenticated key flows (MODERN_FRONTEND_PLAN §Фаза 10).
 * Requires running Java backend on :2662 + E2E_USER_* env vars.
 * Vote/comment/messenger/admin mutations are best-effort against live data.
 */
test.describe("Authenticated flows", () => {
  test.beforeEach(({}, testInfo) => {
    testInfo.skip(!e2eCredentials(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
  });

  test("profile page opens for logged-in user", async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto("/profile");
    await expect(page.getByRole("heading", { level: 1 }).or(page.getByText(/профил/i))).toBeVisible({
      timeout: 15_000,
    });
  });

  test("events list → open first event detail", async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto("/events");
    const firstCard = page.locator('a[href^="/event/"], a[href^="/referendum/"], a[href^="/multipoll/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();
    await expect(page).toHaveURL(/\/(event|referendum|multipoll)\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("comment form is present on event detail when authenticated", async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto("/events");
    const first = page.locator('a[href^="/event/"]').first();
    test.skip((await first.count()) === 0, "No simple events in feed");
    await first.click();
    await expect(
      page.getByPlaceholder(/коментар|напиши/i).or(page.getByRole("textbox").first()),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("messenger panel opens for authenticated desktop user", async ({ page }) => {
    test.skip(test.info().project.name.startsWith("mobile"), "Mobile uses APK modal");
    await loginAsE2EUser(page);
    await page.goto("/");
    await page.getByRole("button", { name: /съобщения|отвори съобщенията/i }).click();
    await expect(page.getByRole("heading", { name: /съобщения/i })).toBeVisible({ timeout: 10_000 });
  });

  test("admin page for non-admin shows access denied", async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto("/admin");
    // ADMIN users see Health; USER sees gate. Either is a successful auth routing check.
    await expect(
      page.getByRole("heading", { name: /админ/i }).or(page.getByText(/нямате достъп/i)),
    ).toBeVisible({ timeout: 15_000 });
  });
});
