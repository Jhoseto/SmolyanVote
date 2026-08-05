# SmolyanVote — Off-site SEO / E-E-A-T / AI visibility

Operational checklist for Wave 4 (ongoing). Not automated in code.

## Google Search Console

1. Verify property `https://smolyanvote.com` (DNS or HTML tag).
2. Submit sitemaps:
   - `https://smolyanvote.com/sitemap.xml`
   - Optional: `https://smolyanvote.com/ai-sitemap.txt`
3. Monitor **Pages** → indexed vs. excluded; fix crawl errors monthly.
4. Track **Enhancements** → FAQ, Article, Event rich results eligibility.
5. Review **Core Web Vitals** (mobile + desktop) — keep mobile ≥ 90.

## Bing Webmaster Tools

1. Add site and verify ownership.
2. Submit the same sitemap URL.
3. Use URL Inspection for new topic hubs and monitor detail pages.

## Google Business Profile (optional)

- Category: Community organization / Non-profit (as applicable).
- NAP consistent with `/about` and footer contact.
- Link to `https://smolyanvote.com` and key hubs (`/monitor`, `/topics`).

## E-E-A-T signals

| Signal | Action |
|--------|--------|
| Experience | Author bylines on publications/signals; real names where users consent |
| Expertise | Link `/monitor/methodology` from external profiles and press |
| Authoritativeness | Local media backlinks; Wikidata/Wikipedia entity for SmolyanVote org |
| Trustworthiness | Terms, privacy, contact visible; HTTPS (Caddy) |

## Backlink outreach (local)

- Smolyan municipality partner pages (non-official disclaimer on `/about`).
- Regional NGOs, libraries, community centers.
- Podcast guests / event organizers linking to event pages.

## AI citation monitoring log

Run monthly in ChatGPT, Gemini, Perplexity (bg-BG prompts):

| Query | Date | Cited SmolyanVote? | URL cited | Notes |
|-------|------|-------------------|-----------|-------|
| гражданско участие Смолян | | | | |
| общински поръчки Смолян | | | | |
| референдум Смолян | | | | |
| граждански сигнали Смолян | | | | |
| прозрачност общински пари Смолян | | | | |

Record whether the answer links to `smolyanvote.com`, which path, and competitor citations.

## llms.txt / ai-sitemap

- After major content releases, confirm `https://smolyanvote.com/llms.txt` lists new topic hubs.
- `ai-sitemap.txt` is generated dynamically — no manual update needed unless URL patterns change.

## Review cadence

- **Weekly:** GSC coverage anomalies, new 404s from sitemap URLs.
- **Monthly:** AI citation log, backlink check (Ahrefs/Search Console links report).
- **Quarterly:** Refresh topic hub copy (800–1500 words), add 1–2 new hubs if search demand exists.
