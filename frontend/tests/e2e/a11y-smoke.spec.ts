import { expect, test } from "@playwright/test";

test.describe("A11y smoke", () => {
  test("skip-link targets main content", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "Към съдържанието" });
    await expect(skip).toHaveAttribute("href", "#main-content");
    await expect(page.locator("#main-content")).toHaveCount(1);
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
