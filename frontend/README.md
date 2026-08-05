# SmolyanVote — Next.js frontend

Modern UI for [SmolyanVote](https://smolyanvote.com) (React 19 + Next.js + Tailwind). Talks to the existing Spring Boot backend over JWT REST + native WebSocket (STOMP/notifications).

Roadmap: [`../MODERN_FRONTEND_PLAN.md`](../MODERN_FRONTEND_PLAN.md)  
Legacy UI isolation (Next-only testing): [`../docs/CUTOVER.md`](../docs/CUTOVER.md)

## Dev

```bash
# From repo root — starts backend :2662 + this app :3000
..\restart.bat

# Or frontend only:
cp .env.local.example .env.local   # once
npm install
npm run dev                        # http://localhost:3000
```

Required env (see `.env.local.example`):

- `NEXT_PUBLIC_API_URL` — default `http://localhost:2662`
- `NEXT_PUBLIC_BACKEND_ORIGIN` — Spring origin for OAuth start (prod: `https://smolyanvote.com`)
- `NEXT_PUBLIC_LIVEKIT_URL` — calls

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next dev server `:3000` |
| `npm run build` / `start` | Production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint + boundaries |
| `npm run depcruise` | Architecture DAG |
| `npm test` / `npx vitest run` | Unit tests |
| `npm run test:e2e` | Playwright (all viewports) |

Authenticated E2E needs `E2E_USER_EMAIL` + `E2E_USER_PASSWORD`.

## Architecture

Feature folders under `src/features/*` (events, publications, signals, podcast, messenger, admin, …). Cross-feature composition only in `src/app/**` or providers. Shared UI in `src/shared/`.
