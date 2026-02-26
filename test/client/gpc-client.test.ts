import { describe, it, expect, vi, afterEach } from "vitest";
import { detectClientGpc } from "../../src/client/gpc.js";
import type { BannerConfig } from "../../src/types/index.js";

function makeConfig(overrides?: Partial<BannerConfig>): BannerConfig {
  return {
    version: "1.0.0",
    fallbackConsentModel: "opt-in",
    cookieDomain: "localhost",
    consentLifetimeDays: 365,
    categories: [],
    regionModelMap: {},
    googleConsentMode: {},
    organization: { name: "Test", privacyPolicyUrl: "https://test.com" },
    gpc: { enabled: true, honorInRegions: ["US-CA", "US-CO"] },
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
    ...overrides,
  };
}

describe("Client-side GPC detection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should detect GPC when navigator.globalPrivacyControl is true in honored region", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    const result = detectClientGpc(
      "not-detected",
      makeConfig(),
      { country: "US", region: "CA" },
    );
    expect(result).toBe("detected");
  });

  it("should detect GPC when edge says detected even if navigator says false", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: false });
    const result = detectClientGpc(
      "detected",
      makeConfig(),
      { country: "US", region: "CA" },
    );
    expect(result).toBe("detected");
  });

  it("should not detect GPC in non-honored region even with navigator signal", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    const result = detectClientGpc(
      "not-detected",
      makeConfig(),
      { country: "DE" },
    );
    expect(result).toBe("not-detected");
  });

  it("should not detect when both edge and client have no signal", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: false });
    const result = detectClientGpc(
      "not-detected",
      makeConfig(),
      { country: "US", region: "CA" },
    );
    expect(result).toBe("not-detected");
  });

  it("should not detect when GPC is disabled in config", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    const result = detectClientGpc(
      "detected",
      makeConfig({ gpc: { enabled: false, honorInRegions: ["*"] } }),
      { country: "US", region: "CA" },
    );
    expect(result).toBe("not-detected");
  });

  it("should detect when honorInRegions includes wildcard", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    const result = detectClientGpc(
      "not-detected",
      makeConfig({ gpc: { enabled: true, honorInRegions: ["*"] } }),
      { country: "JP" },
    );
    expect(result).toBe("detected");
  });

  it("should check country-level when no region matches", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    const config = makeConfig({
      gpc: { enabled: true, honorInRegions: ["US"] },
    });
    const result = detectClientGpc(
      "not-detected",
      config,
      { country: "US", region: "NY" },
    );
    expect(result).toBe("detected");
  });
});
