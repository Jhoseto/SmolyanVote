/**

 * Cloudflare session setup via REAL Chrome (CDP).

 * Auto-saves storage-state.json when document links appear.

 */



import fs from "node:fs";

import path from "node:path";

import { spawn } from "node:child_process";

import readline from "node:readline";

import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { hasStorageState, resolveStorageStatePath, sleep } from "./lib/browser.js";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROFILE_DIR = path.join(__dirname, ".chrome-profile");

const DEBUG_PORT = Number(process.env.SMOLYAN_CDP_PORT || 9333);

const TARGET = "https://www.smolyan.bg/bg/menu/sl/10";



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



async function waitForEnter(prompt) {

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  await new Promise((resolve) => rl.question(prompt, () => resolve()));

  rl.close();

}



async function waitForCdp(port, timeoutMs = 60_000) {

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {

    try {

      const res = await fetch(`http://127.0.0.1:${port}/json/version`);

      if (res.ok) return;

    } catch {

      /* waiting */

    }

    await sleep(400);

  }

  throw new Error(`Chrome CDP not ready on port ${port}`);

}



async function cdpAlreadyRunning(port) {

  try {

    const res = await fetch(`http://127.0.0.1:${port}/json/version`);

    return res.ok;

  } catch {

    return false;

  }

}



async function readPageStatus(page) {

  return page.evaluate(() => {

    const links = document.querySelectorAll('a[href*="/bg/menu/content/"]').length;

    const title = document.title || "";

    const body = document.body?.innerText?.slice(0, 500) || "";

    const blocked = /един момент|just a moment|cloudflare|злонамерени ботове/i.test(title + body);

    return { links, blocked, title, url: location.href };

  });

}



function launchChrome(chromePath) {

  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  spawn(

    chromePath,

    [

      `--remote-debugging-port=${DEBUG_PORT}`,

      `--user-data-dir=${PROFILE_DIR}`,

      "--no-first-run",

      "--no-default-browser-check",

      TARGET,

    ],

    { detached: true, stdio: "ignore", windowsHide: false },

  ).unref();

}



async function trySaveSession(out) {

  let browser;

  try {

    browser = await chromium.connectOverCDP(`http://127.0.0.1:${DEBUG_PORT}`);

    const context = browser.contexts()[0];

    if (!context) return false;

    const page = context.pages().find((p) => p.url().includes("smolyan.bg")) ?? context.pages()[0];

    if (!page) return false;

    const status = await readPageStatus(page);

    if (status.blocked || status.links === 0) {

      process.stdout.write(`\r  … "${status.title.slice(0, 45)}" (${status.links} docs)   `);

      return false;

    }

    await context.storageState({ path: out });

    const cookies = JSON.parse(fs.readFileSync(out, "utf8")).cookies?.length ?? 0;

    if (cookies === 0) return false;

    console.log(`\n\n✓ Saved ${status.links} links, ${cookies} cookies → ${out}`);

    return true;

  } catch {

    return false;

  } finally {

    if (browser) await browser.close();

  }

}



console.log("=== smolyan.bg session setup ===\n");



const chromePath = findChromeExecutable();

if (!chromePath) {

  console.error("Install Google Chrome first.");

  process.exit(1);

}



if (!(await cdpAlreadyRunning(DEBUG_PORT))) {

  console.log("Opening Chrome… Pass Cloudflare when prompted.\n");

  launchChrome(chromePath);

  await waitForCdp(DEBUG_PORT);

} else {

  console.log("Chrome already running on CDP port — connecting.\n");

}



const out = resolveStorageStatePath();

console.log("Auto-saving when decisions list appears (up to 5 min)…\n");



let saved = false;

for (let i = 0; i < 60 && !saved; i++) {

  saved = await trySaveSession(out);

  if (!saved) await sleep(5000);

}



if (!saved) {

  console.log("\n\nPress Enter when you see the decisions list in Chrome:");

  await waitForEnter("Enter… ");

  saved = await trySaveSession(out);

}



if (!saved) {

  console.error("\nFailed to save session. Pass Cloudflare and retry.");

  process.exit(1);

}



console.log("\nIMPORTANT: Close the Chrome window, then:");
console.log("  start-scraper.bat   (opens Chrome via CDP — real browser, not headless bot)");
console.log("  cd scraper && npm run probe");
console.log("  Admin → smolyan.bg scrape (documents + съветници автоматично)");


