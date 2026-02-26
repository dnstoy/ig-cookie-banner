import type {
  BannerConfig,
  BannerState,
  ConsentCookiePayload,
} from "../types/index.js";
import { isConsentStale, isConsentExpired } from "../config/versioning.js";

const COOKIE_NAME = "ig_consent";

export interface CookieReadResult {
  readonly bannerState: BannerState;
  readonly payload: ConsentCookiePayload | null;
}

/**
 * Reads and validates the consent cookie from the request.
 * Returns the banner state and the parsed payload (if valid).
 */
export function readConsentCookie(
  request: Request,
  config: BannerConfig,
): CookieReadResult {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return { bannerState: "first-visit", payload: null };
  }

  const cookieValue = parseCookieValue(cookieHeader, COOKIE_NAME);
  if (!cookieValue) {
    return { bannerState: "first-visit", payload: null };
  }

  const payload = decodeCookiePayload(cookieValue);
  if (!payload) {
    // Malformed cookie — treat as missing
    return { bannerState: "first-visit", payload: null };
  }

  // Check staleness (config version mismatch)
  if (isConsentStale(payload, config.version)) {
    return { bannerState: "re-prompt", payload };
  }

  // Check expiry (defense-in-depth — browser Max-Age should handle this)
  if (isConsentExpired(payload, config.consentLifetimeDays)) {
    return { bannerState: "re-prompt", payload };
  }

  return { bannerState: "none", payload };
}

function parseCookieValue(
  header: string,
  name: string,
): string | undefined {
  const prefix = `${name}=`;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length);
    }
  }
  return undefined;
}

function decodeCookiePayload(
  value: string,
): ConsentCookiePayload | null {
  try {
    const decoded = decodeURIComponent(value);
    const parsed: unknown = JSON.parse(decoded);

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      !("consentId" in parsed) ||
      !("consentState" in parsed) ||
      !("configVersion" in parsed) ||
      !("timestamp" in parsed) ||
      !("method" in parsed)
    ) {
      return null;
    }

    return parsed as ConsentCookiePayload;
  } catch {
    return null;
  }
}
