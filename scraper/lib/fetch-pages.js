/**
 * Fetch arbitrary municipal pages via Playwright (ZPKONPI registers, egov portals).
 */

import {
  closeBrowserSession,
  createBrowserSession,
  gotoSmolyanPage,
  sleep,
  DELAY_MS,
} from "./browser.js";

export async function fetchPages(urls) {
  if (!urls?.length) {
    return [];
  }
  const session = await createBrowserSession();
  const page = session.context.pages()[0] || (await session.context.newPage());
  const results = [];
  try {
    for (const url of urls) {
      try {
        if (url.includes("smolyan.bg")) {
          await gotoSmolyanPage(page, url, { timeoutMs: 60_000 });
        } else {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
          await sleep(DELAY_MS);
        }
        const html = await page.content();
        results.push({ url, ok: true, html, error: null });
      } catch (err) {
        results.push({ url, ok: false, html: null, error: err.message || "fetch failed" });
      }
    }
  } finally {
    await closeBrowserSession(session);
  }
  return results;
}
