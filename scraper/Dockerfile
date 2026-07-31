FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY index.js lib ./

ENV PORT=3099
ENV MONITOR_SCRAPER_STORAGE_STATE=/app/storage-state.json
EXPOSE 3099

CMD ["node", "index.js"]
