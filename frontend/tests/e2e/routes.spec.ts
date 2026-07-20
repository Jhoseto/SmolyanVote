import { expect, test } from "@playwright/test";

test.describe("Migrated route smokes", () => {
  test("events hub loads", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("publications feed loads", async ({ page }) => {
    await page.goto("/publications");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("signals map page loads", async ({ page }) => {
    await page.goto("/signals");
    await expect(page.getByRole("heading", { name: /сигнал/i })).toBeVisible();
  });

  test("podcast page loads", async ({ page }) => {
    await page.goto("/podcast");
    await expect(page.getByRole("heading", { name: /подкаст/i })).toBeVisible();
  });

  test("faq page loads", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("admin gate blocks non-admin / guest", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/достъп|вход/i)).toBeVisible();
  });

  test("guest messenger FAB opens APK modal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /съобщения|отвори съобщенията/i }).click();
    await expect(page.getByRole("heading", { name: "SVMessenger" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: /изтегли apk/i })).toBeVisible();
  });
});
