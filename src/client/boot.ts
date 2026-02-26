import type { BootstrapPayload } from "../types/index.js";
import type { LocaleStrings } from "../config/locale.js";
import { defaultLocale } from "../config/default-locale.js";
import { ConsentManager } from "./consent-manager.js";
import { detectClientGpc } from "./gpc.js";
import {
  fireConsentDefault,
  fireConsentUpdate,
} from "./google-consent-mode.js";
import { activateScripts, activateCategory } from "./script-blocking.js";
import { BannerUI } from "./ui/banner.js";

/**
 * Main boot sequence. Runs synchronously in <head> before any other scripts.
 * Step 7 (banner rendering) defers to DOMContentLoaded since it needs the DOM.
 */
export function boot(): ConsentManager | null {
  // Step 1: Read bootstrap JSON
  const bootstrap = readBootstrap();
  if (!bootstrap) {
    console.error("[ig-consent] Bootstrap JSON not found");
    return null;
  }

  // Step 2+3: Initialize ConsentManager (reads cookie, resolves state)
  const manager = new ConsentManager(bootstrap);

  // Step 3: Check client-side GPC
  const clientGpc = detectClientGpc(
    bootstrap.gpcState,
    bootstrap.config,
    bootstrap.geo,
  );
  if (clientGpc === "detected") {
    manager.applyGpc();
  }

  // Step 5: Fire Google Consent Mode default signal
  fireConsentDefault(bootstrap.consentModel, bootstrap.config);

  // Step 6: Run script blocking engine
  activateScripts(manager.getState(), bootstrap.consentModel);

  // Wire up consent changes to fire Google Consent Mode update + activate scripts
  manager.onConsentChange((state) => {
    fireConsentUpdate(state, bootstrap.config);

    for (const [categoryId, value] of Object.entries(state)) {
      if (value === "granted") {
        activateCategory(categoryId);
      }
    }
  });

  // Expose manager globally
  (window as Window & { __igConsent?: ConsentManager }).__igConsent = manager;

  // Step 7: Render banner UI after DOM is ready
  const locale = readLocale(bootstrap);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderBanner(manager, bootstrap, locale);
    });
  } else {
    renderBanner(manager, bootstrap, locale);
  }

  return manager;
}

function renderBanner(
  manager: ConsentManager,
  bootstrap: BootstrapPayload,
  locale: LocaleStrings,
): void {
  const ui = new BannerUI(manager, bootstrap, locale);

  if (
    bootstrap.bannerState === "first-visit" ||
    bootstrap.bannerState === "re-prompt"
  ) {
    ui.show();
  } else {
    // Valid consent exists — just show the persistent access
    ui.showPersistentAccess();
  }
}

function readBootstrap(): BootstrapPayload | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById("ig-consent-bootstrap");
  if (!el) return null;

  try {
    return JSON.parse(el.textContent || "") as BootstrapPayload;
  } catch {
    return null;
  }
}

function readLocale(_bootstrap: BootstrapPayload): LocaleStrings {
  // Phase 1: use the default English locale from locales/en.json.
  // Phase 2: locale will come from the bootstrap payload.
  return defaultLocale;
}
