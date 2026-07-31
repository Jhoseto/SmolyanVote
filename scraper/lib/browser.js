/**
 * Shared Playwright context for smolyan.bg (Cloudflare-protected).
 *
 * Session priority (headless storage-state alone is blocked by Cloudflare):
 * 1. Real Chrome via CDP + .chrome-profile (same as setup-session.bat)
 * 2. .chrome-profile persistent context (headed fallback)
 * 3. storage-state.json (last resort — often fails headless)
 * 4. FlareSolverr (optional)
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_STORAGE = path.join(__dirname, "..", "storage-state.json");
export const CHROME_PROFILE = path.join(__dirname, "..", ".chrome-profile");

export const BASE = "https://www.smolyan.bg";
export const DELAY_MS = Number(process.env.MONITOR_SCRAPER_DELAY_MS || 300);
export const CDP_PORT = Number(process.env.SMOLYAN_CDP_PORT || 9333);
export const CONCURRENCY = Number(process.env.MONITOR_SCRAPER_CONCURRENCY || 5);
/** Listing pages trigger Cloudflare if too many tabs at once */
export const LISTING_CONCURRENCY = Number(process.env.MONITOR_SCRAPER_LISTING_CONCURRENCY || 2);
export const FAST_MODE = process.env.MONITOR_SCRAPER_FAST !== "0";

/** Who launched Chrome for CDP (do not kill on disconnect). */
let cdpChromeSpawnedByUs = false;

let chromiumWithStealth = null;

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getChromium() {
  if (!chromiumWithStealth) {
    const { chromium } = await import("playwright-extra");
    const StealthPlugin = (await import("puppeteer-extra-plugin-stealth")).default;
    chromium.use(StealthPlugin());
    chromiumWithStealth = chromium;
  }
  return chromiumWithStealth;
}

export function resolveStorageStatePath() {
  const fromEnv = process.env.MONITOR_SCRAPER_STORAGE_STATE?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return DEFAULT_STORAGE;
}

export function hasStorageState() {
  const p = resolveStorageStatePath();
  if (!fs.existsSync(p)) return false;
  try {
    const raw = fs.readFileSync(p, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.cookies) && data.cookies.length > 0;
  } catch {
    return false;
  }
}

export function hasChromeProfile() {
  if (!fs.existsSync(CHROME_PROFILE)) return false;
  try {
    return fs.readdirSync(CHROME_PROFILE).length > 0;
  } catch {
    return false;
  }
}

export function sessionStatus() {
  return {
    hasStorageState: hasStorageState(),
    hasChromeProfile: hasChromeProfile(),
    storagePath: resolveStorageStatePath(),
    profilePath: CHROME_PROFILE,
    cdpPort: CDP_PORT,
    cdpMode: process.env.MONITOR_SCRAPER_CDP !== "0",
  };
}

function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.LOCALAPPDATA &&
      path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function isCdpAvailable(port = CDP_PORT) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForCdp(port = CDP_PORT, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isCdpAvailable(port)) return;
    await sleep(400);
  }
  throw new Error(`Chrome CDP not ready on port ${port}`);
}

async function launchChromeForCdp() {
  const chromePath = findChromeExecutable();
  if (!chromePath) {
    throw new Error("Google Chrome not found — install Chrome or set CHROME_PATH");
  }
  fs.mkdirSync(CHROME_PROFILE, { recursive: true });
  spawn(
    chromePath,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${CHROME_PROFILE}`,
      "--no-first-run",
      "--no-default-browser-check",
      `${BASE}/bg/menu/sl/10`,
    ],
    { detached: true, stdio: "ignore", windowsHide: false },
  ).unref();
  cdpChromeSpawnedByUs = true;
  console.log(`[monitor-scraper] Launched Chrome (CDP :${CDP_PORT}) — pass Cloudflare if prompted`);
  await waitForCdp();
}

async function ensureChromeCdp() {
  if (await isCdpAvailable()) return;
  if (!hasChromeProfile() && !hasStorageState()) {
    throw new Error("No .chrome-profile — run setup-session.bat first");
  }
  await launchChromeForCdp();
}

async function createBrowserSessionViaCDP() {
  await ensureChromeCdp();
  const { chromium } = await import("playwright");
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const context = browser.contexts()[0];
  if (!context) {
    await browser.close();
    throw new Error("Chrome CDP connected but no browser context");
  }
  const page = context.pages().find((p) => p.url().includes("smolyan.bg")) ?? context.pages()[0];
  if (page) {
    const blocked = await isCloudflareChallenge(page);
    if (blocked) {
      console.warn(
        "[monitor-scraper] Chrome показва Cloudflare — минете отметката в прозореца или пуснете setup-session.bat",
      );
    }
  }
  console.log(`[monitor-scraper] Connected via Chrome CDP (port ${CDP_PORT})`);
  return { browser, context, persistent: false, cdp: true };
}

function flareSolverrUrl() {
  return process.env.MONITOR_SCRAPER_FLARESOLVERR?.trim().replace(/\/$/, "") || null;
}

async function bootstrapViaFlareSolverr(context) {
  const base = flareSolverrUrl();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "request.get",
        url: `${BASE}/bg/menu/sl/10`,
        maxTimeout: 60_000,
      }),
    });
    const data = await res.json();
    if (data.status !== "ok" || !data.solution?.cookies?.length) return false;
    const cookies = data.solution.cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || "/",
      expires: c.expiry ?? -1,
      httpOnly: c.httpOnly ?? false,
      secure: c.secure ?? false,
      sameSite: c.sameSite ?? "Lax",
    }));
    await context.addCookies(cookies);
    console.log(`[monitor-scraper] FlareSolverr injected ${cookies.length} cookies`);
    return true;
  } catch (err) {
    console.warn("[monitor-scraper] FlareSolverr failed:", err.message);
    return false;
  }
}

function commonContextOpts() {
  return {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "bg-BG",
    timezoneId: "Europe/Sofia",
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: {
      "Accept-Language": "bg-BG,bg;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  };
}

export async function createBrowserSession() {
  const headed = process.env.MONITOR_SCRAPER_HEADED === "1";
  const cdpDisabled = process.env.MONITOR_SCRAPER_CDP === "0";
  const preferCdp = !cdpDisabled && (process.env.MONITOR_SCRAPER_CDP === "1" || hasChromeProfile());

  if (preferCdp) {
    try {
      return await createBrowserSessionViaCDP();
    } catch (err) {
      if (/profile|in use|exitCode=21|EBUSY/i.test(err.message)) {
        throw new Error(
          "Chrome профилът е зает — затвори прозореца от setup-session.bat, после start-scraper.bat. " +
            err.message,
        );
      }
      console.warn("[monitor-scraper] CDP session failed, trying Playwright launch:", err.message);
      if (process.env.MONITOR_SCRAPER_CDP === "1") throw err;
    }
  }

  const chromium = await getChromium();
  const storagePath = resolveStorageStatePath();
  const useProfile = hasChromeProfile();
  const useStorage = !useProfile && hasStorageState();
  /** Use installed Google Chrome — no Playwright chromium download required. Set MONITOR_SCRAPER_CHROME=0 to use bundled chromium. */
  const chromeChannel = process.env.MONITOR_SCRAPER_CHROME === "0" ? undefined : "chrome";

  const launchArgs = [
    "--disable-blink-features=AutomationControlled",
    "--no-sandbox",
    "--disable-dev-shm-usage",
  ];

  if (useProfile) {
    console.log(`[monitor-scraper] Using Chrome profile (Playwright): ${CHROME_PROFILE}`);
    try {
      const context = await chromium.launchPersistentContext(CHROME_PROFILE, {
        headless: !headed,
        channel: chromeChannel || "chrome",
        args: launchArgs,
        ...commonContextOpts(),
      });
      return { browser: null, context, persistent: true };
    } catch (err) {
      if (/closed|exitCode=21|profile|in use/i.test(err.message)) {
        throw new Error(
          "Chrome профилът е зает — затвори Chrome от setup-session, после start-scraper.bat. " +
            err.message,
        );
      }
      throw err;
    }
  }

  const browser = await chromium.launch({
    headless: !headed,
    channel: chromeChannel,
    args: launchArgs,
  });

  const contextOpts = { ...commonContextOpts() };

  if (useStorage) {
    contextOpts.storageState = storagePath;
    console.log(`[monitor-scraper] Using saved session (headless — may be blocked): ${storagePath}`);
  } else {
    console.warn("[monitor-scraper] No session — run setup-session.bat and press Enter to save cookies");
  }

  const context = await browser.newContext(contextOpts);
  if (!useStorage) {
    await bootstrapViaFlareSolverr(context);
  }

  return { browser, context, persistent: false };
}

export async function closeBrowserSession(session) {
  if (!session) return;
  if (session.cdp) {
    if (session.browser) await session.browser.close();
    return;
  }
  if (session.context) await session.context.close();
  if (session.browser) await session.browser.close();
}

export async function isCloudflareChallenge(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText || "";
    const title = document.title || "";
    const challengeText =
      /cloudflare|един момент|just a moment|security verification|злонамерени ботове|checking your browser/i.test(
        text + title,
      );
    const hasLinks =
      document.querySelectorAll(
        'a[href*="/bg/menu/content/"], a[href*="/bg/menu/subcontent/"], a[href*="/bg/menu/sl/"], a[href*="/bg/menu/fl/"]',
      ).length > 0;
    return challengeText && !hasLinks;
  });
}

export async function gotoSmolyanPage(page, url, { timeoutMs = 45_000, fast = FAST_MODE, retries = fast ? 4 : 1 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        await page.reload({ waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() =>
          page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs }),
        );
      } else {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      }

      if (!fast) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          const blocked = await isCloudflareChallenge(page);
          if (!blocked) {
            await sleep(Math.min(DELAY_MS, 2000));
            return;
          }
          await sleep(2000);
        }
      } else {
        for (let wait = 0; wait < 4; wait++) {
          if (!(await isCloudflareChallenge(page))) return;
          await sleep(1500 + wait * 500);
        }
      }

      const title = await page.title();
      lastErr = new Error(
        `Cloudflare блокира достъпа до smolyan.bg (страница: "${title}"). ` +
          "Пуснете setup-session.bat, минете challenge-а, натиснете Enter за storage-state.json.",
      );
    } catch (err) {
      lastErr = err;
    }
    if (attempt < retries) {
      console.warn(`[monitor-scraper] Retry ${attempt}/${retries} ${url}`);
      await sleep(2000 * attempt);
    }
  }
  throw lastErr;
}

export async function probeSession() {
  const probeUrl = `${BASE}/bg/menu/sl/10`;
  const sess = sessionStatus();
  const result = {
    ...sess,
    stealthEnabled: true,
    delayMs: DELAY_MS,
    flareSolverr: Boolean(flareSolverrUrl()),
    cdpPort: CDP_PORT,
    cdpConnected: null,
    headed: process.env.MONITOR_SCRAPER_HEADED === "1",
    probeUrl,
    linkCount: null,
    cloudflareBlocked: null,
    ok: false,
    message: null,
  };

  let session;
  try {
    session = await createBrowserSession();
    result.cdpConnected = Boolean(session.cdp);
    const page = session.context.pages()[0] ?? (await session.context.newPage());
    await gotoSmolyanPage(page, probeUrl, { timeoutMs: 90_000 });
    result.linkCount = await page.evaluate(
      () => document.querySelectorAll('a[href*="/bg/menu/content/"]').length,
    );
    result.cloudflareBlocked = await isCloudflareChallenge(page);
    result.ok = result.linkCount > 0 && !result.cloudflareBlocked;
    result.message = result.ok
      ? `${result.linkCount} document links visible`
      : !sess.hasStorageState && !sess.hasChromeProfile
        ? "Няма storage-state.json и няма .chrome-profile — пуснете setup-session.bat"
        : result.cloudflareBlocked
          ? "Cloudflare challenge — отворете setup-session.bat отново"
          : "Страницата е празна — опреснете сесията";
  } catch (err) {
    result.message = err.message;
    result.cloudflareBlocked = true;
  } finally {
    await closeBrowserSession(session);
  }
  return result;
}

export function cloudflareSetupHint() {
  return (
    "smolyan.bg изисква Cloudflare сесия. setup-session.bat → минете отметката → Enter → затвори Chrome. " +
    "После start-scraper.bat. Ако Chrome е отворен — минете отметката в прозореца на port 9333."
  );
}

/** One tab first — avoids Cloudflare burst when parallel tabs open cold. */
export async function warmupSmolyanSession(context) {
  const page = context.pages()[0] ?? (await context.newPage());
  const url = `${BASE}/bg/menu/sl/10`;
  await gotoSmolyanPage(page, url);
  const linkCount = await page.evaluate(
    () => document.querySelectorAll('a[href*="/bg/menu/content/"]').length,
  );
  if (linkCount === 0) {
    const err = new Error(cloudflareSetupHint());
    err.code = "CLOUDFLARE_BLOCKED";
    throw err;
  }
  console.log(`[monitor-scraper] Session warm (${linkCount} links on decisions page)`);
  return page;
}
