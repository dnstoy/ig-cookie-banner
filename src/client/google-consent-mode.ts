import type {
  BannerConfig,
  ConsentModel,
  ConsentState,
  GoogleConsentMode,
} from "../types/index.js";

type GtagFn = (...args: unknown[]) => void;

/**
 * Fires the gtag('consent', 'default', ...) call.
 * Must be called before GTM loads.
 */
export function fireConsentDefault(
  consentModel: ConsentModel,
  config: BannerConfig,
): void {
  const gtag = getGtag();
  if (!gtag) return;

  const params = buildConsentParams(consentModel, config);
  gtag("consent", "default", params);
}

/**
 * Fires the gtag('consent', 'update', ...) call when consent changes.
 */
export function fireConsentUpdate(
  state: ConsentState,
  config: BannerConfig,
): void {
  const gtag = getGtag();
  if (!gtag) return;

  const params = mapStateToGoogleParams(state, config);
  gtag("consent", "update", params);
}

function buildConsentParams(
  consentModel: ConsentModel,
  config: BannerConfig,
): GoogleConsentMode {
  const defaultValue =
    consentModel === "opt-in" ? "denied" : "granted";

  return {
    analytics_storage: defaultValue,
    ad_storage: defaultValue,
    ad_user_data: defaultValue,
    ad_personalization: defaultValue,
  };
}

type MutableGoogleConsentMode = {
  -readonly [K in keyof GoogleConsentMode]: GoogleConsentMode[K];
};

function mapStateToGoogleParams(
  state: ConsentState,
  config: BannerConfig,
): GoogleConsentMode {
  const params: MutableGoogleConsentMode = {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  };

  for (const [categoryId, googleParams] of Object.entries(
    config.googleConsentMode,
  )) {
    const categoryState = state[categoryId];
    if (categoryState === "granted") {
      for (const param of googleParams) {
        if (param in params) {
          params[param as keyof GoogleConsentMode] = "granted";
        }
      }
    }
  }

  return params;
}

function getGtag(): GtagFn | undefined {
  if (typeof window === "undefined") return undefined;
  const win = window as Window & { gtag?: GtagFn };
  return typeof win.gtag === "function" ? win.gtag : undefined;
}
