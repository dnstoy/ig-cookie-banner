# Epic 3: Client-Side Core (Consent Engine)

> The client-side JS manages consent state, enforces script blocking, and emits signals. It does NOT handle UI rendering (that's Epic 4).

## Story 3.1: Consent State Manager

**As a** developer
**I want** a central consent state manager that is the single source of truth for consent on the page
**So that** all components (banner UI, script blocking, Google Consent Mode) read from one place

### Initialization Boot Sequence

The banner JS (injected by Story 2.5) executes synchronously in `<head>` before any other scripts. The boot order is:

1. Read the bootstrap JSON from `<script id="ig-consent-bootstrap">` (contains config, consent model, GPC state, geo info)
2. Parse the consent cookie (if present) and validate it (config version match, not expired)
3. Check GPC: `navigator.globalPrivacyControl` — if detected and in a GPC-mandated region, GPC wins (Story 3.2)
4. Initialize `ConsentManager` with the resolved `ConsentState`
5. Fire `gtag('consent', 'default', {...})` based on the resolved state (Story 3.3) — this MUST happen before GTM loads
6. Run the script blocking engine (Story 3.4) — activate or block scripts based on consent state
7. If banner is needed (no valid consent, or stale consent), render the banner UI (Epic 4)

This sequence is critical: steps 1–6 are synchronous and blocking. GTM and other third-party scripts must not load until step 5 completes.

### Acceptance Criteria

- [ ] `ConsentManager` class/module that holds the current `ConsentState`
- [ ] Initializes following the boot sequence above
- [ ] Exposes methods: `getState()`, `updateConsent(categories)`, `withdrawConsent()`, `isConsentValid()`, `getConsentModel()`
- [ ] **Consent model determines effective defaults**: `opt-in` → all non-required categories default to `denied`; `opt-out` → all categories default to `granted`; `notice-only` → all categories default to `granted`. The per-category `defaultState` in config serves as a fallback only when consent model context is unavailable.
- [ ] **Consent cookie is written client-side** via `document.cookie` — not via `Set-Cookie` response header. This means the cookie is NOT `HttpOnly` (this is expected and necessary; the client must read/write it). Cookie attributes: `Domain` from config `cookieDomain`, `Path=/`, `SameSite=Lax`, `Secure`, `Max-Age` based on `consentLifetimeDays`.
- [ ] `updateConsent()` writes the consent cookie and sends the consent record to the Worker endpoint (`POST /consent`). **If the POST fails** (network error, Worker unavailable, D1 down), consent is still applied locally — the cookie is written and scripts are activated/blocked. The failure is logged to `console.error`. Retry with exponential backoff (max 3 attempts).
- [ ] `withdrawConsent()` updates the consent cookie to all-denied, sends a withdrawal record, and attempts to clear known first-party cookies listed in the cookie inventory (if available). Third-party cookies (e.g., `_ga` on `.google.com`) cannot be cleared client-side — this is a browser limitation, not a bug. A page reload is required for script blocking to take full effect.
- [ ] Emits events on state change (observer/callback pattern): `onConsentChange(callback: (state: ConsentState) => void)`
- [ ] All methods are fully typed — no `any`
- [ ] Tests: initialization from cookie; initialization from GPC; initialization with no prior state; update persists to cookie; consent record POST failure still writes cookie; withdrawal clears state; event callbacks fire on change; invalid cookie falls back to default state; opt-in model defaults all non-required to denied; opt-out model defaults all to granted

---

## Story 3.2: GPC Client-Side Detection & Enforcement

**As a** visitor with GPC enabled
**I want** the client-side JS to confirm my GPC preference
**So that** my opt-out is enforced even if the edge detection was bypassed

### GPC Signal Precedence

The edge (Worker) and client may see different GPC signals. The `Sec-GPC` header can be absent even when `navigator.globalPrivacyControl` is `true` (some browsers strip the header in certain contexts). **The client-side check is authoritative.** If either the edge OR the client detects GPC, the opt-out is applied. The edge detection (Story 2.2) is an optimization for the banner state hint in the bootstrap JSON, not the source of truth.

### Acceptance Criteria

- [ ] Check `navigator.globalPrivacyControl` on initialization
- [ ] If GPC is detected **by either the edge (bootstrap JSON `gpcState`) or the client (`navigator.globalPrivacyControl`)**, and user is in a GPC-mandated region, auto-set consent state to opted out (all non-essential categories denied)
- [ ] GPC opt-out takes precedence over a missing consent cookie
- [ ] If the user already has a consent cookie with explicit choices, and GPC is detected: GPC wins (conservative interpretation aligned with California's position)
- [ ] The consent record logs `method: 'gpc'` for GPC-triggered opt-outs — the client sends the record asynchronously via POST to the Worker consent endpoint (Story 2.4)
- [ ] Tests: `navigator.globalPrivacyControl === true` triggers opt-out in US; edge-only GPC detection (bootstrap says detected, navigator says false) still triggers opt-out; does not trigger in non-GPC region (unless configured); GPC overrides existing consent cookie; consent record is sent async (does not block page load)

---

## Story 3.3: Google Consent Mode Integration

**As a** site operator using GTM
**I want** the banner to fire Google Consent Mode signals when consent changes
**So that** GA4 and Google Ads respect the user's consent choices

### Acceptance Criteria

- [ ] On page load (before GTM loads), fire `gtag('consent', 'default', {...})` with appropriate defaults based on consent model:
  - Opt-in regions: all 4 parameters set to `'denied'`
  - Opt-out regions: all 4 parameters set to `'granted'`
  - Notice-only regions: all 4 parameters set to `'granted'`
- [ ] When consent state changes (user interacts with banner), fire `gtag('consent', 'update', {...})`
- [ ] Category-to-parameter mapping is read from config (`googleConsentMode` field)
- [ ] If `gtag` is not available on the page, the integration is a no-op (no errors)
- [ ] Tests: default consent fires correct `gtag` call for EU visitor; update fires correct `gtag` call after user accepts analytics; opt-out region fires `granted` defaults; missing `gtag` does not throw

---

## Story 3.4: Script Blocking Engine

**As a** visitor in an opt-in jurisdiction
**I want** non-essential scripts to be blocked until I consent
**So that** my privacy is respected and the site is legally compliant

### Acceptance Criteria

- [ ] Scripts tagged with `type="text/plain"` and `data-consent-category="<category-id>"` are not executed by the browser
- [ ] When consent is granted for a category, the engine finds all scripts with that category, changes their `type` to `text/javascript`, and re-inserts them into the DOM to trigger execution
- [ ] When consent is withdrawn for a category, the engine cannot un-execute scripts (this is a page-reload scenario — document this limitation)
- [ ] **If the resolved consent model is `notice-only`**, all tagged scripts are immediately activated on page load without waiting for user interaction (notice-only jurisdictions do not block scripts)
- [ ] **If the resolved consent model is `opt-out`**, all tagged scripts are immediately activated on page load (opt-out means tracking runs by default until the user opts out)
- [ ] The engine runs as part of the synchronous boot sequence (see Story 3.1) — it must execute before any other page scripts
- [ ] Tests: tagged script does not execute before consent in opt-in model; tagged script executes after consent is granted for its category; untagged scripts (no `data-consent-category`) are not affected; scripts for denied categories remain blocked; notice-only model activates all tagged scripts immediately; opt-out model activates all tagged scripts immediately
