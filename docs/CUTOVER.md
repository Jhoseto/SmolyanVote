# Next-only manual testing (legacy UI isolation)

Phases 0–10 of [`MODERN_FRONTEND_PLAN.md`](../MODERN_FRONTEND_PLAN.md) deliver functional parity on `http://localhost:3000`. **Archive/delete of Thymeleaf is not required for testing** — legacy HTML is isolated by redirect.

## Local stack

| Surface | URL | Role |
|---------|-----|------|
| Next.js UI | `http://localhost:3000` | **Only UI** for manual testing |
| Spring Boot | `http://localhost:2662` | REST + WS + OAuth; browser HTML → 302 to Next |

Start both via root [`restart.bat`](../restart.bat) (opens the Next URL after ~18s).

## How isolation works

- Property: `smolyanvote.frontend.legacy-redirect-enabled=true` (default; env `SMOLYANVOTE_LEGACY_REDIRECT`)
- Frontend origin: `smolyanvote.frontend.url` (default `http://localhost:3000`; env `SMOLYANVOTE_FRONTEND_URL`)
- Filter: `LegacyUiIsolationFilter` — redirects **browser document** navigations (GET/HEAD + `Sec-Fetch-Dest: document` or `Accept: text/html`) to Next, with path aliases (`/viewLogin` → `/login`, `/mainEvents` → `/events`, …).
- **Not redirected:** `/api/**`, `/ws*`, `/oauth2/**`, `/login/oauth2/**`, static `/images|css|js|fonts/**`.
- **No Thymeleaf:** dependency removed; leftover MVC view names → 302 to Next (`FrontendRedirectViewResolver`). Emails use plain HTML in `src/main/resources/email/`.
- **Virtual Mayor:** removed (no routes, static, or package scan).
- Next UI images used in testing live under `frontend/public/images/`.
- OAuth failure/success and Spring logout redirect to the Next origin.

To temporarily re-enable legacy Thymeleaf pages in the browser:

```bat
set SMOLYANVOTE_LEGACY_REDIRECT=false
gradlew.bat bootRun
```

## Manual test checklist

1. Open only `http://localhost:3000` (or let `restart.bat` open it).
2. Confirm `http://localhost:2662/` in the browser lands on Next (302).
3. Smoke: login → vote → comment → publication → signal → messenger → admin (ADMIN).
4. Optional automated gates: typecheck/lint/build/vitest/playwright as in Phase 10.

## Backend cleanup

See [`BACKEND_CLEANUP.md`](BACKEND_CLEANUP.md) — dead Thymeleaf form controllers + static css/js removed; hybrid APIs intentionally kept until mobile/traffic verified.

## Later (optional)

After production traffic is on Next and signed off, remaining hybrid controllers (`PublicationsController` HTML methods, `SignalsController`, etc.) can be stripped in a dedicated PR.
