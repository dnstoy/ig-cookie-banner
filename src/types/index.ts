// ── Consent Categories ──────────────────────────────────────────────

export interface ConsentCategory {
  /** Unique identifier, used as key in ConsentState and locale files */
  readonly id: string;
  /** If true, this category cannot be toggled off (e.g. strictly necessary) */
  readonly required: boolean;
  /** Fallback default when consent model context is unavailable */
  readonly defaultState: "granted" | "denied";
}

// ── Consent Model ───────────────────────────────────────────────────

export type ConsentModel = "opt-in" | "opt-out" | "notice-only";

// ── Consent State ───────────────────────────────────────────────────

/** Maps category IDs to their consent status */
export type ConsentState = Record<string, "granted" | "denied">;

// ── Consent Record (Audit Log) ──────────────────────────────────────

export interface ConsentRecord {
  /** UUID v4, persisted across consent updates for the same visitor */
  readonly consentId: string;
  /** Unix timestamp (ms) */
  readonly timestamp: number;
  readonly consentState: ConsentState;
  readonly configVersion: string;
  /**
   * How consent was given:
   * - 'banner': user interacted with the banner/modal
   * - 'gpc': Global Privacy Control signal
   * - 'api': programmatic consent update via audit API
   */
  readonly method: "banner" | "gpc" | "api";
  readonly consentModel: ConsentModel;
  /**
   * Format: "{country}" or "{country}-{region}"
   * e.g. "US", "CA-QC" — matches regionModelMap key format
   */
  readonly geoLocation: string;
  /** Locale code the banner was displayed in (e.g. "en") */
  readonly locale: string;
}

// ── GPC ─────────────────────────────────────────────────────────────

export type GpcState = "detected" | "not-detected";

// ── Google Consent Mode v2 ──────────────────────────────────────────

export interface GoogleConsentMode {
  readonly analytics_storage: "granted" | "denied";
  readonly ad_storage: "granted" | "denied";
  readonly ad_user_data: "granted" | "denied";
  readonly ad_personalization: "granted" | "denied";
}

// ── Consent Cookie Payload ──────────────────────────────────────────

/**
 * Serialized into the first-party consent cookie. Must stay under 4KB.
 *
 * `method` only accepts 'banner' | 'gpc' — the cookie records how consent
 * was originally given. The 'api' method exists only on ConsentRecord for
 * programmatic updates via the audit API.
 */
export interface ConsentCookiePayload {
  readonly consentId: string;
  readonly consentState: ConsentState;
  readonly configVersion: string;
  /** Unix timestamp (ms) when consent was given */
  readonly timestamp: number;
  readonly method: "banner" | "gpc";
}

// ── Banner State ────────────────────────────────────────────────────

/** Determined by the Worker based on cookie validity */
export type BannerState = "none" | "first-visit" | "re-prompt";

// ── Configuration ───────────────────────────────────────────────────

export interface OrganizationConfig {
  readonly name: string;
  readonly privacyPolicyUrl: string;
  readonly contactEmail?: string;
  readonly address?: string;
}

export interface GpcConfig {
  readonly enabled: boolean;
  /** ISO country/region codes, or ['*'] for all */
  readonly honorInRegions: readonly string[];
}

export interface LocaleConfig {
  readonly defaultLocale: string;
  readonly supported: readonly string[];
}

export interface ThemeConfig {
  /** Hex color for buttons and hyperlinks */
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly fontFamily: string;
  /** e.g. '8px' */
  readonly borderRadius: string;
}

export interface UiConfig {
  readonly theme: ThemeConfig;
  readonly persistentAccessStyle: "floating-icon" | "footer-link";
}

export interface OptOutConfig {
  /** Categories of personal information collected (CCPA requirement) */
  readonly dataCategories: readonly string[];
  /** Categories of third parties data is shared with */
  readonly thirdPartyCategories: readonly string[];
}

export interface BannerConfig {
  /** Semantic version or hash — used for consent versioning */
  readonly version: string;
  readonly fallbackConsentModel: ConsentModel;
  /** Domain attribute for the consent cookie (e.g. '.example.com') */
  readonly cookieDomain: string;
  readonly consentLifetimeDays: number;
  readonly categories: readonly ConsentCategory[];
  /** Maps ISO country/region codes to consent models */
  readonly regionModelMap: Readonly<Record<string, ConsentModel>>;
  /** Maps category IDs to Google Consent Mode parameter names */
  readonly googleConsentMode: Readonly<Record<string, readonly string[]>>;
  readonly organization: OrganizationConfig;
  readonly gpc: GpcConfig;
  readonly locales: LocaleConfig;
  readonly ui: UiConfig;
  readonly optOut?: OptOutConfig;
}

// ── Bootstrap Payload ───────────────────────────────────────────────

/**
 * The JSON contract between the Worker (producer) and the client-side
 * code (consumer). Serialized into <script id="ig-consent-bootstrap">.
 *
 * This type is the critical shared interface that allows Epics 2 and 3
 * to be built in parallel.
 */
export interface BootstrapPayload {
  readonly consentModel: ConsentModel;
  readonly bannerState: BannerState;
  readonly gpcState: GpcState;
  readonly geo: {
    readonly country: string;
    readonly region?: string;
  };
  readonly config: BannerConfig;
}
