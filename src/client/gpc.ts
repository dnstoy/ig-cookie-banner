import type { BannerConfig, GpcState } from "../types/index.js";

/**
 * Client-side GPC detection.
 * Checks navigator.globalPrivacyControl and merges with edge detection.
 * The client-side check is authoritative — if either edge OR client detects GPC,
 * the opt-out is applied.
 */
export function detectClientGpc(
  edgeGpcState: GpcState,
  config: BannerConfig,
  geo: { country: string; region?: string },
): GpcState {
  if (!config.gpc.enabled) {
    return "not-detected";
  }

  // Check navigator API
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const hasNavigatorGpc =
    nav !== undefined &&
    "globalPrivacyControl" in nav &&
    (nav as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true;

  // Either edge or client detection triggers GPC
  const hasAnyGpcSignal = edgeGpcState === "detected" || hasNavigatorGpc;

  if (!hasAnyGpcSignal) {
    return "not-detected";
  }

  // Check if in a GPC-honored region
  if (isGpcHonoredRegion(geo, config)) {
    return "detected";
  }

  return "not-detected";
}

function isGpcHonoredRegion(
  geo: { country: string; region?: string },
  config: BannerConfig,
): boolean {
  const regions = config.gpc.honorInRegions;

  if (regions.includes("*")) {
    return true;
  }

  if (geo.region !== undefined) {
    const compositeKey = `${geo.country}-${geo.region}`;
    if (regions.includes(compositeKey)) {
      return true;
    }
  }

  return regions.includes(geo.country);
}
