import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("Full request flow", () => {
  describe("HTML structure", () => {
    it("should return HTML with Content-Type text/html", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=DE");
      expect(response.headers.get("Content-Type")).toBe(
        "text/html; charset=utf-8",
      );
    });

    it("should inject bootstrap JSON in the head", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=DE");
      const html = await response.text();
      expect(html).toContain(
        '<script id="ig-consent-bootstrap" type="application/json">',
      );
    });

    it("should inject banner script tag in the head", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=DE");
      const html = await response.text();
      expect(html).toContain('<script src="/ig-consent-banner.js"></script>');
    });

    it("should contain the skeleton page content", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US");
      const html = await response.text();
      expect(html).toContain("Cookie Banner Test Site");
      expect(html).toContain('data-consent-category="analytics"');
    });
  });

  describe("Dev overlay", () => {
    it("should show dev overlay with geo, consent model, and locale info", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=DE");
      const html = await response.text();
      expect(html).toContain('id="dev-overlay"');
      expect(html).toContain("geo=DE");
      expect(html).toContain("model=opt-in");
      expect(html).toContain("gpc=off");
      expect(html).toContain("lang=de");
    });

    it("should show GPC on in dev overlay when GPC is detected", async () => {
      const response = await SELF.fetch(
        "https://example.com/?_geo=US-CA&_gpc=1",
      );
      const html = await response.text();
      expect(html).toContain("gpc=on");
    });

    it("should show composite geo in dev overlay for sub-national regions", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=CA-QC");
      const html = await response.text();
      expect(html).toContain("geo=CA-QC");
      expect(html).toContain("model=opt-in");
    });
  });

  describe("Banner JS endpoint", () => {
    it("should serve banner JS at /ig-consent-banner.js", async () => {
      const response = await SELF.fetch(
        "https://example.com/ig-consent-banner.js",
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toContain(
        "application/javascript",
      );
      const body = await response.text();
      expect(body).toContain("ig-consent");
    });
  });

  describe("Consent API routing", () => {
    it("should route POST /consent to the consent API", async () => {
      const response = await SELF.fetch("https://example.com/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      // 400 because empty body is invalid, but proves it's routed to the API
      expect(response.status).toBe(400);
    });

    it("should route GET /consent/:id to the consent API", async () => {
      const response = await SELF.fetch("https://example.com/consent/123");
      expect(response.status).toBe(200);
    });
  });

  describe("Bootstrap payload structure", () => {
    it("should have all required fields in bootstrap JSON for opt-in", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=DE");
      const html = await response.text();

      const match = html.match(
        /<script id="ig-consent-bootstrap" type="application\/json">(.*?)<\/script>/,
      );
      expect(match).not.toBeNull();

      const payload = JSON.parse(match![1]) as Record<string, unknown>;
      expect(payload).toHaveProperty("consentModel", "opt-in");
      expect(payload).toHaveProperty("bannerState", "first-visit");
      expect(payload).toHaveProperty("gpcState", "not-detected");
      expect(payload).toHaveProperty("geo");
      expect(payload).toHaveProperty("config");
      expect(payload).toHaveProperty("locale");
      expect(payload).toHaveProperty("localeCode");

      const geo = payload.geo as Record<string, unknown>;
      expect(geo).toHaveProperty("country", "DE");
    });

    it("should have all required fields in bootstrap JSON for opt-out", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US");
      const html = await response.text();

      const match = html.match(
        /<script id="ig-consent-bootstrap" type="application\/json">(.*?)<\/script>/,
      );
      const payload = JSON.parse(match![1]) as Record<string, unknown>;
      expect(payload).toHaveProperty("consentModel", "opt-out");
      expect(payload).toHaveProperty("bannerState", "first-visit");
    });

    it("should include config with categories in bootstrap", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US");
      const html = await response.text();

      const match = html.match(
        /<script id="ig-consent-bootstrap" type="application\/json">(.*?)<\/script>/,
      );
      const payload = JSON.parse(match![1]) as Record<string, unknown>;
      const config = payload.config as Record<string, unknown>;
      const categories = config.categories as Array<Record<string, unknown>>;
      expect(categories).toHaveLength(4);
      expect(categories[0]).toHaveProperty("id", "necessary");
      expect(categories[0]).toHaveProperty("required", true);
    });
  });
});
