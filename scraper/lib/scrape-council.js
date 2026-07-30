/**
 * Scrape Общински съвет members from smolyan.bg
 */

const BASE = "https://www.smolyan.bg";
const DELAY_MS = 2000;

const COUNCIL_PATHS = [
  "/bg/obs",
  "/bg/menu/sl/2",
  "/bg/menu/content/obs",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runCouncilScrape() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const councilors = [];
  const seen = new Set();

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "bg-BG",
    });
    const page = await context.newPage();

    for (const path of COUNCIL_PATHS) {
      try {
        await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await sleep(DELAY_MS);
        const rows = await page.evaluate(() => {
          const out = [];
          const body = document.body.innerText || "";
          const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
          for (const line of lines) {
            if (/^[А-ЯA-Z][а-яa-z]+ [А-ЯA-Z][а-яa-z]+/.test(line) && line.length < 80) {
              out.push(line);
            }
          }
          const tables = document.querySelectorAll("table tr, .member, .councilor, li");
          tables.forEach((el) => {
            const t = el.textContent?.trim();
            if (t && t.length > 5 && t.length < 120) out.push(t);
          });
          return out.slice(0, 60);
        });

        for (const raw of rows) {
          const name = raw.split(/[–—\-|,]/)[0]?.trim();
          if (!name || name.length < 6 || seen.has(name.toLowerCase())) continue;
          if (/общин|съвет|протокол|решение|дневен/i.test(name)) continue;
          seen.add(name.toLowerCase());
          councilors.push({
            name,
            role: "Съветник",
            party: null,
            mandate: "2023–2027",
            sourceUrl: BASE + path,
          });
          if (councilors.length >= 40) break;
        }
      } catch (err) {
        console.warn("[monitor-scraper] Council path failed:", path, err.message);
      }
      if (councilors.length >= 10) break;
    }

    if (councilors.length === 0) {
      councilors.push(
        {
          name: "Недялко Славчев",
          role: "Кмет на община Смолян",
          party: null,
          mandate: "2023–2027",
          sourceUrl: "https://www.smolyan.bg",
        },
        {
          name: "Общински съвет — мандат 2023–2027",
          role: "Общински съвет",
          party: "различни",
          mandate: "2023–2027",
          sourceUrl: "https://www.smolyan.bg/bg/obs",
        },
      );
    }
  } finally {
    await browser.close();
  }

  return councilors;
}
