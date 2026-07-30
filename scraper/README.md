# smolyan.bg Playwright sidecar

Sidecar for **Граждански монитор** — scrapes council decisions, protocols, agenda, public consultations, and councilor profiles from smolyan.bg.

## Setup

```bash
cd scraper
npm install
npx playwright install chromium
```

If npm fails with SSL errors (Avast/AVG), try:

```bash
npm install --use-system-ca
```

## Run

```bash
npm start
# listens on http://localhost:3099
```

Health check:

```bash
curl http://localhost:3099/health
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Sidecar liveness |
| `POST` | `/scrape?maxPerSection=40` | Scrape decisions, protocols, agenda, consultations → JSON for Spring ingest |
| `POST` | `/scrape-council` | Scrape municipal councilor list → sync via admin **Sync съветници** |

Manual scrape:

```bash
curl -X POST "http://localhost:3099/scrape?maxPerSection=40"
curl -X POST http://localhost:3099/scrape-council
```

From Spring Boot admin (`/admin?tab=monitor`):

- **smolyan.bg scrape** — calls `/scrape`
- **Sync съветници** — calls `/scrape-council`
- **Пълен pipeline** — SIGMA → EOP → scrape → AI → TR → councilors

## Spring config

`application.properties`:

```properties
monitor.scraper.url=http://localhost:3099
monitor.scraper.max-documents-per-section=40

monitor.ingestion.scheduler-enabled=true
monitor.ingestion.eop-days=7
monitor.ingestion.ai-batch-limit=25
```

Scheduled jobs (server time): SIGMA 04:00, EOP 05:00, scrape 06:00, AI batch 06:30.

## Docker

Production compose includes a `scraper` service built from this directory. Backend reaches it at `http://scraper:3099` inside the network.
