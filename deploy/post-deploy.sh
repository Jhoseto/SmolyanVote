#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== SmolyanVote post-deploy ==="

if [[ ! -f artifacts/app.jar ]]; then
  echo "[ERROR] Missing artifacts/app.jar"
  exit 1
fi
if [[ ! -f artifacts/frontend/server.js ]]; then
  echo "[ERROR] Missing artifacts/frontend/server.js"
  exit 1
fi
if [[ ! -f scraper/Dockerfile ]]; then
  echo "[ERROR] Missing scraper/Dockerfile (monitor sidecar)"
  exit 1
fi

if [[ ! -f scraper/storage-state.json ]]; then
  echo '{"cookies":[],"origins":[]}' > scraper/storage-state.json
  echo "[WARN] scraper/storage-state.json missing — smolyan.bg scrape blocked by Cloudflare"
  echo "       Locally: setup-session.bat  then redeploy (uploads storage-state.json)"
fi

if [[ ! -f firebase-service-account.json ]]; then
  echo "[WARN] firebase-service-account.json missing — push notifications disabled until uploaded"
  if [[ -f firebase-service-account.json.placeholder ]]; then
    cp firebase-service-account.json.placeholder firebase-service-account.json
  else
    echo '{}' > firebase-service-account.json
  fi
fi

echo "[docker] Building and starting stack (backend + frontend + scraper + caddy)..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo "[health] Waiting for services..."
sleep 8

check() {
  local name="$1"
  local url="$2"
  if curl -sf "$url" >/dev/null 2>&1; then
    echo "  OK  $name"
    return 0
  fi
  echo "  WARN  $name ($url) — not ready yet"
  return 1
}

check_json() {
  local name="$1"
  local url="$2"
  if curl -sf "$url" | head -c 1 | grep -qE '[\[{]'; then
    echo "  OK  $name"
    return 0
  fi
  echo "  WARN  $name ($url) — not ready yet"
  return 1
}

check "scraper" "http://127.0.0.1:3099/health" || true
check "backend" "http://127.0.0.1:2662/actuator/health" || true
check "frontend" "http://127.0.0.1:3000/" || true
check "monitor UI" "http://127.0.0.1:3000/monitor" || true
check_json "monitor API" "http://127.0.0.1:2662/api/v1/monitor/municipalities" || true

if [[ -f .env ]] && grep -q '^GEMINI_API_KEY=.\+' .env 2>/dev/null; then
  echo "  OK  GEMINI_API_KEY set in .env"
else
  echo "  WARN  GEMINI_API_KEY missing — monitor AI summaries will use fallbacks"
fi

if [[ -f .env ]] && grep -q '^MONITOR_SCRAPER_URL=' .env 2>/dev/null; then
  url="$(grep '^MONITOR_SCRAPER_URL=' .env | cut -d= -f2- | tr -d '\r')"
  echo "  OK  MONITOR_SCRAPER_URL=${url}"
else
  echo "  OK  MONITOR_SCRAPER_URL default http://scraper:3099 (Docker network)"
fi

echo ""
echo "=== Граждански монитор — първи deploy ==="
echo "  1. Отворете https://smolyanvote.com/monitor (или http://YOUR_IP/monitor)"
echo "  2. Влезте като admin → /admin?tab=monitor → Ingestion"
echo "  3. Пуснете „Пълен pipeline“ или поне SIGMA import (отнема ~5 мин)"
echo "  4. По график: SIGMA 04:00, EOP 05:00, scrape 06:00, AI 06:30 (Europe/Sofia)"
echo ""
echo "=== Deploy finished ==="
docker compose -f docker-compose.prod.yml ps
