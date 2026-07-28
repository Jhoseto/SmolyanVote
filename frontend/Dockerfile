# Production Next.js (standalone) — built by NewServerConfig/docker-compose.prod.yml
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
# Internal Docker hostname for Next rewrites/SSR only — never bake into browser OAuth URLs.
ARG API_INTERNAL_URL=http://backend:2662
# Public origin the browser uses for Google/Facebook OAuth start (Caddy → Spring).
ARG NEXT_PUBLIC_BACKEND_ORIGIN=https://smolyanvote.com
ENV API_INTERNAL_URL=$API_INTERNAL_URL
ENV NEXT_PUBLIC_BACKEND_ORIGIN=$NEXT_PUBLIC_BACKEND_ORIGIN
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Low-RAM Docker hosts (1GB Droplets): cap Node heap and use webpack to avoid OOM during build.
ENV NODE_OPTIONS=--max-old-space-size=512
RUN npm run build -- --webpack

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
