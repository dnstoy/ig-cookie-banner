# Epic 2: Cloudflare Worker (Edge Layer)

> The Worker is the entry point. It reads geolocation, detects GPC, determines the consent model, and serves the appropriate banner.

## Story 2.1: Geolocation-Based Consent Model Resolution

**As a** visitor
**I want** the cookie banner to automatically show the correct consent experience for my country
**So that** I see a legally compliant banner without any manual selection

### Acceptance Criteria

- [ ] Geo source abstraction: in production, read `request.cf.country` and `request.cf.regionCode`. In dev mode, check for `?_geo` query parameter override first (see Story 0.2). This is a single function, not scattered `if/else` blocks.
- [ ] Lookup is hierarchical: check `regionModelMap` for `{country}-{regionCode}` first (e.g., `CA-QC`), fall back to `{country}` (e.g., `CA`), fall back to `fallbackConsentModel` (default: `opt-in`)
- [ ] The resolved consent model and geo info are included in the bootstrap JSON payload injected by Story 2.5
- [ ] Tests (Vitest with custom `cf` objects): `CA` + `QC` resolves via `CA-QC` key to `opt-in`; `CA` + `ON` falls back to `CA` key; unknown country falls back to `fallbackConsentModel`; missing `regionCode` falls back to country-level lookup

---

## Story 2.2: GPC Detection at the Edge

**As a** privacy-conscious visitor with GPC enabled
**I want** my opt-out preference to be detected immediately at the edge
**So that** the banner reflects my preference without delay

### Acceptance Criteria

- [ ] Worker reads `Sec-GPC` header from the request
- [ ] If `Sec-GPC: 1` and the visitor is in a GPC-mandated region (per config `gpc.honorInRegions`), the Worker marks the request as GPC-opted-out
- [ ] The GPC state is included in the bootstrap JSON payload injected by Story 2.5 (alongside the consent model)
- [ ] The Worker does NOT write to D1 in the request path — consent record creation for GPC is handled client-side (Story 3.2) via an async POST to the consent endpoint
- [ ] Tests: request with `Sec-GPC: 1` from California is marked as opted out; request with `Sec-GPC: 1` from a non-GPC region is not auto-opted-out (unless `gpc.honorInRegions` includes `'*'`); request without `Sec-GPC` header is not affected

---

## Story 2.3: Consent Cookie Reading at the Edge

**As a** returning visitor
**I want** the Worker to read my existing consent cookie
**So that** it can skip the banner if my consent is still valid

### Acceptance Criteria

- [ ] Worker reads the consent cookie from the request `Cookie` header
- [ ] Cookie payload is parsed and validated (consent state + config version)
- [ ] If consent is valid (config version matches, not expired), the bootstrap JSON (Story 2.5) includes `bannerState: 'none'`
- [ ] If consent is stale (config version mismatch) or expired, the bootstrap JSON includes `bannerState: 're-prompt'`. **Expiry note:** The browser's `Max-Age` will delete the cookie automatically after `consentLifetimeDays`, so the Worker will typically never see a truly expired cookie (it just won't be sent). However, the cookie payload contains a `timestamp` field — the Worker checks `now - timestamp > consentLifetimeDays * 86400` as a defense-in-depth measure against clock skew or cookie manipulation.
- [ ] If no consent cookie exists, the bootstrap JSON includes `bannerState: 'first-visit'`
- [ ] Tests: valid cookie skips banner; expired cookie triggers re-prompt; mismatched config version triggers re-prompt; missing cookie triggers first-visit banner; malformed cookie is treated as missing

---

## Story 2.4: Consent Record API Endpoint

**As a** site operator
**I want** a Worker endpoint that accepts consent records and stores them in D1
**So that** I have an auditable log of all consent events

### Acceptance Criteria

- [ ] `POST /consent` endpoint on the Worker
- [ ] Accepts a JSON payload matching the `ConsentRecord` type
- [ ] Validates the payload (rejects invalid records with 400)
- [ ] Writes the record to a Cloudflare D1 table
- [ ] D1 schema: `consent_id` (text, indexed), `timestamp` (integer, indexed), `consent_state` (JSON text), `config_version` (text), `method` (text), `consent_model` (text), `geo_location` (text), `locale` (text)
- [ ] Endpoint is protected against abuse (rate limiting via Cloudflare, origin validation)
- [ ] Tests: valid payload returns 201; invalid payload returns 400 with errors; record is queryable by `consent_id`

### Consent Record Purge (Cron)

- [ ] A Cloudflare Worker scheduled handler (`scheduled()`) runs daily to purge expired records
- [ ] `wrangler.toml` includes a `[triggers]` section with the cron schedule (e.g., `crons = ["0 3 * * *"]`)
- [ ] Purge deletes records where `timestamp < now - RECORD_RETENTION_DAYS` (env var, default 1095 / 3 years)
- [ ] D1 has a per-query row limit — purge uses batched deletes (max 1000 rows per `DELETE` statement, loop until no more rows match)
- [ ] Tests: scheduled handler deletes expired records; records within retention window are preserved; batch deletion handles more than 1000 expired records

---

## Story 2.5: HTML Injection via HTMLRewriter

**As a** site operator
**I want** the Worker to automatically inject the banner script into my pages
**So that** I don't need to manually add `<script>` tags to every page

### Acceptance Criteria

- [ ] Worker intercepts HTML responses (content-type `text/html`) from the origin server
- [ ] Uses Cloudflare `HTMLRewriter` to inject into `<head>`:
  1. A `<script id="ig-consent-bootstrap" type="application/json">` tag containing the runtime context: resolved consent model, GPC state, geo info, and config (categories, theme, locale strings, google consent mode mapping)
  2. A `<script src="/ig-consent-banner.js">` tag — synchronous, blocking, inserted before any other `<script>` tags in `<head>` so the consent engine initializes first
- [ ] Non-HTML responses (images, CSS, JS, API calls) pass through unmodified
- [ ] The Worker serves a JS file at `/ig-consent-banner.js`. During development, this is a stub file (replaced with the real bundle from Epics 3+4 in Story 6.1). The HTMLRewriter injection logic and tests do not depend on the contents of this file — they only verify it is served and the `<script src>` tag is injected.
- [ ] In dev mode (`wrangler dev`), the injection works identically — the test skeleton site (Story 0.1 Phase 2) is just an HTML page that the Worker processes like any origin response
- [ ] Tests: HTML response has both script tags injected in `<head>`; non-HTML response is untouched; bootstrap JSON contains correct consent model, GPC state, and geo info; JS file is served at `/ig-consent-banner.js`
