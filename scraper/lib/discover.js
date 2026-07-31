/**
 * Full-site discovery for smolyan.bg — finds all menu listings, content pages, PDFs.
 * BFS crawl from seeds; respects rate limit; maps "hidden" menu branches.
 */

import { BASE, DELAY_MS, FAST_MODE, gotoSmolyanPage, sleep } from "./browser.js";

const MAX_PAGES = Number(process.env.SMOLYAN_MAX_DISCOVER || 80);
const DISCOVER_DELAY = FAST_MODE ? Math.min(DELAY_MS, 150) : DELAY_MS;

const SEEDS = [
  "/bg/home",
  "/bg/news/summary",
  "/bg/menu/sl/10",
  "/bg/menu/sl/64",
  "/bg/menu/sl/8",
  "/bg/menu/fl/33",
  "/bg/menu/sl/14",
  "/bg/menu/sl/13",
  "/bg/menu/sl/23",
];

/** Known municipal CMS paths — expanded as discovery finds more sl/fl IDs. */
const LISTING_PATH = /^\/bg\/menu\/(sl|fl)\/\d+/;
const CONTENT_PATH = /^\/bg\/menu\/content\/(\d+)/;
const SUBCONTENT_PATH = /^\/bg\/menu\/subcontent\/(\d+)/;
const CRAWL_PATH =
  /^\/bg\/(home|news|menu|page|pages|documents|document|files|file|search|contacts|contact)/;

export function normalizeSmolyanUrl(href) {
  if (!href) return null;
  try {
    const u = new URL(href, BASE);
    if (!u.hostname.includes("smolyan.bg")) return null;
    u.hash = "";
    let path = u.pathname.replace(/\/+$/, "") || "/";
    return `https://www.smolyan.bg${path}${u.search || ""}`;
  } catch {
    return null;
  }
}

export function pathnameOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function inferDocumentType(listingPath) {
  if (!listingPath) return "NEWS";
  if (listingPath.includes("/sl/10")) return "COUNCIL_DECISION";
  if (listingPath.includes("/sl/64")) return "COUNCIL_PROTOCOL";
  if (listingPath.includes("/sl/8")) return "COUNCIL_AGENDA";
  if (listingPath.includes("/fl/33") || listingPath.includes("/fl/34")) return "PUBLIC_CONSULTATION";
  if (listingPath.includes("/sl/12") || listingPath.includes("/news")) return "NEWS";
  if (listingPath.includes("/fl/")) return "PUBLIC_CONSULTATION";
  if (listingPath.includes("/sl/")) return "COUNCIL_DECISION";
  return "NEWS";
}

/**
 * Crawl smolyan.bg and return all content targets + site map metadata.
 */
export async function discoverSite(page) {
  const queue = SEEDS.map((s) => BASE + s);
  const visited = new Set();
  /** @type {Map<string, { kind: 'content'|'subcontent', documentType: string, foundOn: string }>} */
  const targets = new Map();
  const listings = new Set();
  const pdfUrls = new Set();
  const menuLinks = new Set();

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const url = normalizeSmolyanUrl(queue.shift());
    if (!url || visited.has(url)) continue;
    visited.add(url);

    const pathname = pathnameOf(url);
    if (LISTING_PATH.test(pathname)) {
      listings.add(pathname);
    }

    try {
      await gotoSmolyanPage(page, url);
    } catch (err) {
      console.warn(`[discover] skip ${pathname}: ${err.message}`);
      continue;
    }

    const extracted = await page.evaluate(() => {
      const links = [...document.querySelectorAll("a[href]")].map((a) => ({
        href: a.href,
        text: (a.textContent || "").trim().slice(0, 100),
      }));
      const pdfs = [...document.querySelectorAll('a[href*=".pdf"], a[href*="/files/"]')].map(
        (a) => a.href,
      );
      return { links, pdfs, title: document.title };
    });

    const currentListing = LISTING_PATH.test(pathname) ? pathname : null;
    const docType = inferDocumentType(currentListing || pathname);

    for (const pdf of extracted.pdfs) {
      const n = normalizeSmolyanUrl(pdf);
      if (n) pdfUrls.add(n);
    }

    for (const { href, text } of extracted.links) {
      const n = normalizeSmolyanUrl(href);
      if (!n) continue;
      const p = pathnameOf(n);

      const contentM = p.match(CONTENT_PATH);
      const subM = p.match(SUBCONTENT_PATH);

      if (contentM) {
        targets.set(`c:${contentM[1]}`, {
          kind: "content",
          id: contentM[1],
          documentType: docType,
          foundOn: pathname,
          linkText: text,
        });
      } else if (subM) {
        targets.set(`s:${subM[1]}`, {
          kind: "subcontent",
          id: subM[1],
          documentType: docType,
          foundOn: pathname,
          linkText: text,
        });
      } else if (LISTING_PATH.test(p)) {
        listings.add(p);
        menuLinks.add(p);
        if (!visited.has(n)) queue.push(n);
      } else if (CRAWL_PATH.test(p) && !p.includes("/content/") && !visited.has(n)) {
        queue.push(n);
      }

      if (n.includes(".pdf") || n.includes("/files/")) {
        pdfUrls.add(n);
      }
    }

    console.log(
      `[discover] ${visited.size}/${MAX_PAGES} ${pathname} → targets=${targets.size} listings=${listings.size}`,
    );
    await sleep(DISCOVER_DELAY);
  }

  return {
    visitedPages: visited.size,
    listings: [...listings].sort(),
    menuLinks: [...menuLinks].sort(),
    targets: [...targets.entries()].map(([key, v]) => ({ key, ...v })),
    pdfUrls: [...pdfUrls],
  };
}
