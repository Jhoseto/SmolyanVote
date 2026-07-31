# smolyan.bg Playwright sidecar

Sidecar for **Граждански монитор** — scrapes council decisions, protocols, agenda, public consultations, and councilor profiles from smolyan.bg.

## Cloudflare (required)

smolyan.bg uses **Cloudflare Turnstile**. Playwright-controlled Chrome (even headed + stealth) often **loops the challenge** — you tick the box and it returns to "Един момент...".

**Fix:** `setup-session` now opens **real Google Chrome** via CDP (no automation flags). You pass Cloudflare in that window, then cookies are saved.

**One-time setup** (local Windows):

```bash
setup-session.bat
```

1. Chrome opens to `/bg/menu/sl/10`
2. Tick Cloudflare, wait for decisions list
3. If challenge returns → wait 15s, press **F5**, try again
4. Press **Enter** in the terminal when you see document links

Then:

```bash
cd scraper && npm run probe    # must show ok: true
start-scraper.bat
```

**Production:** `deploy.bat` uploads `scraper/storage-state.json` when present. Refresh every few weeks when cookies expire.

## URL structure (custom municipal CMS)

This site does **not** use WordPress/Joomla REST. Scraped paths:

| Path | Content |
|------|---------|
| `/bg/menu/sl/10` | Решения на ОбС |
| `/bg/menu/sl/64` | Протоколи |
| `/bg/menu/sl/8` | Дневен ред |
| `/bg/menu/fl/33` | Обществени обсъждания |
| `/bg/menu/content/{id}` | Document / profile detail |

Council profiles: `/bg/menu/sl/14`, `/bg/menu/sl/13`, `/bg/menu/sl/23`.

## Setup

```bash
cd scraper
npm install
npx playwright install chromium
```

If npm fails with SSL errors (Avast/AVG):

```bash
set NODE_OPTIONS=--use-system-ca
npm install
```

Or from repo root: `start-scraper.bat`

## Run

```bash
npm start
# listens on http://localhost:3099
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness + `hasStorageState` |
| `GET` | `/session-status` | Probe Cloudflare — opens listing page, returns link count |
| `POST` | `/scrape?maxPerSection=40` | Scrape documents → JSON for Spring ingest |
| `POST` | `/scrape-council` | Scrape councilor profiles |

## CLI (debug without HTTP server)

```bash
npm run probe              # test session (exit 0 = OK)
npm run scrape             # scrape documents to stdout
node index.js --once --council   # councilors to stdout
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `MONITOR_SCRAPER_DELAY_MS` | `7000` | Delay between page fetches |
| `MONITOR_SCRAPER_STORAGE_STATE` | `scraper/storage-state.json` | Cookie file path |
| `MONITOR_SCRAPER_HEADED` | `0` | `1` = headed browser (more reliable vs CF) |
| `MONITOR_SCRAPER_CHROME` | `0` | `1` = use installed Chrome channel |
| `MONITOR_SCRAPER_FLARESOLVERR` | — | e.g. `http://localhost:8191` |
| `PORT` | `3099` | HTTP sidecar port |

### FlareSolverr (optional)

```bash
docker run -d --name flaresolverr -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest
set MONITOR_SCRAPER_FLARESOLVERR=http://localhost:8191
npm run probe
```

Returns `cf_clearance` cookies injected into Playwright context when no `storage-state.json` exists.

## Spring config

```properties
monitor.scraper.url=http://localhost:3099
monitor.scraper.max-documents-per-section=40
```

Admin → Monitor → **smolyan.bg scrape** calls `POST /scrape`.

Scheduled: scrape daily at 06:00 Europe/Sofia.
