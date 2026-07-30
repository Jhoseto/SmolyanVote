/**
 * Playwright scraper for smolyan.bg — Граждански монитор
 * Rate limit: 1 request / 2 seconds per page navigation
 */

const BASE = "https://www.smolyan.bg";
const DELAY_MS = 2000;

export const SECTIONS = [
  { path: "/bg/menu/sl/10", documentType: "COUNCIL_DECISION", label: "Решения" },
  { path: "/bg/menu/sl/64", documentType: "COUNCIL_PROTOCOL", label: "Протоколи" },
  { path: "/bg/menu/sl/8", documentType: "COUNCIL_AGENDA", label: "Дневен ред" },
  { path: "/bg/menu/fl/33", documentType: "PUBLIC_CONSULTATION", label: "Обсъждания" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractContentId(href) {
  if (!href) return null;
  const m = href.match(/\/bg\/menu\/content\/(\d+)/);
  return m ? m[1] : null;
}

async function collectLinks(page, sectionPath, maxLinks) {
  const url = BASE + sectionPath;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await sleep(DELAY_MS);

  const hrefs = await page.$$eval("a[href*='/bg/menu/content/']", (anchors) =>
    anchors.map((a) => a.getAttribute("href")).filter(Boolean),
  );

  const ids = [];
  const seen = new Set();
  for (const href of hrefs) {
    const id = extractContentId(href);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= maxLinks) break;
  }
  return ids;
}

async function scrapeContentPage(page, contentId, documentType) {
  const url = `${BASE}/bg/menu/content/${contentId}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await sleep(DELAY_MS);

  const data = await page.evaluate(() => {
    const titleEl =
      document.querySelector("h1") ||
      document.querySelector(".page-title") ||
      document.querySelector("article h2");
    const title = titleEl?.textContent?.trim() || document.title || "Без заглавие";

    const bodyEl =
      document.querySelector("article") ||
      document.querySelector(".content") ||
      document.querySelector("#content") ||
      document.querySelector("main");
    const rawContent = (bodyEl?.innerText || document.body.innerText || "")
      .replace(/\s+\n/g, "\n")
      .trim()
      .slice(0, 50_000);

    const dateMatch = document.body.innerText.match(
      /(\d{1,2}[./]\d{1,2}[./]\d{4})|(\d{4}-\d{2}-\d{2})/,
    );
    return { title, rawContent, dateText: dateMatch ? dateMatch[0] : null };
  });

  let publishedAt = null;
  if (data.dateText) {
    const normalized = data.dateText.includes(".")
      ? data.dateText.split(".").reverse().join("-")
      : data.dateText;
    const d = new Date(normalized);
    if (!Number.isNaN(d.getTime())) {
      publishedAt = d.toISOString();
    }
  }

  return {
    sourceId: contentId,
    sourceUrl: url,
    documentType,
    title: data.title,
    rawContent: data.rawContent,
    publishedAt,
  };
}

export async function runScrape(maxPerSection = 40) {
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const documents = [];
  const seenGlobal = new Set();

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "bg-BG",
    });
    const page = await context.newPage();

    for (const section of SECTIONS) {
      console.log(`[monitor-scraper] Section: ${section.label}`);
      let ids = [];
      try {
        ids = await collectLinks(page, section.path, maxPerSection);
      } catch (err) {
        console.warn(`[monitor-scraper] Listing failed ${section.path}:`, err.message);
        continue;
      }

      for (const id of ids) {
        if (seenGlobal.has(id)) continue;
        seenGlobal.add(id);
        try {
          const doc = await scrapeContentPage(page, id, section.documentType);
          if (doc.rawContent && doc.rawContent.length > 80) {
            documents.push(doc);
          }
        } catch (err) {
          console.warn(`[monitor-scraper] Content ${id} failed:`, err.message);
        }
      }
    }

    await context.close();
  } finally {
    await browser.close();
  }

  return documents;
}
