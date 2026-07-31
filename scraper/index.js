/**
 * HTTP sidecar for smolyan.bg scraper
 */

import http from "node:http";
import { hasChromeProfile, hasStorageState, probeSession, sessionStatus, cloudflareSetupHint } from "./lib/browser.js";
import { runDiscover, runScrape } from "./lib/scrape.js";
import { runCouncilScrape } from "./lib/scrape-council.js";

const PORT = Number(process.env.PORT || 3099);
const args = process.argv.slice(2);
let scraping = false;

async function runCli() {
  if (args.includes("--probe")) {
    const status = await probeSession();
    console.log(JSON.stringify(status, null, 2));
    process.exit(status.ok ? 0 : 1);
  }

  if (args.includes("--discover")) {
    try {
      const manifest = await runDiscover();
      console.log(JSON.stringify(manifest, null, 2));
      process.exit(0);
    } catch (err) {
      console.error(err.message || err);
      process.exit(1);
    }
  }

  if (args.includes("--once")) {
    const maxPerSection = Number(process.env.MAX_PER_SECTION || 80);
    try {
      if (args.includes("--council")) {
        const councilors = await runCouncilScrape();
        console.log(JSON.stringify({ count: councilors.length, councilors }, null, 2));
      } else {
        const { documents, discovery } = await runScrape(maxPerSection);
        console.log(JSON.stringify({ count: documents.length, discovery, documents }, null, 2));
      }
      process.exit(0);
    } catch (err) {
      console.error(err.message || err);
      process.exit(err.code === "CLOUDFLARE_BLOCKED" || err.code === "SESSION_MISSING" ? 2 : 1);
    }
  }

  startServer();
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);

    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          scraping,
          ...sessionStatus(),
          concurrency: Number(process.env.MONITOR_SCRAPER_CONCURRENCY || 8),
          delayMs: Number(process.env.MONITOR_SCRAPER_DELAY_MS || 300),
          fastMode: process.env.MONITOR_SCRAPER_FAST !== "0",
          fullDiscover: process.env.SMOLYAN_FULL_DISCOVER === "1",
        }),
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/session-status") {
      try {
        const status = await probeSession();
        res.writeHead(status.ok ? 200 : 503, { "Content-Type": "application/json" });
        res.end(JSON.stringify(status));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, message: err.message }));
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/discover") {
      if (scraping) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Job already in progress" }));
        return;
      }
      scraping = true;
      try {
        const manifest = await runDiscover();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(manifest));
      } catch (err) {
        res.writeHead(err.code === "SESSION_MISSING" ? 503 : 500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message, code: err.code || "DISCOVER_FAILED" }));
      } finally {
        scraping = false;
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/scrape") {
      if (scraping) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Scrape already in progress" }));
        return;
      }

      scraping = true;
      const maxPerSection = Number(url.searchParams.get("maxPerSection") || 80);
      console.log(`[monitor-scraper] Starting full scrape (max/section ${maxPerSection})`);

      try {
        if (process.env.MONITOR_SCRAPER_PREFLIGHT === "1") {
          const preflight = await probeSession();
          if (!preflight.ok) {
            const err = new Error(preflight.message || cloudflareSetupHint());
            err.code = "CLOUDFLARE_BLOCKED";
            throw err;
          }
        }

        const t0 = Date.now();
        const { documents, discovery } = await runScrape(maxPerSection);
        console.log(`[monitor-scraper] Done: ${documents.length} documents in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            documents,
            count: documents.length,
            discovery: discovery
              ? {
                  visitedPages: discovery.visitedPages,
                  listings: discovery.listings.length,
                  targets: discovery.targets.length,
                  pdfUrls: discovery.pdfUrls.length,
                }
              : null,
          }),
        );
      } catch (err) {
        console.error("[monitor-scraper] Fatal:", err);
        if (/cloudflare/i.test(err.message || "")) err.code = "CLOUDFLARE_BLOCKED";
        const status =
          err.code === "CLOUDFLARE_BLOCKED" || err.code === "SESSION_MISSING" || err.code === "ZERO_DOCUMENTS"
            ? 503
            : 500;
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: err.message || "Scrape failed",
            code: err.code || "SCRAPE_FAILED",
            hint:
              err.code === "SESSION_MISSING" || err.code === "ZERO_DOCUMENTS"
                ? "Run setup-session.bat → Enter, then npm run export-session"
                : undefined,
          }),
        );
      } finally {
        scraping = false;
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/scrape-council") {
      if (scraping) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Scrape already in progress" }));
        return;
      }
      scraping = true;
      console.log("[monitor-scraper] Starting council scrape");
      try {
        const councilors = await runCouncilScrape();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ councilors, count: councilors.length }));
      } catch (err) {
        console.error("[monitor-scraper] Council scrape failed:", err);
        const status = err.code === "CLOUDFLARE_BLOCKED" ? 503 : 500;
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: err.message || "Council scrape failed",
            code: err.code || "SCRAPE_FAILED",
            councilors: [],
            count: 0,
          }),
        );
      } finally {
        scraping = false;
      }
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  server.listen(PORT, () => {
    console.log(`[monitor-scraper] Listening on http://localhost:${PORT}`);
    console.log(
      "[monitor-scraper] GET /health  GET /session-status  POST /discover  POST /scrape?maxPerSection=80",
    );
  });
}

runCli();
