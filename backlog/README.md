# Backlog

## Engineering Standards (All Stories)

Every story in this backlog implicitly includes:

- **TDD**: Tests are written before implementation. The acceptance criteria define the test cases.
- **Strict TypeScript**: `strict: true`, zero `any` usage, enforced via `@typescript-eslint/no-explicit-any`.
- **Type-safe boundaries**: All data crossing a boundary (cookie parsing, API payloads, config loading, locale files) is validated at runtime with typed errors, not thrown exceptions.

## Architecture

**Worker model: reverse proxy with HTML injection.** The Cloudflare Worker sits on a route of the host site (e.g., `example.com/*`). It intercepts HTML responses using `HTMLRewriter`, injecting the banner `<script>` tag into `<head>` and inlining the resolved runtime context (consent model, GPC state, geo info) as a JSON payload in a `<script id="ig-consent-bootstrap">` tag. The consent API endpoints (`POST /consent`, `GET /consent/*`) live on the same Worker origin — no CORS needed because everything is same-origin. The consent cookie uses `Domain=.example.com` so it's readable across subdomains.

**Multi-site model (v1): one Worker deployment per site.** Each site gets its own Worker with its own `config.json`, D1 database, and locale files. Shared-Worker / multi-tenant config is out of scope for v1.

## Epics

| # | Epic | Stories | Scope |
|---|---|---|---|
| 0 | [Dev & Test Infrastructure](epic-00-dev-infrastructure.md) | 0.1–0.4 | Test skeleton site, geo/GPC overrides, responsive verification, Vitest setup |
| 1 | [Config & Types](epic-01-config-and-types.md) | 1.1–1.4 | TypeScript types, config schema, versioning, i18n |
| 2 | [Cloudflare Worker](epic-02-cloudflare-worker.md) | 2.1–2.5 | Geolocation, GPC detection, cookie reading, consent record API, HTML injection |
| 3 | [Client-Side Core](epic-03-client-side-core.md) | 3.1–3.4 | Consent state manager, GPC client-side, Google Consent Mode, script blocking |
| 4 | [Banner & Modal UI](epic-04-banner-ui.md) | 4.1–4.7 | Opt-in banner, opt-out banner, notice-only banner, preference modals, theming |
| 5 | [Cookie Scanner CLI](epic-05-cookie-scanner.md) | 5.1–5.2 | CLI scanner tool, inventory integration |
| 6 | [Deployment & Integration](epic-06-deployment-and-integration.md) | 6.1, 6.3 (6.2 post-v1) | Wrangler deployment, audit query endpoints |

## Suggested Build Order

```
Epic 0 (dev infra: skeleton HTML, Vitest, geo overrides)
  → Epic 1 (types & config, draft en.json copy)
    → Epic 2 Stories 2.1–2.4 (Worker logic) + Epic 3 (client-side core) in parallel
      → Story 2.5 (HTMLRewriter — uses stub banner JS for testing)
      → Epic 4 (UI) depends on Epic 3; visually verified via test site + Chrome MCP
        → [GATE] Approve final English copy → translate to fr, de, es, it, nl, pt
          → Epic 6 (deployment: bundles real banner JS, wires up HTMLRewriter with real bundle)
Epic 5 (cookie scanner) is independent — can be built anytime
```

**Note on Story 0.1 phasing:** The test skeleton site is built in two phases. In Phase 1 (Epic 0), the skeleton HTML page and test config are created, and `wrangler dev` serves the page with a minimal Worker that provides hardcoded bootstrap JSON — no HTMLRewriter yet. In Phase 2 (after Story 2.5), the Worker switches to HTMLRewriter-based injection and the hardcoded bootstrap is removed. This avoids the chicken-and-egg problem of Epic 0 depending on Epic 2.

## Verification Strategy

| Layer | How | When |
|---|---|---|
| Unit/integration tests | Vitest + `@cloudflare/vitest-pool-workers`. Custom `cf` objects for geo simulation. Local D1 for consent records. `jsdom` for client-side DOM tests. | Every story, before implementation (TDD). |
| Visual verification (browser) | `wrangler dev` serves test skeleton site. `?_geo=XX` and `?_gpc=1` query params simulate regions/GPC. Chrome MCP for interaction + screenshots. | Every UI story (Epic 4). |
| Responsive verification | Chrome MCP `resize_window` at 375px, 768px, 1280px widths. Screenshot each banner variant + modal at each size. | Every UI story (Epic 4), per Story 0.3 criteria. |
| E2E (production) | Deploy to a test Cloudflare zone. Verify with real geo headers (your actual location) + verify fallback works. | Epic 6 stories. |

## Total: 7 epics, 28 v1 stories (+ 1 post-v1)
