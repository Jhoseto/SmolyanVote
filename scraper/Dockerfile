FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY index.js healthcheck.mjs ./
COPY lib ./lib/
RUN test -f lib/browser.js && test -f lib/scrape.js

ENV PORT=3099
ENV MONITOR_SCRAPER_STORAGE_STATE=/app/storage-state.json
# Headless Linux container — no local Chrome/CDP
ENV MONITOR_SCRAPER_CDP=0
EXPOSE 3099

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "healthcheck.mjs"]

CMD ["node", "index.js"]
