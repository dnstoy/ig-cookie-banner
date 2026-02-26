# Epic 9: Serve Locale via Bootstrap Payload

> Move locale resolution to the Worker so the client receives fully localized strings via the bootstrap payload. Add a `?_lang=xx` dev override for testing translations.

---

## Story 9.1: Worker-Side Locale Resolution with Dev Override

**As a** developer testing translations
**I want** to override the language via `?_lang=xx` query param in dev mode
**So that** I can visually verify all 7 languages without changing geo or source code

**As a** visitor
**I want** the cookie banner to automatically display in my language
**So that** I can understand my consent choices without relying on English

### Problem

Currently (Phase 1), the locale is hardcoded to English on the client side. The worker accepts a `_locale` parameter in `buildBootstrapPayload()` but never uses it. All 7 locale files exist but only `en.json` is bundled into the client. There's no way to test translations without injecting JS in the browser console.

### Solution

1. **Locale registry**: Import all 7 locale JSON files in a new `src/worker/locale.ts` module, keyed by locale code.
2. **`resolveLocale()`**: New function that picks a locale based on:
   - Dev override: `?_lang=xx` query param (dev-only, like `_geo` and `_gpc`)
   - Geo-to-language mapping (e.g., DE→de, FR→fr, ES→es, fallback→en)
3. **Bootstrap payload**: Add `locale: LocaleStrings` to `BootstrapPayload`, populated by the worker.
4. **Client reads from bootstrap**: `readLocale()` reads `bootstrap.locale` instead of hardcoded `defaultLocale`. Falls back to `defaultLocale` if missing (backward compat).
5. **Client bundle slims down**: Remove `default-locale.ts` import from `boot.ts` — locale data comes from the bootstrap payload only. Keep `defaultLocale` as a fallback import for safety.
6. **Dev overlay**: Add lang display to the dev overlay (e.g., `DEV: geo=DE, gpc=off, model=opt-in, lang=de`).

### Acceptance Criteria

- [x] `?_lang=de` on localhost shows German strings in the banner and modal
- [x] `?_lang=fr` shows French, etc. for all 7 locales
- [x] Without `?_lang`, geo-based resolution picks the correct language (DE→de, FR→fr, etc.)
- [x] Unknown `?_lang=xx` falls back to English
- [x] `?_lang` param is ignored in production (non-dev environment)
- [x] Dev overlay displays current language code
- [x] All existing tests still pass
- [x] New tests cover locale resolution logic and `?_lang` override
