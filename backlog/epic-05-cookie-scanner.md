# Epic 5: Cookie Scanner CLI

> A CLI tool that crawls a site, detects cookies, and outputs a structured inventory file for the banner config.

## Story 5.1: Cookie Scanner CLI Tool

**As a** site operator
**I want** a CLI tool that scans my site and produces a cookie inventory
**So that** I know which cookies my site sets and can categorize them in the banner config

### Acceptance Criteria

- [ ] CLI command: `npx ig-cookie-scanner --url https://example.com --output cookies.json`
- [ ] Uses a headless browser (Playwright or Puppeteer) to load the target URL
- [ ] Records all cookies set during page load: `name`, `domain`, `path`, `expires`/`maxAge`, `secure`, `httpOnly`, `sameSite`
- [ ] Crawls internal links (configurable depth, default 3 pages) to capture cookies set on subpages
- [ ] Attempts auto-categorization by matching cookie names against a known cookie database (e.g., `_ga` → Analytics, `_fbp` → Marketing)
- [ ] Unknown cookies are categorized as `uncategorized` for manual review
- [ ] Output is a typed JSON file matching a `CookieInventory` TypeScript type
- [ ] Output includes a `scannedAt` timestamp and the list of pages crawled
- [ ] Tests: scanning a test page with known cookies produces correct output; unknown cookies are marked `uncategorized`; depth limit is respected

---

## Story 5.2: Cookie Inventory Integration with Config

**As a** site operator
**I want** the cookie inventory to feed into the banner's category descriptions
**So that** users can see exactly which cookies each category includes

### Acceptance Criteria

- [ ] The banner config can reference a `cookieInventoryPath` pointing to the scanner output
- [ ] The preference modal can optionally display a "Cookies in this category" expandable section, listing cookies from the inventory
- [ ] Cookie entries show: `name`, `domain`, `purpose` (from auto-categorization or manual override), `expiry`
- [ ] If no inventory file is provided, the modal works fine without it (categories only, no individual cookie list)
- [ ] Tests: modal renders cookie list when inventory is provided; modal renders without errors when inventory is absent
