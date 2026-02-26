import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("Geo resolution", () => {
  it("should use _geo override in dev mode for opt-in region", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=DE");
    const html = await response.text();
    expect(html).toContain('"consentModel":"opt-in"');
    expect(html).toContain("geo=DE");
  });

  it("should use _geo override for opt-out region", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=US");
    const html = await response.text();
    expect(html).toContain('"consentModel":"opt-out"');
  });

  it("should use _geo override for notice-only region", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=AU");
    const html = await response.text();
    expect(html).toContain('"consentModel":"notice-only"');
  });

  it("should resolve sub-national regions (CA-QC -> opt-in)", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=CA-QC");
    const html = await response.text();
    expect(html).toContain('"consentModel":"opt-in"');
    expect(html).toContain("geo=CA-QC");
  });

  it("should fall back to country level when region not mapped (CA-ON -> CA -> notice-only)", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=CA-ON");
    const html = await response.text();
    expect(html).toContain('"consentModel":"notice-only"');
  });

  it("should fall back to fallbackConsentModel for unknown country", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=ZZ");
    const html = await response.text();
    // fallbackConsentModel is opt-in
    expect(html).toContain('"consentModel":"opt-in"');
  });

  it("should fall back to fallbackConsentModel when no _geo provided (no cf headers)", async () => {
    const response = await SELF.fetch("https://example.com/");
    const html = await response.text();
    // Without cf headers, country defaults to XX -> falls back to opt-in
    expect(html).toContain('"consentModel":"opt-in"');
  });
});
