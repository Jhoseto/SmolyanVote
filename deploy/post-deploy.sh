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
  if [[ -d scraper/storage-state.json ]]; then
    rm -rf scraper/storage-state.json
  fi
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

# Free 80/443 — stale Caddy/nginx container or another compose project blocks Caddy.
free_web_ports() {
  local port cids cid name
  for port in 80 443; do
    cids=$(docker ps -q --filter "publish=${port}" 2>/dev/null || true)
    for cid in ${cids}; do
      [[ -z "${cid}" ]] && continue
      name=$(docker inspect --format '{{.Name}}' "${cid}" 2>/dev/null | sed 's|^/||' || echo "${cid}")
      echo "[ports] Stopping ${name} — holds host port ${port}"
      docker stop "${cid}" 2>/dev/null || true
    done
  done
  if command -v ss >/dev/null 2>&1; then
    if ss -tln 2>/dev/null | grep -q ':80 '; then
      echo "[WARN] Port 80 still in use after docker cleanup (often host nginx/apache)."
      echo "       On the server: sudo ss -tlnp | grep ':80'"
      echo "       Then: sudo systemctl stop nginx   OR   sudo systemctl stop apache2"
    fi
  fi
}

echo "[docker] Building and starting stack (backend + frontend + scraper + caddy)..."
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
free_web_ports

if [[ -d scraper/storage-state.json ]]; then
  rm -rf scraper/storage-state.json
  echo '{"cookies":[],"origins":[]}' > scraper/storage-state.json
  echo "[WARN] scraper/storage-state.json was a directory — recreated as file"
fi

docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# Drop legacy compose project containers (same dir, old project name "smolyanvote").
for legacy in smolyanvote-frontend smolyanvote-backend smolyanvote-caddy; do
  docker rm -f "${legacy}" 2>/dev/null || true
done

if [[ -f smolyanvote.service ]]; then
  cp smolyanvote.service /etc/systemd/system/smolyanvote.service
  systemctl daemon-reload
  systemctl enable smolyanvote.service >/dev/null 2>&1 || true
  echo "[boot] systemd smolyanvote.service enabled (docker compose up on reboot)"
fi

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
echo "=== Production URLs ==="
echo "  Site:    https://smolyanvote.com"
echo "  Monitor: https://smolyanvote.com/monitor"
echo "  Admin:   https://smolyanvote.com/admin"
echo "  Fallback (if DNS propagating): https://161-35-69-206.sslip.io"
echo ""
echo "=== Граждански монитор — първи deploy ==="
echo "  1. Отворете https://smolyanvote.com/monitor"
echo "  2. Влезте като admin → /admin?tab=monitor → Ingestion"
echo "  3. Пуснете „Пълен pipeline“ или поне SIGMA import (отнема ~5 мин)"
echo "  4. По график: SIGMA 04:00, EOP 05:00, scrape 06:00, AI 06:30 (Europe/Sofia)"
echo ""
echo "=== Cloudflare (if used) ==="
echo "  DNS-only until LE cert works, then SSL/TLS → Full (strict), optional Proxied"
echo ""
echo "=== Deploy finished ==="
docker compose -f docker-compose.prod.yml ps
