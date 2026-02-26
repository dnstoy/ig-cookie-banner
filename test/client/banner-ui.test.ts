import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BannerUI } from "../../src/client/ui/banner.js";
import { ConsentManager } from "../../src/client/consent-manager.js";
import type { CookieAdapter } from "../../src/client/consent-manager.js";
import type {
  BootstrapPayload,
  BannerConfig,
  ConsentCookiePayload,
} from "../../src/types/index.js";
import type { LocaleStrings } from "../../src/config/locale.js";

function makeConfig(): BannerConfig {
  return {
    version: "1.0.0",
    fallbackConsentModel: "opt-in",
    cookieDomain: "",
    consentLifetimeDays: 365,
    categories: [
      { id: "necessary", required: true, defaultState: "granted" },
      { id: "analytics", required: false, defaultState: "denied" },
      { id: "marketing", required: false, defaultState: "denied" },
      { id: "functional", required: false, defaultState: "denied" },
    ],
    regionModelMap: {},
    googleConsentMode: {
      analytics: ["analytics_storage"],
      marketing: ["ad_storage", "ad_user_data", "ad_personalization"],
    },
    organization: { name: "Test Co", privacyPolicyUrl: "https://test.com/privacy" },
    gpc: { enabled: true, honorInRegions: ["US-CA"] },
    locales: { defaultLocale: "en", supported: ["en"] },
    ui: {
      theme: {
        accentColor: "#0166ff",
        backgroundColor: "#ffffff",
        textColor: "#1a1a1a",
        fontFamily: "system-ui",
        borderRadius: "8px",
      },
      persistentAccessStyle: "floating-icon",
    },
    optOut: {
      dataCategories: ["Identifiers", "Internet activity"],
      thirdPartyCategories: ["Analytics providers"],
    },
  };
}

function makeBootstrap(
  overrides?: Partial<BootstrapPayload>,
): BootstrapPayload {
  return {
    consentModel: "opt-in",
    bannerState: "first-visit",
    gpcState: "not-detected",
    geo: { country: "DE" },
    config: makeConfig(),
    ...overrides,
  };
}

function makeLocale(): LocaleStrings {
  return {
    banner: {
      optIn: {
        description: "We use cookies.",
        acceptAll: "Accept all",
        rejectAll: "Reject all",
        managePreferences: "Manage preferences",
      },
      optOut: {
        description: "We collect data.",
        doNotSell: "Do Not Sell",
        ok: "Got it",
        gpcHonored: "GPC honored.",
      },
      noticeOnly: {
        description: "This site uses cookies.",
        ok: "Got it",
        learnMore: "Learn more",
      },
    },
    modal: {
      optIn: {
        title: "Cookie preferences",
        acceptAll: "Accept all",
        rejectAll: "Reject all",
        savePreferences: "Save preferences",
        necessaryExplanation: "Essential cookies.",
      },
      optOut: {
        title: "Privacy preferences",
        saleDescription: "We share data.",
        saleToggle: "Opt out of sale",
        advertisingToggle: "Opt out of ads",
        save: "Save",
        gpcNote: "GPC detected.",
        dataCollectedTitle: "Data collected",
        thirdPartiesTitle: "Third parties",
      },
    },
    categories: {
      necessary: { name: "Necessary", description: "Essential." },
      analytics: { name: "Analytics", description: "Usage stats." },
      marketing: { name: "Marketing", description: "Ads." },
      functional: { name: "Functional", description: "Features." },
    },
    common: { privacyPolicy: "Privacy", poweredBy: "Consent" },
  };
}

function makeMockAdapter(): CookieAdapter & {
  stored: ConsentCookiePayload | null;
} {
  return {
    stored: null,
    read() {
      return this.stored;
    },
    write(payload: ConsentCookiePayload) {
      this.stored = payload;
    },
  };
}

function getShadowRoot(): ShadowRoot | null {
  const host = document.querySelector("ig-consent-banner");
  return host?.shadowRoot ?? null;
}

describe("Banner UI", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 201 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up custom element
    document.querySelectorAll("ig-consent-banner").forEach((el) => el.remove());
  });

  describe("Opt-in banner", () => {
    it("should render with Accept All, Reject All, and Manage Preferences", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      expect(shadow).not.toBeNull();

      const banner = shadow!.querySelector(".ig-banner");
      expect(banner).not.toBeNull();
      expect(banner!.textContent).toContain("We use cookies.");
      expect(banner!.querySelector('[data-action="accept-all"]')).not.toBeNull();
      expect(banner!.querySelector('[data-action="reject-all"]')).not.toBeNull();
      expect(banner!.querySelector('[data-action="manage"]')).not.toBeNull();
    });

    it("should render an overlay that blocks page interaction", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      const overlay = shadow!.querySelector(".ig-overlay");
      expect(overlay).not.toBeNull();
    });

    it("should dismiss banner and show persistent access on Accept All", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      const acceptBtn = shadow!.querySelector('[data-action="accept-all"]') as HTMLButtonElement;
      acceptBtn.click();

      expect(shadow!.querySelector(".ig-banner")).toBeNull();
      expect(shadow!.querySelector(".ig-overlay")).toBeNull();
      expect(shadow!.querySelector(".ig-persistent")).not.toBeNull();
      expect(manager.getState().analytics).toBe("granted");
    });

    it("should deny all non-required categories on Reject All", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      const rejectBtn = shadow!.querySelector('[data-action="reject-all"]') as HTMLButtonElement;
      rejectBtn.click();

      expect(manager.getState().necessary).toBe("granted");
      expect(manager.getState().analytics).toBe("denied");
      expect(manager.getState().marketing).toBe("denied");
      expect(shadow!.querySelector(".ig-banner")).toBeNull();
    });
  });

  describe("Opt-out banner", () => {
    it("should render with Do Not Sell link and OK button", () => {
      const bootstrap = makeBootstrap({ consentModel: "opt-out" });
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      const banner = shadow!.querySelector(".ig-banner");
      expect(banner!.textContent).toContain("We collect data.");
      expect(banner!.querySelector('[data-action="do-not-sell"]')).not.toBeNull();
      expect(banner!.querySelector('[data-action="ok"]')).not.toBeNull();
    });

    it("should show GPC honored message when GPC is detected", () => {
      const bootstrap = makeBootstrap({
        consentModel: "opt-out",
        gpcState: "detected",
      });
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      expect(shadow!.querySelector(".ig-gpc-notice")).not.toBeNull();
      expect(shadow!.querySelector(".ig-gpc-notice")!.textContent).toContain("GPC honored");
      // No "Do Not Sell" link when GPC is detected
      expect(shadow!.querySelector('[data-action="do-not-sell"]')).toBeNull();
    });

    it("should dismiss on OK without changing opt-out state", () => {
      const bootstrap = makeBootstrap({ consentModel: "opt-out" });
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      (shadow!.querySelector('[data-action="ok"]') as HTMLButtonElement).click();

      // Opt-out default is all granted (tracking runs)
      expect(manager.getState().analytics).toBe("granted");
      expect(shadow!.querySelector(".ig-banner")).toBeNull();
    });
  });

  describe("Notice-only banner", () => {
    it("should render with OK button and Learn More link", () => {
      const bootstrap = makeBootstrap({ consentModel: "notice-only" });
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      const banner = shadow!.querySelector(".ig-banner");
      expect(banner!.textContent).toContain("This site uses cookies.");
      expect(banner!.querySelector('[data-action="ok"]')).not.toBeNull();
      expect(banner!.textContent).toContain("Learn more");
    });

    it("should dismiss on OK click", () => {
      const bootstrap = makeBootstrap({ consentModel: "notice-only" });
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      (shadow!.querySelector('[data-action="ok"]') as HTMLButtonElement).click();

      expect(shadow!.querySelector(".ig-banner")).toBeNull();
    });
  });

  describe("Opt-in modal", () => {
    it("should open from Manage Preferences and show all categories", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      (shadow!.querySelector('[data-action="manage"]') as HTMLButtonElement).click();

      const modal = shadow!.querySelector(".ig-modal");
      expect(modal).not.toBeNull();
      expect(modal!.textContent).toContain("Cookie preferences");

      // Should have all 4 categories
      const categories = shadow!.querySelectorAll(".ig-category");
      expect(categories).toHaveLength(4);
    });

    it("should have necessary category toggle disabled", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      (shadow!.querySelector('[data-action="manage"]') as HTMLButtonElement).click();

      const necessaryToggle = shadow!.querySelector(
        'input[data-category="necessary"]',
      ) as HTMLInputElement;
      expect(necessaryToggle).not.toBeNull();
      expect(necessaryToggle.disabled).toBe(true);
      expect(necessaryToggle.checked).toBe(true);
    });

    it("should have non-required categories default to unchecked in opt-in", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      (shadow!.querySelector('[data-action="manage"]') as HTMLButtonElement).click();

      const analyticsToggle = shadow!.querySelector(
        'input[data-category="analytics"]',
      ) as HTMLInputElement;
      expect(analyticsToggle.checked).toBe(false);
      expect(analyticsToggle.disabled).toBe(false);
    });

    it("should save only selected categories on Save Preferences", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      (shadow!.querySelector('[data-action="manage"]') as HTMLButtonElement).click();

      // Toggle analytics on
      const analyticsToggle = shadow!.querySelector(
        'input[data-category="analytics"]',
      ) as HTMLInputElement;
      analyticsToggle.checked = true;

      // Click save
      (shadow!.querySelector('[data-action="save"]') as HTMLButtonElement).click();

      expect(manager.getState().analytics).toBe("granted");
      expect(manager.getState().marketing).toBe("denied");
    });
  });

  describe("Opt-out modal", () => {
    it("should render opt-out controls", () => {
      const bootstrap = makeBootstrap({ consentModel: "opt-out" });
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      (shadow!.querySelector('[data-action="do-not-sell"]') as HTMLButtonElement).click();

      const modal = shadow!.querySelector(".ig-modal");
      expect(modal).not.toBeNull();
      expect(modal!.textContent).toContain("Privacy preferences");
      expect(shadow!.querySelector('[data-optout="sale"]')).not.toBeNull();
      expect(shadow!.querySelector('[data-optout="advertising"]')).not.toBeNull();
    });

    it("should show data categories and third parties", () => {
      const bootstrap = makeBootstrap({ consentModel: "opt-out" });
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      (shadow!.querySelector('[data-action="do-not-sell"]') as HTMLButtonElement).click();

      const modal = shadow!.querySelector(".ig-modal");
      expect(modal!.textContent).toContain("Identifiers");
      expect(modal!.textContent).toContain("Analytics providers");
    });

    it("should pre-set toggles when GPC is detected", () => {
      const bootstrap = makeBootstrap({
        consentModel: "opt-out",
        gpcState: "detected",
      });
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.openModal();

      const shadow = getShadowRoot();
      const saleToggle = shadow!.querySelector(
        '[data-optout="sale"]',
      ) as HTMLInputElement;
      expect(saleToggle.checked).toBe(true);
      expect(saleToggle.disabled).toBe(true);
    });
  });

  describe("Persistent access", () => {
    it("should show persistent icon after banner dismissal", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.show();

      const shadow = getShadowRoot();
      (shadow!.querySelector('[data-action="accept-all"]') as HTMLButtonElement).click();

      expect(shadow!.querySelector(".ig-persistent")).not.toBeNull();
    });

    it("should open modal when persistent icon is clicked", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const ui = new BannerUI(manager, bootstrap, makeLocale());
      ui.showPersistentAccess();

      const shadow = getShadowRoot();
      (shadow!.querySelector(".ig-persistent-btn") as HTMLButtonElement).click();

      expect(shadow!.querySelector(".ig-modal")).not.toBeNull();
    });
  });

  describe("Theming", () => {
    it("should apply theme CSS variables to host element", () => {
      const bootstrap = makeBootstrap();
      const adapter = makeMockAdapter();
      const manager = new ConsentManager(bootstrap, adapter);
      const _ui = new BannerUI(manager, bootstrap, makeLocale());

      const host = document.querySelector("ig-consent-banner") as HTMLElement;
      expect(host.style.cssText).toContain("--ig-accent: #0166ff");
      expect(host.style.cssText).toContain("--ig-bg: #ffffff");
    });
  });
});
