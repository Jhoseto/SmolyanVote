import { expect, test } from "@playwright/test";
import { e2eCredentials, loginAsE2EUser } from "./helpers/auth";

test.describe("Auth flows", () => {
  test("login form shows validation errors when empty", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Вход" }).click();
    await expect(page.locator("#login-email-error, #login-password-error").first()).toBeVisible();
  });

  test("login with E2E credentials reaches authenticated shell", async ({ page }) => {
    test.skip(!e2eCredentials(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run");

    await loginAsE2EUser(page);
    await expect(page.getByRole("button", { name: /изход|logout/i }).or(page.locator("text=Моят профил"))).toBeVisible({
      timeout: 15_000,
    });
  });
});
