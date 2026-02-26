import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("Cookie reading", () => {
  it("should return first-visit when no cookie is present", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=DE");
    const html = await response.text();
    expect(html).toContain('"bannerState":"first-visit"');
  });

  it("should return none when valid cookie matches current config version", async () => {
    const payload = {
      consentId: "test-uuid-1234",
      consentState: { necessary: "granted", analytics: "denied" },
      configVersion: "1.0.0",
      timestamp: Date.now(),
      method: "banner",
    };
    const cookieValue = encodeURIComponent(JSON.stringify(payload));

    const response = await SELF.fetch("https://example.com/?_geo=DE", {
      headers: { Cookie: `ig_consent=${cookieValue}` },
    });
    const html = await response.text();
    expect(html).toContain('"bannerState":"none"');
  });

  it("should return re-prompt when cookie config version doesn't match", async () => {
    const payload = {
      consentId: "test-uuid-1234",
      consentState: { necessary: "granted" },
      configVersion: "0.9.0",
      timestamp: Date.now(),
      method: "banner",
    };
    const cookieValue = encodeURIComponent(JSON.stringify(payload));

    const response = await SELF.fetch("https://example.com/?_geo=DE", {
      headers: { Cookie: `ig_consent=${cookieValue}` },
    });
    const html = await response.text();
    expect(html).toContain('"bannerState":"re-prompt"');
  });

  it("should return re-prompt when cookie is expired", async () => {
    const payload = {
      consentId: "test-uuid-1234",
      consentState: { necessary: "granted" },
      configVersion: "1.0.0",
      // 400 days ago — exceeds 365-day lifetime
      timestamp: Date.now() - 400 * 24 * 60 * 60 * 1000,
      method: "banner",
    };
    const cookieValue = encodeURIComponent(JSON.stringify(payload));

    const response = await SELF.fetch("https://example.com/?_geo=US", {
      headers: { Cookie: `ig_consent=${cookieValue}` },
    });
    const html = await response.text();
    expect(html).toContain('"bannerState":"re-prompt"');
  });

  it("should return first-visit when cookie is malformed JSON", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=US", {
      headers: { Cookie: "ig_consent=not-valid-json" },
    });
    const html = await response.text();
    expect(html).toContain('"bannerState":"first-visit"');
  });

  it("should return first-visit when cookie is missing required fields", async () => {
    const partial = { consentId: "test", consentState: {} };
    const cookieValue = encodeURIComponent(JSON.stringify(partial));

    const response = await SELF.fetch("https://example.com/?_geo=US", {
      headers: { Cookie: `ig_consent=${cookieValue}` },
    });
    const html = await response.text();
    expect(html).toContain('"bannerState":"first-visit"');
  });

  it("should ignore unrelated cookies and still detect ig_consent", async () => {
    const payload = {
      consentId: "test-uuid",
      consentState: { necessary: "granted" },
      configVersion: "1.0.0",
      timestamp: Date.now(),
      method: "banner",
    };
    const cookieValue = encodeURIComponent(JSON.stringify(payload));

    const response = await SELF.fetch("https://example.com/?_geo=US", {
      headers: { Cookie: `other=abc; ig_consent=${cookieValue}; session=xyz` },
    });
    const html = await response.text();
    expect(html).toContain('"bannerState":"none"');
  });
});
