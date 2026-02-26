import type { BannerConfig, ConsentModel } from "../types/index.js";

export interface GeoInfo {
  readonly country: string;
  readonly region?: string;
}

/**
 * Resolves the visitor's geo location.
 * In dev mode, checks for ?_geo query param override first.
 * In production, reads from request.cf.
 */
export function resolveGeo(
  request: Request,
  url: URL,
  _config: BannerConfig,
  isDev: boolean,
): GeoInfo {
  // Dev mode: check for query param override
  if (isDev) {
    const geoOverride = url.searchParams.get("_geo");
    if (geoOverride) {
      // Support "CA-QC" format
      const parts = geoOverride.split("-");
      if (parts.length >= 2) {
        return { country: parts[0]!, region: parts.slice(1).join("-") };
      }
      return { country: geoOverride };
    }
  }

  // Production: read from Cloudflare request.cf
  const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;
  const country = cf?.country ?? "XX";
  const region = cf?.regionCode;

  return { country, region };
}

/**
 * Hierarchical consent model lookup:
 * 1. Check "{country}-{region}" (e.g. "CA-QC")
 * 2. Fall back to "{country}" (e.g. "CA")
 * 3. Fall back to fallbackConsentModel
 */
export function resolveConsentModel(
  geo: GeoInfo,
  config: BannerConfig,
): ConsentModel {
  const regionKey =
    geo.region !== undefined ? `${geo.country}-${geo.region}` : undefined;

  if (regionKey !== undefined && regionKey in config.regionModelMap) {
    return config.regionModelMap[regionKey]!;
  }

  if (geo.country in config.regionModelMap) {
    return config.regionModelMap[geo.country]!;
  }

  return config.fallbackConsentModel;
}
