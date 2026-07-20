import { expect, test } from "@playwright/test";

test.describe("Home page — visual parity smoke", () => {
  test("renders hero, all sections and no horizontal scroll", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Гласът на Смолян", level: 1 }),
    ).toBeVisible();

    // v1 section order markers
    await expect(
      page.getByRole("heading", { name: "Какво е SmolyanVote?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Защо SmolyanVote е различен?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "SmolyanVote вече е в джоба ти!" }),
    ).toBeVisible();

    // No horizontal scroll (mobile-first requirement)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(overflow).toBe(true);
  });
});
