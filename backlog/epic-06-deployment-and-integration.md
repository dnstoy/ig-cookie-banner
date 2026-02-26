# Epic 6: Deployment & Site Integration

> Getting the banner running on a real site via Cloudflare.

## Story 6.1: Cloudflare Worker Deployment Pipeline

**As a** developer
**I want** the Worker to be deployable via Wrangler CLI
**So that** I can ship updates reliably and repeatably

### Acceptance Criteria

- [ ] `wrangler.toml` configured with: D1 database binding, environment variables (`RECORD_RETENTION_DAYS`, `ENVIRONMENT`), Worker route (e.g., `example.com/*`), cron triggers for record purge
- [ ] Build step bundles the banner JS (client-side code from Epics 3 + 4) into a single file that the Worker serves at `/ig-consent-banner.js`
- [ ] `npm run deploy` builds the banner JS bundle and deploys the Worker via `wrangler deploy`
- [ ] D1 migration for the consent records table is version-controlled and applied via `wrangler d1 migrations apply`
- [ ] Environment-specific configs (dev, staging, production) are supported via `wrangler.toml` `[env.*]` sections
- [ ] Tests: Worker deploys successfully to a test zone; D1 migration creates the expected table schema; banner JS is accessible at the expected path

---

## Story 6.2: Site Integration Guide (Post-v1)

> **Not a code story.** This is documentation that will be written naturally during first site integration. Deferred to post-v1.

**As a** site operator
**I want** clear instructions for integrating the banner into my site
**So that** I can get compliant cookie consent working with minimal effort

### Acceptance Criteria

- [ ] Documentation covers:
  - Adding the Worker route to the site's Cloudflare zone
  - Tagging scripts with `type="text/plain"` and `data-consent-category`
  - Setting up Google Consent Mode defaults in GTM
  - Adding the persistent preferences link to the site footer
  - Configuring the `config.json` for the site's needs
  - Running the cookie scanner and reviewing the output
- [ ] A working example site / test page that demonstrates all three banner variants

---

## Story 6.3: Consent Record Querying (Audit Support)

**As a** site operator responding to a regulator
**I want** to query consent records by consent ID, date range, or aggregate statistics
**So that** I can demonstrate compliance during an audit

### Acceptance Criteria

- [ ] `GET /consent/:consentId` returns the full consent history for a given consent ID
- [ ] `GET /consent/stats` returns aggregate data: total records, consent rate (accepted vs. rejected), GPC opt-out count, breakdown by consent model
- [ ] `GET /consent?from=<timestamp>&to=<timestamp>` returns records in a date range (paginated)
- [ ] All query endpoints are authenticated (API key or Cloudflare Access)
- [ ] Tests: query by consent ID returns correct records; stats endpoint returns accurate aggregates; date range filtering works; unauthenticated requests are rejected
