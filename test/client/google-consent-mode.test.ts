import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fireConsentDefault,
  fireConsentUpdate,
} from "../../src/client/google-consent-mode.js";
import type { BannerConfig } from "../../src/types/index.js";

function makeConfig(): BannerConfig {
  return {
    version: "1.0.0",
    fallbackConsentModel: "opt-in",
    cookieDomain: "localhost",
    consentLifetimeDays: 365,
    categories: [
      { id: "necessary", required: true, defaultState: "granted" },
      { id: "analytics", required: false, defaultState: "denied" },
      { id: "marketing", required: false, defaultState: "denied" },
    ],
    regionModelMap: {},
    googleConsentMode: {
      analytics: ["analytics_storage"],
      marketing: ["ad_storage", "ad_user_data", "ad_personalization"],
    },
    organization: { name: "Test", privacyPolicyUrl: "https://test.com" },
    gpc: { enabled: false, honorInRegions: [] },
    locales: { defaultLocale: "en", supported: ["en"] },
    ui: {
      theme: {
        accentColor: "#0066cc",
        backgroundColor: "#fff",
        textColor: "#000",
        fontFamily: "sans-serif",
        borderRadius: "8px",
      },
      persistentAccessStyle: "floating-icon",
    },
  };
}

describe("Google Consent Mode", () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    vi.stubGlobal("window", {
      ...globalThis.window,
      gtag: gtagSpy,
    });
    // Also set on globalThis for happy-dom
    (globalThis as Record<string, unknown>).gtag = gtagSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>).gtag;
  });

  describe("fireConsentDefault", () => {
    it("should fire denied defaults for opt-in regions", () => {
      fireConsentDefault("opt-in", makeConfig());
      expect(gtagSpy).toHaveBeenCalledWith("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    });

    it("should fire granted defaults for opt-out regions", () => {
      fireConsentDefault("opt-out", makeConfig());
      expect(gtagSpy).toHaveBeenCalledWith("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    });

    it("should fire granted defaults for notice-only regions", () => {
      fireConsentDefault("notice-only", makeConfig());
      expect(gtagSpy).toHaveBeenCalledWith("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    });

    it("should not throw when gtag is not available", () => {
      delete (globalThis as Record<string, unknown>).gtag;
      // Re-stub window without gtag
      vi.stubGlobal("window", {});
      expect(() => fireConsentDefault("opt-in", makeConfig())).not.toThrow();
    });
  });

  describe("fireConsentUpdate", () => {
    it("should fire update with correct params when analytics is granted", () => {
      fireConsentUpdate(
        { necessary: "granted", analytics: "granted", marketing: "denied" },
        makeConfig(),
      );
      expect(gtagSpy).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    });

    it("should fire update with all granted when both analytics and marketing are granted", () => {
      fireConsentUpdate(
        { necessary: "granted", analytics: "granted", marketing: "granted" },
        makeConfig(),
      );
      expect(gtagSpy).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    });

    it("should fire update with all denied when all non-required are denied", () => {
      fireConsentUpdate(
        { necessary: "granted", analytics: "denied", marketing: "denied" },
        makeConfig(),
      );
      expect(gtagSpy).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    });
  });
});
