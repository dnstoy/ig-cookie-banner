import { describe, it, expect } from "vitest";
import { validateConfig } from "../../src/config/validate.js";
import type { BannerConfig } from "../../src/types/index.js";

function validConfig(overrides: Partial<BannerConfig> = {}): unknown {
  return {
    version: "1.0.0",
    fallbackConsentModel: "opt-in",
    cookieDomain: ".example.com",
    consentLifetimeDays: 365,
    categories: [
      { id: "necessary", required: true, defaultState: "granted" },
      { id: "analytics", required: false, defaultState: "denied" },
      { id: "marketing", required: false, defaultState: "denied" },
    ],
    regionModelMap: {
      DE: "opt-in",
      US: "opt-out",
      AU: "notice-only",
      "CA-QC": "opt-in",
      CA: "notice-only",
    },
    googleConsentMode: {
      analytics: ["analytics_storage"],
      marketing: ["ad_storage", "ad_user_data", "ad_personalization"],
    },
    organization: {
      name: "Test Company",
      privacyPolicyUrl: "https://example.com/privacy",
    },
    gpc: {
      enabled: true,
      honorInRegions: ["US-CA", "US-CO", "US-CT"],
    },
    locales: {
      defaultLocale: "en",
      supported: ["en", "fr"],
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
    ...overrides,
  };
}

describe("validateConfig", () => {
  it("should accept a valid config", () => {
    const result = validateConfig(validConfig());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.version).toBe("1.0.0");
      expect(result.value.categories).toHaveLength(3);
    }
  });

  it("should accept config with optional optOut fields", () => {
    const result = validateConfig(
      validConfig({
        optOut: {
          dataCategories: [
            "Identifiers",
            "Internet activity",
            "Geolocation",
          ],
          thirdPartyCategories: [
            "Analytics providers",
            "Advertising networks",
          ],
        },
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("should accept config with optional organization fields", () => {
    const result = validateConfig(
      validConfig({
        organization: {
          name: "Test Company",
          privacyPolicyUrl: "https://example.com/privacy",
          contactEmail: "privacy@example.com",
          address: "123 Main St",
        },
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("should reject null input", () => {
    const result = validateConfig(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Config must be a non-null object");
    }
  });

  it("should reject non-object input", () => {
    const result = validateConfig("not an object");
    expect(result.ok).toBe(false);
  });

  it("should reject missing version", () => {
    const config = validConfig();
    delete (config as Record<string, unknown>)["version"];
    const result = validateConfig(config);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("version"))).toBe(true);
    }
  });

  it("should reject empty version", () => {
    const result = validateConfig(validConfig({ version: "" }));
    expect(result.ok).toBe(false);
  });

  it("should reject invalid fallbackConsentModel", () => {
    const result = validateConfig(
      validConfig({
        fallbackConsentModel: "invalid" as BannerConfig["fallbackConsentModel"],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.includes("fallbackConsentModel")),
      ).toBe(true);
    }
  });

  it("should reject missing cookieDomain", () => {
    const config = validConfig();
    delete (config as Record<string, unknown>)["cookieDomain"];
    const result = validateConfig(config);
    expect(result.ok).toBe(false);
  });

  it("should reject non-positive consentLifetimeDays", () => {
    const result = validateConfig(validConfig({ consentLifetimeDays: 0 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some((e) => e.includes("consentLifetimeDays")),
      ).toBe(true);
    }
  });

  it("should reject empty categories array", () => {
    const result = validateConfig(validConfig({ categories: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("categories"))).toBe(true);
    }
  });

  it("should reject categories with duplicate IDs", () => {
    const result = validateConfig(
      validConfig({
        categories: [
          { id: "analytics", required: false, defaultState: "denied" },
          { id: "analytics", required: false, defaultState: "denied" },
        ],
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("duplicate"))).toBe(true);
    }
  });

  it("should reject category with missing id", () => {
    const result = validateConfig(
      validConfig({
        categories: [
          { required: true, defaultState: "granted" } as ConsentCategory,
        ],
      } as Partial<BannerConfig>),
    );
    expect(result.ok).toBe(false);
  });

  it("should reject invalid consent model in regionModelMap", () => {
    const result = validateConfig(
      validConfig({
        regionModelMap: { DE: "invalid" as ConsentModel },
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("regionModelMap"))).toBe(
        true,
      );
    }
  });

  it("should reject missing organization name", () => {
    const result = validateConfig(
      validConfig({
        organization: {
          name: "",
          privacyPolicyUrl: "https://example.com/privacy",
        },
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("should reject missing privacyPolicyUrl", () => {
    const result = validateConfig(
      validConfig({
        organization: {
          name: "Test Co",
          privacyPolicyUrl: "",
        },
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("should reject missing locales.defaultLocale", () => {
    const result = validateConfig(
      validConfig({
        locales: {
          defaultLocale: "",
          supported: ["en"],
        },
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("should reject empty supported locales", () => {
    const result = validateConfig(
      validConfig({
        locales: {
          defaultLocale: "en",
          supported: [],
        },
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("should reject invalid persistentAccessStyle", () => {
    const config = validConfig();
    (config as Record<string, unknown>)["ui"] = {
      theme: {
        accentColor: "#0066cc",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        fontFamily: "system-ui",
        borderRadius: "8px",
      },
      persistentAccessStyle: "invalid",
    };
    const result = validateConfig(config);
    expect(result.ok).toBe(false);
  });

  it("should collect multiple errors", () => {
    const result = validateConfig({
      version: "",
      fallbackConsentModel: "invalid",
      categories: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(1);
    }
  });
});
