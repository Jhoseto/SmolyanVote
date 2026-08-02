/**
 * Playwright scraper for smolyan.bg — parallel discovery + content extraction.
 * Target: full municipal site in ~5 minutes (CDP + 8 parallel tabs).
 */

import {
  BASE,
  CONCURRENCY,
  LISTING_CONCURRENCY,
  cloudflareSetupHint,
  closeBrowserSession,
  createBrowserSession,
  DELAY_MS,
  gotoSmolyanPage,
  hasChromeProfile,
  hasStorageState,
  sessionStatus,
  sleep,
  warmupSmolyanSession,
} from "./browser.js";
import { discoverSite, inferDocumentType, pathnameOf } from "./discover.js";
import { runPool } from "./parallel.js";

const MAX_PAGES_PER_SECTION = Number(process.env.SMOLYAN_MAX_PAGES || 40);
const USE_FULL_DISCOVER = process.env.SMOLYAN_FULL_DISCOVER === "1";

export const SECTIONS = [
  { path: "/bg/menu/sl/10", documentType: "COUNCIL_DECISION", label: "Решения" },
  { path: "/bg/menu/sl/64", documentType: "COUNCIL_PROTOCOL", label: "Протоколи" },
  { path: "/bg/menu/sl/8", documentType: "COUNCIL_AGENDA", label: "Дневен ред" },
  { path: "/bg/menu/fl/33", documentType: "PUBLIC_CONSULTATION", label: "Обсъждания" },
  { path: "/bg/menu/fl/34", documentType: "PUBLIC_CONSULTATION", label: "Обявления" },
  { path: "/bg/menu/sl/12", documentType: "NEWS", label: "Новини" },
];

function extractContentId(href) {
  if (!href) return null;
  const m = href.match(/\/bg\/menu\/content\/(\d+)/);
  return m ? m[1] : null;
}

function parseBgDate(text) {
  if (!text) return null;
  const m = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function extractStructuredFields(text) {
  if (!text) return {};
  const amountMatch = text.match(/(\d[\d\s.,]{2,})\s*(лв\.?|BGN|бгн|евро|EUR|€)/i);
  let amount = null;
  let amountCurrency = null;
  if (amountMatch) {
    const n = parseFloat(amountMatch[1].replace(/\s/g, "").replace(",", "."));
    if (!Number.isNaN(n)) amount = n;
    const unit = amountMatch[2].toLowerCase();
    if (unit.startsWith("лв") || unit === "bgn" || unit === "бгн") {
      amountCurrency = "BGN";
    } else {
      amountCurrency = "EUR";
    }
  }
  const deadlineMatch = text.match(
    /(?:краен\s+срок|до\s+дата|подаване\s+до|срок\s*[:\-–])\s*(\d{1,2}[./]\d{1,2}[./]\d{4})/i,
  );
  const companyMatch = text.match(
    /(?:изпълнител|възложител|фирма|дружество|избран(?:ият)?\s+изпълнител)\s*[:\-–]\s*(.{3,120})/i,
  );
  return {
    amount,
    amountCurrency,
    deadlineDate: deadlineMatch ? parseBgDate(deadlineMatch[1]) : null,
    companyName: companyMatch ? companyMatch[1].trim().split(/\n/)[0].slice(0, 200) : null,
  };
}

async function collectLinksFromPage(page, maxLinks, seen) {
  const hrefs = await page.$$eval(
    "a[href*='/bg/menu/content/'], a[href*='/bg/menu/subcontent/']",
    (anchors) => anchors.map((a) => a.getAttribute("href")).filter(Boolean),
  );
  const ids = [];
  for (const href of hrefs) {
    const contentId = extractContentId(href);
    const subM = href.match(/\/bg\/menu\/subcontent\/(\d+)/);
    const key = contentId ? `c:${contentId}` : subM ? `s:${subM[1]}` : null;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    ids.push({
      key,
      kind: contentId ? "content" : "subcontent",
      id: contentId || subM[1],
    });
    if (ids.length >= maxLinks) break;
  }
  return ids;
}

async function findNextListingUrl(page, sectionPath, visitedUrls) {
  return page.evaluate(
    ({ path, visited }) => {
      const anchors = [...document.querySelectorAll("a[href]")];
      for (const a of anchors) {
        const text = (a.textContent || "").trim().toLowerCase();
        const href = a.getAttribute("href") || "";
        if (!href.includes("/bg/menu/")) continue;
        if (/следващ|next|»|›|напред/.test(text)) {
          try {
            const abs = new URL(href, location.origin).href;
            if (!visited.includes(abs)) return abs;
          } catch {
            /* skip */
          }
        }
      }
      for (const a of anchors) {
        const href = a.getAttribute("href") || "";
        if (!href.includes(path)) continue;
        const text = (a.textContent || "").trim();
        if (/^\d+$/.test(text)) {
          try {
            const abs = new URL(href, location.origin).href;
            if (!visited.includes(abs)) return abs;
          } catch {
            /* skip */
          }
        }
      }
      return null;
    },
    { path: sectionPath, visited: [...visitedUrls] },
  );
}

async function collectLinksFromSection(page, sectionPath, maxLinks) {
  const url = BASE + sectionPath;
  const seen = new Set();
  const all = [];
  const visitedUrls = [];
  let currentUrl = url;
  let pageCount = 0;

  while (all.length < maxLinks && pageCount < MAX_PAGES_PER_SECTION) {
    await gotoSmolyanPage(page, currentUrl);
    visitedUrls.push(currentUrl);
    pageCount++;
    const batch = await collectLinksFromPage(page, maxLinks - all.length, seen);
    all.push(...batch);
    if (all.length >= maxLinks) break;
    const nextUrl = await findNextListingUrl(page, sectionPath, visitedUrls);
    if (!nextUrl || nextUrl === currentUrl) break;
    currentUrl = nextUrl;
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }
  return all;
}

async function scrapePage(page, target) {
  const pathPrefix = target.kind === "subcontent" ? "subcontent" : "content";
  const url = `${BASE}/bg/menu/${pathPrefix}/${target.id}`;
  await gotoSmolyanPage(page, url);

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
    let rawContent = (bodyEl?.innerText || document.body.innerText || "")
      .replace(/\s+\n/g, "\n")
      .trim();
    const pdfLinks = [...document.querySelectorAll('a[href*=".pdf"], a[href*="/files/"]')]
      .map((a) => a.href)
      .filter((h) => h && (h.includes(".pdf") || h.includes("/files/")));
    if (pdfLinks.length > 0) {
      rawContent += "\n\n[Прикачени файлове]\n" + pdfLinks.join("\n");
    }
    rawContent = rawContent.slice(0, 80_000);
    const dateMatch = document.body.innerText.match(
      /(\d{1,2}[./]\d{1,2}[./]\d{4})|(\d{4}-\d{2}-\d{2})/,
    );
    return { title, rawContent, dateText: dateMatch ? dateMatch[0] : null, pdfLinks };
  });

  const structured = extractStructuredFields(data.rawContent);
  const documentType = target.documentType || inferDocumentType(pathnameOf(target.foundOn || ""));

  return {
    sourceId: `${pathPrefix}-${target.id}`,
    sourceUrl: data.pdfLinks?.[0] || url,
    documentType,
    title: data.title,
    rawContent: data.rawContent,
    publishedAt: parseBgDate(data.dateText),
    pdfUrls: data.pdfLinks ?? [],
    amount: structured.amount,
    amountCurrency: structured.amountCurrency,
    deadlineDate: structured.deadlineDate,
    companyName: structured.companyName,
    discoveredOn: target.foundOn || null,
  };
}

function assertSessionAvailable() {
  const s = sessionStatus();
  if (!s.hasStorageState && !s.hasChromeProfile) {
    const err = new Error(
      "Няма Cloudflare сесия (storage-state.json или .chrome-profile). " + cloudflareSetupHint(),
    );
    err.code = "SESSION_MISSING";
    throw err;
  }
}

/** Site-wide BFS discovery only — returns manifest JSON. */
export async function runDiscover() {
  assertSessionAvailable();
  const session = await createBrowserSession();
  try {
    const page = session.context.pages()[0] ?? (await session.context.newPage());
    return await discoverSite(page);
  } finally {
    await closeBrowserSession(session);
  }
}

async function collectSectionTargets(page, section, maxPerSection, globalSeen, targets) {
  console.log(`[monitor-scraper] Section: ${section.label}`);
  const batch = await collectLinksFromSection(page, section.path, maxPerSection);
  for (const t of batch) {
    if (globalSeen.has(t.key)) continue;
    globalSeen.add(t.key);
    targets.push({
      ...t,
      documentType: section.documentType,
      foundOn: section.path,
    });
  }
  console.log(`[monitor-scraper]   ${section.label}: ${batch.length} links`);
}

async function collectAllSectionTargets(context, maxPerSection) {
  const globalSeen = new Set();
  const targets = [];
  const failedSections = [];

  await runPool(
    SECTIONS,
    Math.min(LISTING_CONCURRENCY, SECTIONS.length),
    async (section, index) => {
      await sleep(index * 600);
      const page = await context.newPage();
      try {
        await collectSectionTargets(page, section, maxPerSection, globalSeen, targets);
      } catch (err) {
        if (/cloudflare/i.test(err.message)) failedSections.push(section);
        else console.warn(`[monitor-scraper] Listing failed ${section.path}:`, err.message);
      } finally {
        await page.close();
      }
    },
    { failFast: false },
  );

  if (failedSections.length > 0) {
    console.log(`[monitor-scraper] Retrying ${failedSections.length} sections sequentially…`);
    const page = await context.newPage();
    try {
      for (const section of failedSections) {
        await sleep(1200);
        try {
          await collectSectionTargets(page, section, maxPerSection, globalSeen, targets);
        } catch (err) {
          console.warn(`[monitor-scraper] Retry failed ${section.path}:`, err.message);
        }
      }
    } finally {
      await page.close();
    }
  }

  return targets;
}

async function scrapeTargetsParallel(context, targets) {
  const documents = [];
  let cfFailures = 0;
  let done = 0;
  const total = targets.length;

  await runPool(
    targets,
    CONCURRENCY,
    async (target) => {
      const page = await context.newPage();
      try {
        const doc = await scrapePage(page, target);
        if (doc.rawContent && doc.rawContent.length > 30) {
          documents.push(doc);
        }
        done++;
        if (done % 25 === 0 || done === total) {
          console.log(`[monitor-scraper]   content ${done}/${total} (${documents.length} docs)`);
        }
      } catch (err) {
        if (/cloudflare/i.test(err.message)) cfFailures++;
        else console.warn(`[monitor-scraper] Content ${target.key} failed:`, err.message);
      } finally {
        await page.close();
      }
    },
    { failFast: false },
  );

  const cloudflareBlocked = documents.length === 0 && cfFailures > 0;
  return { documents, cloudflareBlocked };
}

export async function runScrape(maxPerSection = 200) {
  assertSessionAvailable();
  const started = Date.now();

  const session = await createBrowserSession();
  let cloudflareBlocked = false;
  let discovery = null;

  try {
    const context = session.context;
    await warmupSmolyanSession(context);

    /** @type {{ key: string, kind: string, id: string, documentType: string, foundOn?: string }[]} */
    let targets = [];

    if (USE_FULL_DISCOVER) {
      console.log("[monitor-scraper] Phase 1: full-site discovery…");
      const page = context.pages()[0] ?? (await context.newPage());
      discovery = await discoverSite(page);
      targets = discovery.targets.map((t) => ({
        key: t.key,
        kind: t.kind,
        id: t.id,
        documentType: t.documentType,
        foundOn: t.foundOn,
      }));
      console.log(
        `[monitor-scraper] Discovery: ${discovery.visitedPages} pages, ${targets.length} targets`,
      );
    }

    if (targets.length === 0) {
      console.log(`[monitor-scraper] Phase 1: section crawl (${LISTING_CONCURRENCY} parallel tabs)…`);
      targets = await collectAllSectionTargets(context, maxPerSection);
    }

    const cap = Number(process.env.SMOLYAN_MAX_SCRAPE || 2000);
    if (targets.length > cap) {
      console.log(`[monitor-scraper] Capping scrape at ${cap} of ${targets.length} targets`);
      targets = targets.slice(0, cap);
    }

    console.log(`[monitor-scraper] Phase 2: scraping ${targets.length} pages (${CONCURRENCY} parallel)…`);
    const result = await scrapeTargetsParallel(context, targets);
    cloudflareBlocked = result.cloudflareBlocked;

    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    const documents = result.documents;

    if (documents.length === 0) {
      if (cloudflareBlocked) {
        const err = new Error(cloudflareSetupHint());
        err.code = "CLOUDFLARE_BLOCKED";
        throw err;
      }
      const err = new Error(
        "0 документа — Cloudflare сесията е невалидна или сайтът е празен. setup-session.bat → Enter",
      );
      err.code = "ZERO_DOCUMENTS";
      throw err;
    }

    console.log(
      `[monitor-scraper] Done: ${documents.length} documents in ${elapsed}s (${targets.length} targets)`,
    );
    return { documents, discovery };
  } finally {
    await closeBrowserSession(session);
  }
}
