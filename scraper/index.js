/**
 * HTTP sidecar for smolyan.bg scraper — POST /scrape
 * Default port 3099 (monitor.scraper.url in Spring Boot)
 */

import http from "node:http";
import { runScrape } from "./lib/scrape.js";
import { runCouncilScrape } from "./lib/scrape-council.js";

const PORT = Number(process.env.PORT || 3099);
let scraping = false;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", scraping }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/scrape") {
    if (scraping) {
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Scrape already in progress" }));
      return;
    }

    scraping = true;
    const maxPerSection = Number(url.searchParams.get("maxPerSection") || 40);
    console.log(`[monitor-scraper] Starting scrape (max ${maxPerSection}/section)`);

    try {
      const documents = await runScrape(maxPerSection);
      console.log(`[monitor-scraper] Done: ${documents.length} documents`);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ documents, count: documents.length }));
    } catch (err) {
      console.error("[monitor-scraper] Fatal:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "Scrape failed" }));
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
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "Council scrape failed" }));
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
  console.log("[monitor-scraper] GET /health  POST /scrape?maxPerSection=40");
});
