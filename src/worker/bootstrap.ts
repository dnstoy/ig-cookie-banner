import type {
  BannerConfig,
  BootstrapPayload,
  GpcState,
} from "../types/index.js";
import type { GeoInfo } from "./geo.js";
import { resolveConsentModel } from "./geo.js";
import type { CookieReadResult } from "./cookie.js";
import type { LocaleResult } from "./locale.js";

/**
 * Builds the bootstrap JSON payload that gets injected into the page.
 * This is the shared contract between Worker and client-side code.
 */
export function buildBootstrapPayload(
  config: BannerConfig,
  geo: GeoInfo,
  gpcState: GpcState,
  cookieResult: CookieReadResult,
  localeResult: LocaleResult,
): string {
  const consentModel = resolveConsentModel(geo, config);

  const payload: BootstrapPayload = {
    consentModel,
    bannerState: cookieResult.bannerState,
    gpcState,
    geo: {
      country: geo.country,
      region: geo.region,
    },
    config,
    locale: localeResult.locale,
    localeCode: localeResult.localeCode,
  };

  return JSON.stringify(payload);
}
