import type { BannerConfig, GpcState } from "../types/index.js";
import type { GeoInfo } from "./geo.js";

/**
 * Detects GPC signal from the Sec-GPC header.
 * In dev mode, checks for ?_gpc=1 query param override.
 */
export function detectGpc(
  request: Request,
  url: URL,
  config: BannerConfig,
  geo: GeoInfo,
  isDev: boolean,
): GpcState {
  if (!config.gpc.enabled) {
    return "not-detected";
  }

  // Check for the signal
  let hasGpcSignal = request.headers.get("Sec-GPC") === "1";

  // Dev mode override
  if (isDev && url.searchParams.get("_gpc") === "1") {
    hasGpcSignal = true;
  }

  if (!hasGpcSignal) {
    return "not-detected";
  }

  // Check if visitor is in a GPC-mandated region
  if (isGpcHonoredRegion(geo, config)) {
    return "detected";
  }

  return "not-detected";
}

function isGpcHonoredRegion(geo: GeoInfo, config: BannerConfig): boolean {
  const regions = config.gpc.honorInRegions;

  // "*" means honor everywhere
  if (regions.includes("*")) {
    return true;
  }

  // Check composite key first (e.g. "US-CA")
  if (geo.region !== undefined) {
    const compositeKey = `${geo.country}-${geo.region}`;
    if (regions.includes(compositeKey)) {
      return true;
    }
  }

  // Check country-level
  return regions.includes(geo.country);
}
