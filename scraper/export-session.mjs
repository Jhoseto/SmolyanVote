/**
 * Export storage-state.json from existing .chrome-profile (after setup-session).
 * Usage: npm run export-session
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASE,
  CHROME_PROFILE,
  getChromium,
  hasChromeProfile,
  resolveStorageStatePath,
  sleep,
} from "./lib/browser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = `${BASE}/bg/menu/sl/10`;

if (!hasChromeProfile()) {
  console.error("No .chrome-profile — run setup-session.bat first and pass Cloudflare.");
  process.exit(1);
}

console.log("Exporting cookies from .chrome-profile → storage-state.json");
console.log(`Profile: ${CHROME_PROFILE}`);

const chromium = await getChromium();
let context;
try {
  context = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: true,
    channel: "chrome",
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await sleep(8000);

  const status = await page.evaluate(() => ({
    links: document.querySelectorAll('a[href*="/bg/menu/content/"]').length,
    title: document.title,
  }));

  console.log(`Page: "${status.title}" — ${status.links} document links`);

  if (status.links === 0) {
    console.error("\n❌ Profile has no valid session. Run setup-session.bat again (headed Chrome).");
    process.exit(1);
  }

  const out = resolveStorageStatePath();
  await context.storageState({ path: out });
  const cookies = JSON.parse(fs.readFileSync(out, "utf8")).cookies?.length ?? 0;
  console.log(`\n✓ Saved ${cookies} cookies → ${out}`);
  console.log("Restart start-scraper.bat and run smolyan.bg scrape.");
} finally {
  if (context) await context.close();
}
