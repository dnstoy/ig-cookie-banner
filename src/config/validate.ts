import type { BannerConfig, ConsentModel } from "../types/index.js";

type ValidationSuccess = { ok: true; value: BannerConfig };
type ValidationFailure = { ok: false; errors: string[] };
export type ValidationResult = ValidationSuccess | ValidationFailure;

const VALID_CONSENT_MODELS: readonly ConsentModel[] = [
  "opt-in",
  "opt-out",
  "notice-only",
];

const VALID_PERSISTENT_STYLES = ["floating-icon", "footer-link"] as const;

export function validateConfig(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (input === null || input === undefined || typeof input !== "object") {
    return { ok: false, errors: ["Config must be a non-null object"] };
  }

  const config = input as Record<string, unknown>;

  // version
  if (typeof config["version"] !== "string" || config["version"] === "") {
    errors.push("version: must be a non-empty string");
  }

  // fallbackConsentModel
  if (
    !VALID_CONSENT_MODELS.includes(
      config["fallbackConsentModel"] as ConsentModel,
    )
  ) {
    errors.push(
      `fallbackConsentModel: must be one of ${VALID_CONSENT_MODELS.join(", ")}`,
    );
  }

  // cookieDomain
  if (
    typeof config["cookieDomain"] !== "string" ||
    config["cookieDomain"] === ""
  ) {
    errors.push("cookieDomain: must be a non-empty string");
  }

  // consentLifetimeDays
  if (
    typeof config["consentLifetimeDays"] !== "number" ||
    config["consentLifetimeDays"] <= 0
  ) {
    errors.push("consentLifetimeDays: must be a positive number");
  }

  // categories
  validateCategories(config["categories"], errors);

  // regionModelMap
  validateRegionModelMap(config["regionModelMap"], errors);

  // googleConsentMode
  if (
    config["googleConsentMode"] === undefined ||
    config["googleConsentMode"] === null ||
    typeof config["googleConsentMode"] !== "object"
  ) {
    errors.push("googleConsentMode: must be an object");
  }

  // organization
  validateOrganization(config["organization"], errors);

  // gpc
  validateGpc(config["gpc"], errors);

  // locales
  validateLocales(config["locales"], errors);

  // ui
  validateUi(config["ui"], errors);

  // optOut (optional)
  if (config["optOut"] !== undefined) {
    validateOptOut(config["optOut"], errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: input as BannerConfig };
}

function validateCategories(categories: unknown, errors: string[]): void {
  if (!Array.isArray(categories)) {
    errors.push("categories: must be an array");
    return;
  }
  if (categories.length === 0) {
    errors.push("categories: must contain at least one category");
    return;
  }

  const ids = new Set<string>();
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i] as Record<string, unknown>;
    if (typeof cat !== "object" || cat === null) {
      errors.push(`categories[${i}]: must be an object`);
      continue;
    }
    if (typeof cat["id"] !== "string" || cat["id"] === "") {
      errors.push(`categories[${i}]: id must be a non-empty string`);
      continue;
    }
    if (ids.has(cat["id"] as string)) {
      errors.push(
        `categories[${i}]: duplicate id "${cat["id"] as string}"`,
      );
    }
    ids.add(cat["id"] as string);
    if (typeof cat["required"] !== "boolean") {
      errors.push(`categories[${i}]: required must be a boolean`);
    }
    if (cat["defaultState"] !== "granted" && cat["defaultState"] !== "denied") {
      errors.push(
        `categories[${i}]: defaultState must be "granted" or "denied"`,
      );
    }
  }
}

function validateRegionModelMap(map: unknown, errors: string[]): void {
  if (map === undefined || map === null || typeof map !== "object") {
    errors.push("regionModelMap: must be an object");
    return;
  }
  for (const [key, value] of Object.entries(
    map as Record<string, unknown>,
  )) {
    if (!VALID_CONSENT_MODELS.includes(value as ConsentModel)) {
      errors.push(
        `regionModelMap["${key}"]: must be one of ${VALID_CONSENT_MODELS.join(", ")}`,
      );
    }
  }
}

function validateOrganization(org: unknown, errors: string[]): void {
  if (org === undefined || org === null || typeof org !== "object") {
    errors.push("organization: must be an object");
    return;
  }
  const o = org as Record<string, unknown>;
  if (typeof o["name"] !== "string" || o["name"] === "") {
    errors.push("organization.name: must be a non-empty string");
  }
  if (
    typeof o["privacyPolicyUrl"] !== "string" ||
    o["privacyPolicyUrl"] === ""
  ) {
    errors.push("organization.privacyPolicyUrl: must be a non-empty string");
  }
}

function validateGpc(gpc: unknown, errors: string[]): void {
  if (gpc === undefined || gpc === null || typeof gpc !== "object") {
    errors.push("gpc: must be an object");
    return;
  }
  const g = gpc as Record<string, unknown>;
  if (typeof g["enabled"] !== "boolean") {
    errors.push("gpc.enabled: must be a boolean");
  }
  if (!Array.isArray(g["honorInRegions"])) {
    errors.push("gpc.honorInRegions: must be an array");
  }
}

function validateLocales(locales: unknown, errors: string[]): void {
  if (locales === undefined || locales === null || typeof locales !== "object") {
    errors.push("locales: must be an object");
    return;
  }
  const l = locales as Record<string, unknown>;
  if (typeof l["defaultLocale"] !== "string" || l["defaultLocale"] === "") {
    errors.push("locales.defaultLocale: must be a non-empty string");
  }
  if (!Array.isArray(l["supported"]) || l["supported"].length === 0) {
    errors.push("locales.supported: must be a non-empty array");
  }
}

function validateUi(ui: unknown, errors: string[]): void {
  if (ui === undefined || ui === null || typeof ui !== "object") {
    errors.push("ui: must be an object");
    return;
  }
  const u = ui as Record<string, unknown>;

  // theme
  if (
    u["theme"] === undefined ||
    u["theme"] === null ||
    typeof u["theme"] !== "object"
  ) {
    errors.push("ui.theme: must be an object");
  } else {
    const t = u["theme"] as Record<string, unknown>;
    for (const field of [
      "accentColor",
      "backgroundColor",
      "textColor",
      "fontFamily",
      "borderRadius",
    ]) {
      if (typeof t[field] !== "string" || t[field] === "") {
        errors.push(`ui.theme.${field}: must be a non-empty string`);
      }
    }
  }

  // persistentAccessStyle
  if (
    !VALID_PERSISTENT_STYLES.includes(
      u["persistentAccessStyle"] as (typeof VALID_PERSISTENT_STYLES)[number],
    )
  ) {
    errors.push(
      `ui.persistentAccessStyle: must be one of ${VALID_PERSISTENT_STYLES.join(", ")}`,
    );
  }
}

function validateOptOut(optOut: unknown, errors: string[]): void {
  if (
    optOut === undefined ||
    optOut === null ||
    typeof optOut !== "object"
  ) {
    errors.push("optOut: must be an object");
    return;
  }
  const o = optOut as Record<string, unknown>;
  if (!Array.isArray(o["dataCategories"])) {
    errors.push("optOut.dataCategories: must be an array");
  }
  if (!Array.isArray(o["thirdPartyCategories"])) {
    errors.push("optOut.thirdPartyCategories: must be an array");
  }
}
