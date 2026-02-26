import { describe, it, expect } from "vitest";
import {
  isConsentStale,
  isConsentExpired,
} from "../../src/config/versioning.js";
import type { ConsentCookiePayload } from "../../src/types/index.js";

function makeCookie(
  overrides: Partial<ConsentCookiePayload> = {},
): ConsentCookiePayload {
  return {
    consentId: "test-id",
    consentState: { necessary: "granted" },
    configVersion: "1.0.0",
    timestamp: Date.now(),
    method: "banner",
    ...overrides,
  };
}

describe("isConsentStale", () => {
  it("should return false when config versions match", () => {
    const cookie = makeCookie({ configVersion: "1.0.0" });
    expect(isConsentStale(cookie, "1.0.0")).toBe(false);
  });

  it("should return true when config versions differ", () => {
    const cookie = makeCookie({ configVersion: "1.0.0" });
    expect(isConsentStale(cookie, "2.0.0")).toBe(true);
  });

  it("should use exact string match", () => {
    const cookie = makeCookie({ configVersion: "v1.0.0" });
    expect(isConsentStale(cookie, "1.0.0")).toBe(true);
  });
});

describe("isConsentExpired", () => {
  it("should return false for recent consent", () => {
    const cookie = makeCookie({ timestamp: Date.now() });
    expect(isConsentExpired(cookie, 365)).toBe(false);
  });

  it("should return true for expired consent", () => {
    const oldTimestamp = Date.now() - 400 * 24 * 60 * 60 * 1000;
    const cookie = makeCookie({ timestamp: oldTimestamp });
    expect(isConsentExpired(cookie, 365)).toBe(true);
  });

  it("should return false for consent just within the limit", () => {
    const justWithin = Date.now() - 364 * 24 * 60 * 60 * 1000;
    const cookie = makeCookie({ timestamp: justWithin });
    expect(isConsentExpired(cookie, 365)).toBe(false);
  });

  it("should return true for consent exactly at the limit", () => {
    const atLimit = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const cookie = makeCookie({ timestamp: atLimit });
    expect(isConsentExpired(cookie, 365)).toBe(true);
  });
});
