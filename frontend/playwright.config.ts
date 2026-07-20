import { defineConfig, devices } from "@playwright/test";

/**
 * E2E + mobile-viewport parity checks (MODERN_FRONTEND_PLAN §Testing Strategy).
 * Viewports mirror the mandatory set: 360 / 390 / 768 / desktop.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-390",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "mobile-360",
      use: { viewport: { width: 360, height: 800 }, isMobile: true },
    },
    {
      name: "tablet-768",
      use: { viewport: { width: 768, height: 1024 } },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
