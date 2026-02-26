import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsentManager } from "../../src/client/consent-manager.js";
import type { CookieAdapter } from "../../src/client/consent-manager.js";
import type {
  BootstrapPayload,
  BannerConfig,
  ConsentCookiePayload,
} from "../../src/types/index.js";

function makeConfig(overrides?: Partial<BannerConfig>): BannerConfig {
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
    regionModelMap: { DE: "opt-in", US: "opt-out", AU: "notice-only" },
    googleConsentMode: {
      analytics: ["analytics_storage"],
      marketing: ["ad_storage", "ad_user_data", "ad_personalization"],
    },
    organization: { name: "Test", privacyPolicyUrl: "https://test.com" },
    gpc: { enabled: true, honorInRegions: ["US-CA"] },
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

function makeMockCookieAdapter(): CookieAdapter & {
  stored: ConsentCookiePayload | null;
} {
  const adapter = {
    stored: null as ConsentCookiePayload | null,
    read(): ConsentCookiePayload | null {
      return adapter.stored;
    },
    write(payload: ConsentCookiePayload): void {
      adapter.stored = payload;
    },
  };
  return adapter;
}

describe("ConsentManager", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 201 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should default all non-required categories to denied for opt-in model", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      const state = manager.getState();
      expect(state.necessary).toBe("granted");
      expect(state.analytics).toBe("denied");
      expect(state.marketing).toBe("denied");
    });

    it("should default all categories to granted for opt-out model", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(
        makeBootstrap({ consentModel: "opt-out" }),
        adapter,
      );
      const state = manager.getState();
      expect(state.necessary).toBe("granted");
      expect(state.analytics).toBe("granted");
      expect(state.marketing).toBe("granted");
    });

    it("should default all categories to granted for notice-only model", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(
        makeBootstrap({ consentModel: "notice-only" }),
        adapter,
      );
      const state = manager.getState();
      expect(state.necessary).toBe("granted");
      expect(state.analytics).toBe("granted");
      expect(state.marketing).toBe("granted");
    });

    it("should restore state from cookie when bannerState is none", () => {
      const adapter = makeMockCookieAdapter();
      adapter.stored = {
        consentId: "test-uuid",
        consentState: {
          necessary: "granted",
          analytics: "granted",
          marketing: "denied",
        },
        configVersion: "1.0.0",
        timestamp: Date.now(),
        method: "banner",
      };

      const manager = new ConsentManager(
        makeBootstrap({ bannerState: "none" }),
        adapter,
      );
      const state = manager.getState();
      expect(state.analytics).toBe("granted");
      expect(state.marketing).toBe("denied");
    });

    it("should use defaults when bannerState is first-visit even if cookie exists", () => {
      const adapter = makeMockCookieAdapter();
      adapter.stored = {
        consentId: "test-uuid",
        consentState: { necessary: "granted", analytics: "granted" },
        configVersion: "1.0.0",
        timestamp: Date.now(),
        method: "banner",
      };

      const manager = new ConsentManager(
        makeBootstrap({ bannerState: "first-visit" }),
        adapter,
      );
      const state = manager.getState();
      expect(state.analytics).toBe("denied");
    });

    it("should return the consent model", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(
        makeBootstrap({ consentModel: "opt-out" }),
        adapter,
      );
      expect(manager.getConsentModel()).toBe("opt-out");
    });
  });

  describe("updateConsent", () => {
    it("should update the state and write a cookie", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      manager.updateConsent({
        necessary: "granted",
        analytics: "granted",
        marketing: "denied",
      });

      const state = manager.getState();
      expect(state.analytics).toBe("granted");
      expect(state.marketing).toBe("denied");

      expect(adapter.stored).not.toBeNull();
      expect(adapter.stored!.consentState.analytics).toBe("granted");
    });

    it("should force required categories to granted", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      manager.updateConsent({
        necessary: "denied",
        analytics: "granted",
        marketing: "denied",
      });

      expect(manager.getState().necessary).toBe("granted");
    });

    it("should send consent record to the server", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      manager.updateConsent({
        necessary: "granted",
        analytics: "granted",
        marketing: "denied",
      });

      expect(fetch).toHaveBeenCalledWith(
        "/consent",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("should generate a consentId on first update", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      manager.updateConsent({
        necessary: "granted",
        analytics: "granted",
        marketing: "denied",
      });
      expect(manager.getConsentId()).toBeTruthy();
      expect(manager.getConsentId().length).toBeGreaterThan(0);
    });

    it("should notify listeners on update", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      const callback = vi.fn();
      manager.onConsentChange(callback);

      manager.updateConsent({
        necessary: "granted",
        analytics: "granted",
        marketing: "denied",
      });

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ analytics: "granted" }),
      );
    });
  });

  describe("withdrawConsent", () => {
    it("should set all non-required categories to denied", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(
        makeBootstrap({ consentModel: "opt-out" }),
        adapter,
      );
      expect(manager.getState().analytics).toBe("granted");

      manager.withdrawConsent();

      expect(manager.getState().necessary).toBe("granted");
      expect(manager.getState().analytics).toBe("denied");
      expect(manager.getState().marketing).toBe("denied");
    });

    it("should notify listeners on withdrawal", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      const callback = vi.fn();
      manager.onConsentChange(callback);

      manager.withdrawConsent();

      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe("applyGpc", () => {
    it("should deny all non-required categories", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(
        makeBootstrap({ consentModel: "opt-out" }),
        adapter,
      );
      expect(manager.getState().analytics).toBe("granted");

      manager.applyGpc();

      expect(manager.getState().necessary).toBe("granted");
      expect(manager.getState().analytics).toBe("denied");
      expect(manager.getState().marketing).toBe("denied");
    });

    it("should send consent record with method gpc", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      manager.applyGpc();

      expect(fetch).toHaveBeenCalledWith(
        "/consent",
        expect.objectContaining({
          body: expect.stringContaining('"method":"gpc"'),
        }),
      );
    });
  });

  describe("consent record failure resilience", () => {
    it("should still write cookie when server POST fails", () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      );

      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      manager.updateConsent({
        necessary: "granted",
        analytics: "granted",
        marketing: "denied",
      });

      expect(adapter.stored).not.toBeNull();
      expect(manager.getState().analytics).toBe("granted");
    });
  });

  describe("isConsentValid", () => {
    it("should return false when no cookie exists", () => {
      const adapter = makeMockCookieAdapter();
      const manager = new ConsentManager(makeBootstrap(), adapter);
      expect(manager.isConsentValid()).toBe(false);
    });

    it("should return true when cookie version matches config", () => {
      const adapter = makeMockCookieAdapter();
      adapter.stored = {
        consentId: "test-uuid",
        consentState: { necessary: "granted" },
        configVersion: "1.0.0",
        timestamp: Date.now(),
        method: "banner",
      };

      const manager = new ConsentManager(makeBootstrap(), adapter);
      expect(manager.isConsentValid()).toBe(true);
    });

    it("should return false when cookie version mismatches config", () => {
      const adapter = makeMockCookieAdapter();
      adapter.stored = {
        consentId: "test-uuid",
        consentState: { necessary: "granted" },
        configVersion: "0.9.0",
        timestamp: Date.now(),
        method: "banner",
      };

      const manager = new ConsentManager(makeBootstrap(), adapter);
      expect(manager.isConsentValid()).toBe(false);
    });
  });
});
