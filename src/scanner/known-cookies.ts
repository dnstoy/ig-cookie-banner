import type { KnownCookie } from "./types.js";

/**
 * Database of well-known cookie patterns for auto-categorization.
 * Patterns are matched against cookie names using simple prefix/exact matching.
 * The `pattern` field supports:
 *   - Exact match: "cookie_name"
 *   - Prefix match: "cookie_prefix*"
 */
export const KNOWN_COOKIES: readonly KnownCookie[] = [
  // ── Analytics ──────────────────────────────────────────────────────
  { pattern: "_ga", category: "analytics", purpose: "Google Analytics client ID" },
  { pattern: "_ga_*", category: "analytics", purpose: "Google Analytics session state" },
  { pattern: "_gid", category: "analytics", purpose: "Google Analytics session ID" },
  { pattern: "_gat*", category: "analytics", purpose: "Google Analytics throttle" },
  { pattern: "__utma", category: "analytics", purpose: "Google Analytics legacy visitor" },
  { pattern: "__utmb", category: "analytics", purpose: "Google Analytics legacy session" },
  { pattern: "__utmc", category: "analytics", purpose: "Google Analytics legacy session" },
  { pattern: "__utmz", category: "analytics", purpose: "Google Analytics legacy traffic source" },
  { pattern: "__utmt", category: "analytics", purpose: "Google Analytics legacy throttle" },
  { pattern: "_hjSession*", category: "analytics", purpose: "Hotjar session data" },
  { pattern: "_hjid", category: "analytics", purpose: "Hotjar user ID" },
  { pattern: "_hjFirstSeen", category: "analytics", purpose: "Hotjar first visit marker" },
  { pattern: "_hjIncludedInSessionSample*", category: "analytics", purpose: "Hotjar sampling" },
  { pattern: "_hjAbsoluteSessionInProgress", category: "analytics", purpose: "Hotjar session tracking" },
  { pattern: "mp_*", category: "analytics", purpose: "Mixpanel analytics" },
  { pattern: "amplitude_id*", category: "analytics", purpose: "Amplitude analytics user ID" },
  { pattern: "_clck", category: "analytics", purpose: "Microsoft Clarity user ID" },
  { pattern: "_clsk", category: "analytics", purpose: "Microsoft Clarity session data" },
  { pattern: "CLID", category: "analytics", purpose: "Microsoft Clarity identifier" },
  { pattern: "ajs_anonymous_id", category: "analytics", purpose: "Segment anonymous ID" },
  { pattern: "ajs_user_id", category: "analytics", purpose: "Segment user ID" },
  { pattern: "_pk_id*", category: "analytics", purpose: "Matomo (Piwik) visitor ID" },
  { pattern: "_pk_ses*", category: "analytics", purpose: "Matomo (Piwik) session" },
  { pattern: "plausible_ignore", category: "analytics", purpose: "Plausible Analytics opt-out" },

  // ── Marketing / Advertising ────────────────────────────────────────
  { pattern: "_fbp", category: "marketing", purpose: "Facebook Pixel browser ID" },
  { pattern: "_fbc", category: "marketing", purpose: "Facebook click ID" },
  { pattern: "fr", category: "marketing", purpose: "Facebook advertising" },
  { pattern: "_gcl_au", category: "marketing", purpose: "Google Ads conversion linker" },
  { pattern: "_gcl_aw", category: "marketing", purpose: "Google Ads click data" },
  { pattern: "IDE", category: "marketing", purpose: "Google DoubleClick ad targeting" },
  { pattern: "test_cookie", category: "marketing", purpose: "Google DoubleClick cookie support test" },
  { pattern: "_uetsid", category: "marketing", purpose: "Microsoft Advertising session ID" },
  { pattern: "_uetvid", category: "marketing", purpose: "Microsoft Advertising visitor ID" },
  { pattern: "muc_ads", category: "marketing", purpose: "Twitter ad targeting" },
  { pattern: "_pin_unauth", category: "marketing", purpose: "Pinterest tracking" },
  { pattern: "_pinterest_sess", category: "marketing", purpose: "Pinterest session" },
  { pattern: "li_sugr", category: "marketing", purpose: "LinkedIn Ads browser ID" },
  { pattern: "bcookie", category: "marketing", purpose: "LinkedIn browser ID" },
  { pattern: "lidc", category: "marketing", purpose: "LinkedIn data center routing" },
  { pattern: "UserMatchHistory", category: "marketing", purpose: "LinkedIn ad matching" },
  { pattern: "tt_*", category: "marketing", purpose: "TikTok tracking" },
  { pattern: "_ttp", category: "marketing", purpose: "TikTok tracking pixel" },
  { pattern: "hubspotutk", category: "marketing", purpose: "HubSpot visitor tracking" },
  { pattern: "__hssc", category: "marketing", purpose: "HubSpot session tracking" },
  { pattern: "__hssrc", category: "marketing", purpose: "HubSpot session reset" },
  { pattern: "__hstc", category: "marketing", purpose: "HubSpot main tracking" },

  // ── Functional ─────────────────────────────────────────────────────
  { pattern: "intercom-*", category: "functional", purpose: "Intercom chat widget" },
  { pattern: "drift_*", category: "functional", purpose: "Drift chat widget" },
  { pattern: "crisp-*", category: "functional", purpose: "Crisp chat widget" },
  { pattern: "_zendesk_*", category: "functional", purpose: "Zendesk support widget" },
  { pattern: "wp-settings-*", category: "functional", purpose: "WordPress user settings" },
  { pattern: "wordpress_logged_in*", category: "functional", purpose: "WordPress auth state" },

  // ── Necessary / Essential ──────────────────────────────────────────
  { pattern: "ig_consent", category: "necessary", purpose: "Cookie consent preferences" },
  { pattern: "__cf_bm", category: "necessary", purpose: "Cloudflare bot management" },
  { pattern: "cf_clearance", category: "necessary", purpose: "Cloudflare challenge clearance" },
  { pattern: "__cfruid", category: "necessary", purpose: "Cloudflare rate limiting" },
  { pattern: "XSRF-TOKEN", category: "necessary", purpose: "CSRF protection token" },
  { pattern: "csrf*", category: "necessary", purpose: "CSRF protection" },
  { pattern: "__stripe_mid", category: "necessary", purpose: "Stripe fraud prevention" },
  { pattern: "__stripe_sid", category: "necessary", purpose: "Stripe session" },
];

/**
 * Match a cookie name against the known cookie database.
 * Returns the first matching KnownCookie entry, or undefined if no match.
 */
export function matchKnownCookie(
  cookieName: string,
): KnownCookie | undefined {
  for (const entry of KNOWN_COOKIES) {
    if (entry.pattern.endsWith("*")) {
      const prefix = entry.pattern.slice(0, -1);
      if (cookieName.startsWith(prefix)) {
        return entry;
      }
    } else {
      if (cookieName === entry.pattern) {
        return entry;
      }
    }
  }
  return undefined;
}
