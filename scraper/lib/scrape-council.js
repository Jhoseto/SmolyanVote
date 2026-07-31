/**
 * Scrape Общински съвет from smolyan.bg — party accordion on /bg/menu/sl/13.
 * Councilors are hidden in JS tabs (href="#"), NOT in /content/ links.
 */

import {
  BASE,
  cloudflareSetupHint,
  closeBrowserSession,
  createBrowserSession,
  gotoSmolyanPage,
  sleep,
} from "./browser.js";

const COUNCILORS_LIST_PAGE = "/bg/menu/sl/13";
const PRESIDENT_PAGE = "/bg/menu/sl/14";

function normalizeParty(label) {
  return label
    .replace(/^група\s+на\s+/i, "")
    .replace(/^политическа\s+партия\s+/i, "")
    .replace(/[„""''"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMemberLine(line) {
  const t = line.replace(/\u00a0/g, " ").trim();
  if (!t || t.length < 5) return null;

  const leader = t.match(/^(.+?)\s*[-–—]\s*ръководител\s+на\s+групата\s*$/i);
  if (leader) {
    return { name: normalizeName(leader[1]), role: "Ръководител на парламентарна група" };
  }

  const name = normalizeName(t.replace(/\s*[-–—]\s*/g, " "));
  if (isPersonName(name)) {
    return { name, role: "Съветник" };
  }
  return null;
}

function normalizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function isPersonName(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 5) return false;
  if (/^(Ин|Туризъм|Спорт|Администрация|Начало|Общински)/i.test(name)) return false;
  return parts.every((p) => /^[А-ЯA-Z][а-яa-z\-']+$/.test(p));
}

async function clickPartyTab(page, label) {
  await page.evaluate((text) => {
    const normalized = text.replace(/\s+/g, " ").trim();
    const a = [...document.querySelectorAll("a[href$='#']")].find(
      (el) => (el.textContent || "").replace(/\s+/g, " ").trim() === normalized,
    );
    a?.click();
  }, label);
}

async function readVisibleMembers(page) {
  return page.evaluate(() => {
    const h1 = [...document.querySelectorAll("h1")].find((h) =>
      /общински съветници/i.test(h.textContent || ""),
    );
    const root = h1?.closest("article") || h1?.parentElement || document.querySelector("#main-content");
    if (!root) return [];

    return [...root.querySelectorAll("li")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.width > 0;
      })
      .map((el) => el.textContent.replace(/\u00a0/g, " ").trim())
      .filter((t) => t.length >= 5 && t.length < 80);
  });
}

async function scrapePartyGroups(page) {
  await gotoSmolyanPage(page, BASE + COUNCILORS_LIST_PAGE);

  const partyLabels = await page.$$eval("a[href$='#']", (anchors) =>
    anchors
      .map((a) => (a.textContent || "").trim())
      .filter((t) => /група|партия|коалиция/i.test(t)),
  );

  if (partyLabels.length === 0) {
    throw new Error("Не са намерени парламентарни групи на /bg/menu/sl/13");
  }

  /** @type {Map<string, { name: string, role: string, party: string, sourceUrl: string }>} */
  const byName = new Map();

  for (const label of partyLabels) {
    await gotoSmolyanPage(page, BASE + COUNCILORS_LIST_PAGE);
    await clickPartyTab(page, label);
    await sleep(500);

    const party = normalizeParty(label);
    const lines = await readVisibleMembers(page);

    for (const line of lines) {
      const parsed = parseMemberLine(line);
      if (!parsed) continue;

      const key = parsed.name.toLowerCase();
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, {
          name: parsed.name,
          role: parsed.role,
          party,
          sourceUrl: BASE + COUNCILORS_LIST_PAGE,
        });
      } else if (parsed.role.includes("Ръководител") && !existing.role.includes("Ръководител")) {
        existing.role = parsed.role;
        existing.party = party;
      }
    }

    console.log(`[monitor-scraper]   ${party}: ${lines.length} members visible`);
  }

  return [...byName.values()];
}

async function scrapePresident(page) {
  await gotoSmolyanPage(page, BASE + PRESIDENT_PAGE);
  const name = await page.evaluate(() => {
    const h1 = document.querySelector("h1")?.textContent?.trim();
    if (!h1 || h1.length < 6) return null;
    if (/общински|меню|администрация/i.test(h1)) return null;
    return h1;
  });

  if (!name) return null;

  const normalized = normalizeName(name);
  if (!isPersonName(normalized)) return null;

  return {
    name: normalized,
    role: "Председател на ОбС",
    party: null,
    mandate: "2023–2027",
    sourceUrl: BASE + PRESIDENT_PAGE,
  };
}

export async function runCouncilScrape() {
  const session = await createBrowserSession();
  let cloudflareBlocked = false;

  try {
    const page = session.context.pages()[0] ?? (await session.context.newPage());
    console.log("[monitor-scraper] Council: party accordions on sl/13…");

    let councilors = [];
    try {
      councilors = await scrapePartyGroups(page);
    } catch (err) {
      if (/cloudflare/i.test(err.message)) cloudflareBlocked = true;
      else throw err;
    }

    try {
      const president = await scrapePresident(page);
      if (president) {
        const key = president.name.toLowerCase();
        const idx = councilors.findIndex((c) => c.name.toLowerCase() === key);
        if (idx >= 0) {
          councilors[idx].role = "Председател на ОбС";
        } else {
          councilors.push(president);
        }
      }
    } catch (err) {
      if (/cloudflare/i.test(err.message)) cloudflareBlocked = true;
      console.warn("[monitor-scraper] President page failed:", err.message);
    }

    councilors = councilors.map((c) => ({
      ...c,
      mandate: "2023–2027",
    }));

    if (councilors.length === 0 && cloudflareBlocked) {
      const err = new Error(cloudflareSetupHint());
      err.code = "CLOUDFLARE_BLOCKED";
      throw err;
    }

    console.log(`[monitor-scraper] Council scrape: ${councilors.length} councilors (verified accordion)`);
    return councilors;
  } finally {
    await closeBrowserSession(session);
  }
}
