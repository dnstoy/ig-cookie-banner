import { resolveGeo } from "./geo.js";
import { detectGpc } from "./gpc.js";
import { readConsentCookie } from "./cookie.js";
import { buildBootstrapPayload } from "./bootstrap.js";
import { skeletonHtml } from "./skeleton.js";
import {
  handleConsentPost,
  handleConsentGet,
  purgeExpiredRecords,
} from "./consent-api.js";
import BANNER_JS from "./banner-js.js";
import { resolveLocale } from "./locale.js";
import type { BannerConfig, GpcState } from "../types/index.js";
import type { GeoInfo } from "./geo.js";

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  RECORD_RETENTION_DAYS: string;
  TEST_MIGRATIONS?: unknown;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const isDev = env.ENVIRONMENT === "dev";

    // Serve the bundled banner JS
    if (url.pathname === "/ig-consent-banner.js") {
      return new Response(BANNER_JS, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": isDev ? "no-cache" : "public, max-age=31536000, immutable",
        },
      });
    }

    // Consent API: POST /consent
    if (url.pathname === "/consent" && request.method === "POST") {
      return handleConsentPost(request, env);
    }

    // Consent API: GET /consent/:id
    if (
      url.pathname.startsWith("/consent/") &&
      request.method === "GET"
    ) {
      const consentId = url.pathname.slice("/consent/".length);
      return handleConsentGet(consentId, env);
    }

    // Load config, resolve geo, GPC, locale, cookie state
    const config = getConfig();
    const geo = resolveGeo(request, url, config, isDev);
    const gpcState = detectGpc(request, url, config, geo, isDev);
    const localeResult = resolveLocale(url, geo, isDev);
    const cookieResult = readConsentCookie(request, config);
    const bootstrapJson = buildBootstrapPayload(
      config,
      geo,
      gpcState,
      cookieResult,
      localeResult,
    );

    // Phase 1: Build the full HTML response with injected bootstrap
    const html = injectBootstrap(
      skeletonHtml,
      bootstrapJson,
      isDev,
      geo,
      gpcState,
      localeResult.localeCode,
    );

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },

  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    await purgeExpiredRecords(env);
  },
};

function getConfig(): BannerConfig {
  // Inline for Phase 1 — in production, this would be loaded from KV or embedded at build time
  return {
    version: "1.0.0",
    fallbackConsentModel: "opt-in",
    cookieDomain: "localhost",
    consentLifetimeDays: 365,
    categories: [
      { id: "necessary", required: true, defaultState: "granted" },
      { id: "analytics", required: false, defaultState: "denied" },
      { id: "marketing", required: false, defaultState: "denied" },
      { id: "functional", required: false, defaultState: "denied" },
    ],
    regionModelMap: {
      DE: "opt-in",
      FR: "opt-in",
      GB: "opt-in",
      US: "opt-out",
      "US-CA": "opt-out",
      AU: "notice-only",
      CA: "notice-only",
      "CA-QC": "opt-in",
    },
    googleConsentMode: {
      analytics: ["analytics_storage"],
      marketing: ["ad_storage", "ad_user_data", "ad_personalization"],
    },
    organization: {
      name: "Example Company",
      privacyPolicyUrl: "https://example.com/privacy",
    },
    optOut: {
      dataCategories: ["Identifiers", "Internet activity", "Geolocation data"],
      thirdPartyCategories: ["Analytics providers", "Advertising networks"],
    },
    gpc: {
      enabled: true,
      honorInRegions: [
        "US-CA",
        "US-CO",
        "US-CT",
        "US-MT",
        "US-OR",
        "US-TX",
        "US-VA",
      ],
    },
    locales: { defaultLocale: "en", supported: ["en"] },
    ui: {
      theme: {
        accentColor: "#0166ff",
        backgroundColor: "#ffffff",
        textColor: "#1a1a1a",
        fontFamily: "system-ui, -apple-system, sans-serif",
        borderRadius: "8px",
      },
      persistentAccessStyle: "floating-icon",
    },
  };
}

/**
 * Phase 1: Injects bootstrap JSON and banner script into the skeleton HTML.
 * Phase 2 will switch to HTMLRewriter on origin responses.
 */
function injectBootstrap(
  html: string,
  bootstrapJson: string,
  isDev: boolean,
  geo: GeoInfo,
  gpcState: GpcState,
  localeCode: string,
): string {
  const bootstrapTag = `<script id="ig-consent-bootstrap" type="application/json">${bootstrapJson}</script>`;
  const bannerTag = `<script src="/ig-consent-banner.js"></script>`;

  let devOverlay = "";
  if (isDev) {
    const parsed = JSON.parse(bootstrapJson) as { consentModel: string };
    const geoDisplay = geo.region
      ? `${geo.country}-${geo.region}`
      : geo.country;
    const gpcDisplay = gpcState === "detected" ? "on" : "off";
    devOverlay = `<div id="dev-overlay">DEV: geo=${geoDisplay}, gpc=${gpcDisplay}, model=${parsed.consentModel}, lang=${localeCode}</div>`;
  }

  return html
    .replace("</head>", `${bootstrapTag}\n${bannerTag}\n</head>`)
    .replace("<body>", `<body>\n${devOverlay}`);
}
