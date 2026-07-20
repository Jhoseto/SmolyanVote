# Backend cleanup (Next-first)

Conservative pass: remove only code with a proven Next + `/api/v1` (or other live API) replacement.  
**Do not delete** hybrid/legacy surfaces that mobile or unfinished Next features may still need.

## `controllers/apiv1` naming

Package = version. Class names are clean domain names (no `ApiV1` prefix):

| File | Base path |
|------|-----------|
| `AuthController` | `/api/v1/auth` |
| `ContactController` | `/api/v1/contact` |
| `EventsController` | `/api/v1/events` |
| `PublicationsController` | `/api/v1/publications` |
| `PublicationsSidebarController` | `/api/v1/publications/sidebar` |
| `SignalsController` | `/api/v1/signals` |
| `StatsController` | `/api/v1/stats` |
| `SubscriptionController` | `/api/v1/subscriptions` |
| `UsersController` | `/api/v1/users` |
| `VotesController` | `/api/v1/votes` |

Legacy hybrids kept outside the package: `LegacyPublicationsController`, `LegacySignalsController`.

## Removed (this pass)

### Controllers (Thymeleaf/form HTML — replaced by Next + ApiV1)
- `LoginController` → Next `/login` + `/api/mobile/auth/login`
- `PasswordResetController` → Next + `/api/v1/auth/forgot-password` / `reset-password`
- `ContactController` → Next + `/api/v1/contact`
- `MainEventsController` → Next `/events` + `/api/v1/events`
- `VoteController` → `/api/v1/votes/**`
- `SimpleEventController` / `ReferendumController` / `MultiPollController` → `/api/v1/events/**` + votes
- `SubscriptionController` → `/api/v1/subscriptions`
- `EventExistenceController` — Thymeleaf notification helper (unused by Next)
- `PublicationsLinkController` — superseded by `GET /api/v1/publications/link-preview`

### Other
- `GlobalExceptionHandler` rewritten to JSON / Next redirect (no Thymeleaf view names)
- Security matchers cleaned for deleted form/exists/links routes

## Intentionally kept (not dead)

| Keep | Why |
|------|-----|
| All `ApiV1*` | Primary Next API |
| `MobileAuthController`, `MobileDeviceController`, `MobileProfileController` | SVMessengerMobile |
| `RegisterController` | Mobile config still references registration path family; verify before delete |
| `UserController` | Hybrid profile JSON; Next uses v1 but mobile/legacy may still hit `/api/user/**` |
| `LegacyPublicationsController` | Large legacy `/publications/api/**` — not proven unused for all clients |
| `LegacySignalsController` | Legacy `/signals` REST — superseded by v1, keep until confirmed unused |
| `PodcastController` | Serves `/api/podcast/**` + admin upload (no Next admin podcast UI yet) |
| `AdminController` | `/admin/api/**` used by Next admin |
| Admin reports/users/activity REST | Next admin |
| Comments / notifications / follow / reports / heartbeat | Next |
| SVMessenger REST + WS + Translation | Next messenger |
| `MainController` | `/robots.txt` and leftover page redirects until SEO cutover |
| `EmailConfirmationController`, `CustomErrorController` | Old links / Spring error plumbing → Next |
| `FrontendRedirectViewResolver`, `LegacyUiIsolationFilter` | Bridge while hybrid controllers remain |
| Domain services / repositories | Shared by ApiV1 — never delete with controllers alone |
| `static/images/**` defaults | API DTOs still return `/images/eventImages/...` paths |
| ~~`static/css/**`, `static/js/**`, legacy svmessenger JS/CSS~~ | **Removed** — unused by Next |

## Next cleanup candidates (after traffic/mobile check)

1. Strip HTML-only methods from `PodcastController`, `AdminController`, `UserController`, `PublicationsController`, `MainController`
2. Delete `SignalsController`, `RegisterController` if mobile uses only `/api/v1` / `/api/mobile`
3. Delete unused `static/css`, `static/js`, legacy `static/svmessenger` JS/CSS
4. Narrow security `permitAll` HTML route list once hybrids are gone
