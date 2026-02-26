import type { ConsentCookiePayload } from "../types/index.js";

/** Checks if consent was given against a different config version (exact string match) */
export function isConsentStale(
  cookie: ConsentCookiePayload,
  currentConfigVersion: string,
): boolean {
  return cookie.configVersion !== currentConfigVersion;
}

/** Checks if consent has expired based on its timestamp and the configured lifetime */
export function isConsentExpired(
  cookie: ConsentCookiePayload,
  consentLifetimeDays: number,
): boolean {
  const lifetimeMs = consentLifetimeDays * 24 * 60 * 60 * 1000;
  return Date.now() - cookie.timestamp >= lifetimeMs;
}
