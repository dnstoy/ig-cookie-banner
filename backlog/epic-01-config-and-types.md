# Epic 1: Configuration System & Type Foundation

> The config file is the product. All behavior is driven by configuration.

## Story 1.1: Define Core TypeScript Types

**As a** developer
**I want** a strict TypeScript type system for the entire consent domain
**So that** all consent states, categories, and models are type-safe with no `any`

### Acceptance Criteria

- [ ] `ConsentCategory` type with: `id`, `required` (boolean, true for strictly necessary), `defaultState` (`granted` | `denied`). Display text (`name`, `description`) lives in locale files, keyed by category `id` — not in the config.
- [ ] `ConsentModel` union type: `'opt-in'` | `'opt-out'` | `'notice-only'`
- [ ] `ConsentState` type representing the user's choices: a record mapping `ConsentCategory.id` to `'granted'` | `'denied'`
- [ ] `ConsentRecord` type for audit logs: `consentId`, `timestamp`, `consentState`, `configVersion`, `method` (`'banner'` | `'gpc'` | `'api'`), `consentModel`, `geoLocation` (string, format `"{country}"` or `"{country}-{region}"`, e.g., `"US"`, `"CA-QC"` — matches the `regionModelMap` key format), `locale` (string, the locale code the banner was displayed in, e.g., `"en"` — needed to reconstruct what the user saw for audit purposes)
- [ ] `GpcState` type: `'detected'` | `'not-detected'`
- [ ] `GoogleConsentMode` type mapping the 4 Google parameters (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) to `'granted'` | `'denied'`
- [ ] `ConsentCookiePayload` type: `consentId` (string), `consentState` (`ConsentState`), `configVersion` (string), `timestamp` (number), `method` (`'banner'` | `'gpc'`). This is what gets serialized into the first-party cookie. Must stay under 4KB. Note: `method` has fewer values than `ConsentRecord.method` — the cookie only records how consent was originally given (banner interaction or GPC). The `'api'` method exists only on `ConsentRecord` for programmatic consent updates via the audit API.
- [ ] `consentId` is a UUID v4, generated on first consent and persisted in the cookie across subsequent updates. A new `consentId` is only generated if the cookie is expired or deleted. This ensures all consent records for the same visitor share a single ID for audit queries.
- [ ] `BannerState` union type: `'none'` | `'first-visit'` | `'re-prompt'` — determined by the Worker (Story 2.3) based on cookie validity
- [ ] `BootstrapPayload` type: the JSON contract between the Worker and client-side code. Contains: `consentModel` (`ConsentModel`), `bannerState` (`BannerState`), `gpcState` (`GpcState`), `geo` (`{ country: string; region?: string }`), `config` (the full `BannerConfig` including categories, theme, locale strings, google consent mode mapping). This is what the Worker serializes into `<script id="ig-consent-bootstrap" type="application/json">` and the client-side code reads on boot (Story 3.1 step 1). Defining this type is critical for Epics 2 and 3 to be built in parallel.
- [ ] `BannerConfig` root type (see Story 1.2)
- [ ] TypeScript strict mode enabled (`strict: true` in tsconfig)
- [ ] Zero uses of `any` — enforced via ESLint rule `@typescript-eslint/no-explicit-any`
- [ ] All types are exported from a single `types.ts` module
- [ ] Tests: type-level tests (using `tsd` or `expect-type`) confirming that invalid states are compile-time errors

---

## Story 1.2: Define the Configuration Schema

**As a** site operator
**I want** a single JSON configuration file that controls all banner behavior
**So that** I can change consent models, categories, locales, and integrations without code changes

### Acceptance Criteria

- [ ] Config file is valid JSON, parsed and validated at startup
- [ ] Schema includes:
  - `version`: string (semantic version or hash — used for consent versioning)
  - `fallbackConsentModel`: `ConsentModel` (default: `'opt-in'`)
  - `cookieDomain`: string (e.g., `'.example.com'`) — the `Domain` attribute for the consent cookie. Set to the apex domain with a leading dot so the cookie is readable across subdomains (e.g., `www.example.com` and `blog.example.com`).
  - `consentLifetimeDays`: number (default: 365)
  - ~~`recordRetentionDays`~~: removed from banner config — this is an infrastructure concern. Lives in Worker environment variables (see Story 2.4).
  - `categories`: array of `ConsentCategory` definitions
  - `regionModelMap`: record mapping ISO country codes (or region codes like `US-CA`, `CA-QC`) to `ConsentModel`
  - `googleConsentMode`: record mapping `ConsentCategory.id` to Google Consent Mode parameter(s)
  - `organization.name`: string (company name, shown in banner/modal text)
  - `organization.privacyPolicyUrl`: string (URL to privacy policy, linked from banner/modal)
  - `organization.contactEmail`: string (optional, shown in modal for privacy inquiries)
  - `organization.address`: string (optional, shown in modal for opt-in jurisdictions where required)
  - `optOut.dataCategories`: array of strings — categories of personal information collected (required by CCPA for the opt-out modal, e.g., "Identifiers", "Internet activity", "Geolocation")
  - `optOut.thirdPartyCategories`: array of strings — categories of third parties data is shared with (e.g., "Analytics providers", "Advertising networks")
  - `gpc.enabled`: boolean
  - `gpc.honorInRegions`: array of ISO country/region codes (or `'*'` for all)
  - `locales.defaultLocale`: string (e.g., `'en'`)
  - `locales.supported`: array of locale codes
  - ~~`ui.position`~~: removed — banner is always a bottom bar (fixed to viewport bottom). Modal is always centered. Not configurable.
  - `ui.theme.accentColor`: string (hex) — used for buttons and hyperlinks
  - `ui.theme.backgroundColor`: string (hex)
  - `ui.theme.textColor`: string (hex)
  - `ui.theme.fontFamily`: string
  - `ui.theme.borderRadius`: string (e.g., `'8px'`)
  - `ui.persistentAccessStyle`: `'floating-icon'` | `'footer-link'` (default: `'floating-icon'`) — controls how the persistent preferences access (Story 4.6) is rendered after the banner is dismissed
- [ ] Runtime validation function that returns typed errors (not throws) for invalid configs
- [ ] Tests: valid config parses successfully; invalid configs (missing required fields, invalid country codes, unknown consent models) return descriptive errors
- [ ] A well-documented example config file (`config.example.json`) covering US + EU + UK + CA + AU

---

## Story 1.3: Config Versioning & Staleness Detection

**As a** site operator
**I want** users to be automatically re-prompted when the banner configuration changes
**So that** their consent is always valid for the current set of categories and purposes

### Acceptance Criteria

- [ ] The config `version` is included in the consent cookie
- [ ] On page load, if the stored `configVersion` differs from the current config's `version`, consent is treated as stale
- [ ] Stale consent triggers a re-prompt (banner re-appears)
- [ ] Previous consent records in D1 are preserved (not overwritten) — they show history
- [ ] Tests: consent with matching version is valid; consent with mismatched version is stale; version comparison is exact string match

---

## Story 1.4: Locale / i18n File Structure

**As a** site operator
**I want** all banner text externalized into per-language JSON files
**So that** I can serve legally compliant banners in the user's language

### Acceptance Criteria

- [ ] One JSON file per locale: `locales/en.json`, `locales/fr.json`, etc.
- [ ] Locale files contain all user-facing strings: banner title, banner description, button labels ("Accept All", "Reject All", "Manage Preferences", "Do Not Sell or Share", "Save Preferences"), modal title, GPC confirmation message ("Opt-Out Request Honored"), and **category display text** (name + description per category `id`)
- [ ] Strings may reference config values via simple interpolation (e.g., `{{organization.name}}` in banner text)
- [ ] A TypeScript type for the locale file shape — all keys are required (missing keys are a compile-time error via type checking, runtime error via validation)
- [ ] Locale selection logic: config `defaultLocale` as fallback, `Accept-Language` header for auto-detection
- [ ] Tests: loading a valid locale returns typed strings; loading a locale with missing keys returns an error; fallback to `defaultLocale` works

### Copy Guidelines

- **Plain language.** No legalese. Use the bare minimum wording needed for compliance. Short sentences. Common words.
- Draw from plain language best practices (plainlanguage.gov, GOV.UK style guide).
- Where regulations mandate specific phrasing (e.g., "Do Not Sell or Share My Personal Information"), use it exactly — but keep everything around it simple.
- The banner is small — every word must earn its place.

### Copy & Translation Workflow

1. **During Epic 0/1**: Draft `en.json` with all strings. This is needed for the test skeleton site.
2. **During Epic 4**: Refine English copy as it's seen in the actual banner/modal UI.
3. **After Epic 4 sign-off**: Finalize English copy. Claude translates to `fr`, `de`, `es`, `it`, `nl`, `pt`, referencing official regulatory translations for legal terminology. Native speaker review recommended.
4. Translations are a **gate before production deployment** (Epic 6), not before development.

Only `en.json` is needed for dev. Other locales are populated after English is approved.
