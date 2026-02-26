# Epic 0: Dev & Test Infrastructure

> The skeleton site, local dev environment, and tools needed to visually verify every banner variant at every breakpoint before shipping.

## Story 0.1: Test Skeleton Site

**As a** developer
**I want** a minimal static site that exercises all banner features
**So that** I can visually verify the banner in a real browser during development

### Acceptance Criteria

This story is built in two phases to avoid depending on Story 2.5 (HTMLRewriter), which comes later.

#### Phase 1 (Epic 0 — built first)

- [ ] A single-page HTML skeleton served by a minimal Cloudflare Worker via `wrangler dev`
- [ ] The Worker serves the HTML page directly (no HTMLRewriter yet) and inlines a hardcoded `<script id="ig-consent-bootstrap" type="application/json">` tag with test bootstrap data (consent model, GPC state, geo info) so client-side code can be developed against the expected contract
- [ ] The page includes a `<script src="/ig-consent-banner.js">` tag pointing to a stub JS file (initially a console log placeholder, replaced with the real bundle as Epics 3+4 progress)
- [ ] Page also contains:
  - A few paragraphs of placeholder content (to verify the banner overlay behavior)
  - Scripts tagged with `type="text/plain"` and `data-consent-category` for each category (analytics, marketing, functional) — each logs to console when executed, so activation is verifiable
  - A GTM-like `gtag()` stub that logs consent signals to console (no real GTM needed for dev)
  - A footer link for persistent preferences access (Story 4.6)
- [ ] A `config.json` with all three consent models mapped to test regions:
  - `DE` → `opt-in`, `US` → `opt-out`, `AU` → `notice-only`, `CA-QC` → `opt-in`, `CA` → `notice-only`
- [ ] Locale files for at least `en` and `fr`
- [ ] `npm run dev` starts `wrangler dev` and serves the test site on `localhost:8787`

#### Phase 2 (after Story 2.5)

- [ ] The Worker switches to HTMLRewriter-based injection (Story 2.5) — the hardcoded bootstrap JSON and manual `<script>` tag are removed from the skeleton HTML
- [ ] The skeleton HTML page becomes a plain page with no banner script tags — exactly like a real production site
- [ ] The Worker processes the page through HTMLRewriter, injecting both the bootstrap JSON and banner script tag dynamically

---

## Story 0.2: Geo & GPC Override for Local Development

**As a** developer
**I want** to simulate different countries and GPC states during local dev
**So that** I can verify all banner variants without a VPN or real geo headers

### Acceptance Criteria

- [ ] Query parameter overrides: `?_geo=DE`, `?_geo=US`, `?_geo=CA-QC`, `?_gpc=1`
- [ ] These overrides are **only active when the Worker is running in dev mode** (not in production). The Worker detects dev mode via `wrangler dev`'s environment or an explicit env var (e.g., `ENVIRONMENT=dev`)
- [ ] When `_geo` is set, the Worker uses it instead of `CF-IPCountry` / `request.cf.regionCode` for consent model resolution
- [ ] When `_gpc=1` is set, the Worker behaves as if `Sec-GPC: 1` was sent
- [ ] The currently active geo and GPC state are shown in a small dev-only overlay on the page (e.g., "DEV: geo=DE, gpc=off, model=opt-in") so the developer can see at a glance what mode they're testing
- [ ] In production, these query parameters are ignored and the overlay is not rendered
- [ ] Tests (unit): override params are respected in dev mode; override params are ignored in production mode

---

## Story 0.3: Responsive Verification Breakpoints

**As a** developer
**I want** to verify the banner and modal at standard device breakpoints
**So that** the consent UI works on phones, tablets, and desktops

### Acceptance Criteria

- [ ] Banner and modal are responsive — no horizontal scroll, no clipped buttons, no unreadable text at any breakpoint
- [ ] Target breakpoints:
  - Mobile: 375x667 (iPhone SE), 390x844 (iPhone 14)
  - Tablet: 768x1024 (iPad), 810x1080 (iPad Air)
  - Desktop: 1280x800, 1920x1080
- [ ] Banner buttons stack vertically on mobile (side-by-side doesn't fit); remain side-by-side on tablet and desktop
- [ ] Modal is scrollable on mobile if content exceeds viewport height
- [ ] Persistent preferences icon/link is reachable and tappable on mobile (min 44x44px touch target)
- [ ] Verification: resize browser via Chrome MCP to each breakpoint and screenshot each banner variant + modal at each size

---

## Story 0.4: Automated Test Setup (Vitest + Cloudflare)

**As a** developer
**I want** a working test harness using Vitest with the Cloudflare Workers pool
**So that** I can run Worker tests with realistic `request.cf` objects and D1 bindings

### Acceptance Criteria

- [ ] `vitest.config.ts` configured with `@cloudflare/vitest-pool-workers`
- [ ] Tests can construct requests with custom `cf` properties (country, regionCode) and they are available in the Worker handler
- [ ] The initial D1 migration file (`migrations/0001_create_consent_records.sql`) is created with the schema from Story 2.4. This migration is version-controlled and applied locally via `wrangler d1 migrations apply --local`
- [ ] Tests can read/write to a local D1 instance (isolated per test, using the migration above)
- [ ] `npm test` runs all tests (Worker + client-side)
- [ ] Client-side tests use `jsdom` or `happy-dom` for DOM testing (script blocking, banner rendering)
- [ ] Tests for Google Consent Mode use the `gtag()` stub (spy on calls, verify parameters)
- [ ] CI-compatible: tests run without network access or Cloudflare credentials
