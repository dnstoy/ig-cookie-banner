import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  ConsentCategory,
  ConsentModel,
  ConsentState,
  ConsentRecord,
  GpcState,
  GoogleConsentMode,
  ConsentCookiePayload,
  BannerState,
  BootstrapPayload,
  BannerConfig,
} from "../../src/types/index.js";

describe("Core TypeScript types", () => {
  describe("ConsentCategory", () => {
    it("should accept a valid category", () => {
      const category: ConsentCategory = {
        id: "analytics",
        required: false,
        defaultState: "denied",
      };
      expect(category.id).toBe("analytics");
      expect(category.required).toBe(false);
      expect(category.defaultState).toBe("denied");
    });

    it("should accept a required category", () => {
      const category: ConsentCategory = {
        id: "necessary",
        required: true,
        defaultState: "granted",
      };
      expect(category.required).toBe(true);
    });
  });

  describe("ConsentModel", () => {
    it("should accept valid consent models", () => {
      const models: ConsentModel[] = ["opt-in", "opt-out", "notice-only"];
      expect(models).toHaveLength(3);
    });
  });

  describe("ConsentState", () => {
    it("should map category IDs to granted/denied", () => {
      const state: ConsentState = {
        necessary: "granted",
        analytics: "denied",
        marketing: "denied",
      };
      expect(state["analytics"]).toBe("denied");
    });
  });

  describe("ConsentRecord", () => {
    it("should contain all audit fields", () => {
      const record: ConsentRecord = {
        consentId: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: Date.now(),
        consentState: { necessary: "granted", analytics: "denied" },
        configVersion: "1.0.0",
        method: "banner",
        consentModel: "opt-in",
        geoLocation: "DE",
        locale: "en",
      };
      expect(record.consentId).toBeDefined();
      expect(record.method).toBe("banner");
      expect(record.locale).toBe("en");
    });

    it("should accept gpc method", () => {
      const record: ConsentRecord = {
        consentId: "test",
        timestamp: Date.now(),
        consentState: { necessary: "granted" },
        configVersion: "1.0.0",
        method: "gpc",
        consentModel: "opt-out",
        geoLocation: "US-CA",
        locale: "en",
      };
      expect(record.method).toBe("gpc");
      expect(record.geoLocation).toBe("US-CA");
    });

    it("should accept api method", () => {
      const record: ConsentRecord = {
        consentId: "test",
        timestamp: Date.now(),
        consentState: { necessary: "granted" },
        configVersion: "1.0.0",
        method: "api",
        consentModel: "opt-in",
        geoLocation: "DE",
        locale: "de",
      };
      expect(record.method).toBe("api");
    });
  });

  describe("GpcState", () => {
    it("should accept valid states", () => {
      const detected: GpcState = "detected";
      const notDetected: GpcState = "not-detected";
      expect(detected).toBe("detected");
      expect(notDetected).toBe("not-detected");
    });
  });

  describe("GoogleConsentMode", () => {
    it("should map all 4 Google parameters", () => {
      const mode: GoogleConsentMode = {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      };
      expect(Object.keys(mode)).toHaveLength(4);
    });
  });

  describe("ConsentCookiePayload", () => {
    it("should contain the cookie fields", () => {
      const payload: ConsentCookiePayload = {
        consentId: "550e8400-e29b-41d4-a716-446655440000",
        consentState: { necessary: "granted", analytics: "granted" },
        configVersion: "1.0.0",
        timestamp: Date.now(),
        method: "banner",
      };
      expect(payload.consentId).toBeDefined();
      expect(payload.method).toBe("banner");
    });

    it("should only accept banner or gpc as method", () => {
      expectTypeOf<ConsentCookiePayload["method"]>().toEqualTypeOf<
        "banner" | "gpc"
      >();
    });
  });

  describe("BannerState", () => {
    it("should accept valid banner states", () => {
      const states: BannerState[] = ["none", "first-visit", "re-prompt"];
      expect(states).toHaveLength(3);
    });
  });

  describe("BootstrapPayload", () => {
    it("should contain the full runtime context", () => {
      const payload: BootstrapPayload = {
        consentModel: "opt-in",
        bannerState: "first-visit",
        gpcState: "not-detected",
        geo: { country: "DE" },
        config: {
          version: "1.0.0",
          fallbackConsentModel: "opt-in",
          cookieDomain: ".example.com",
          consentLifetimeDays: 365,
          categories: [
            { id: "necessary", required: true, defaultState: "granted" },
          ],
          regionModelMap: { DE: "opt-in" },
          googleConsentMode: {
            analytics: ["analytics_storage"],
          },
          organization: {
            name: "Test Co",
            privacyPolicyUrl: "https://example.com/privacy",
          },
          gpc: {
            enabled: true,
            honorInRegions: ["US-CA"],
          },
          locales: {
            defaultLocale: "en",
            supported: ["en"],
          },
          ui: {
            theme: {
              accentColor: "#0066cc",
              backgroundColor: "#ffffff",
              textColor: "#333333",
              fontFamily: "system-ui, sans-serif",
              borderRadius: "8px",
            },
            persistentAccessStyle: "floating-icon",
          },
        },
        locale: {
          banner: {
            optIn: { description: "Cookies.", acceptAll: "Accept", rejectAll: "Reject", managePreferences: "Manage" },
            optOut: { description: "Data.", doNotSell: "DNT", ok: "OK", gpcHonored: "GPC." },
            noticeOnly: { description: "Cookies.", ok: "OK", learnMore: "Learn" },
          },
          modal: {
            optIn: { title: "Prefs", acceptAll: "Accept", rejectAll: "Reject", savePreferences: "Save", necessaryExplanation: "Essential." },
            optOut: { title: "Privacy", saleDescription: "Sale.", saleToggle: "Opt out", advertisingToggle: "Ads", save: "Save", gpcNote: "GPC.", dataCollectedTitle: "Data", thirdPartiesTitle: "Third parties" },
          },
          categories: {
            necessary: { name: "Necessary", description: "Essential." },
          },
          common: { privacyPolicy: "Privacy", poweredBy: "Consent", alwaysOn: "Always on", cookiePreferences: "Cookie preferences" },
        },
        localeCode: "en",
      };
      expect(payload.consentModel).toBe("opt-in");
      expect(payload.config.categories).toHaveLength(1);
      expect(payload.geo.country).toBe("DE");
      expect(payload.localeCode).toBe("en");
      expect(payload.locale.banner.optIn.acceptAll).toBe("Accept");
    });

    it("should accept geo with region", () => {
      const geo: BootstrapPayload["geo"] = {
        country: "CA",
        region: "QC",
      };
      expect(geo.region).toBe("QC");
    });
  });
});
