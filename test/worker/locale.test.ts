import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("Locale resolution", () => {
  describe("Dev override: ?_lang=xx", () => {
    it("should use German locale when _lang=de", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US&_lang=de");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("de");
      expect(payload.locale.banner.optIn.acceptAll).toBe("Alle akzeptieren");
    });

    it("should use French locale when _lang=fr", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US&_lang=fr");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("fr");
      expect(payload.locale.banner.optIn.acceptAll).toBe("Tout accepter");
    });

    it("should use Spanish locale when _lang=es", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US&_lang=es");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("es");
      expect(payload.locale.banner.optIn.acceptAll).toBe("Aceptar todo");
    });

    it("should use Italian locale when _lang=it", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US&_lang=it");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("it");
    });

    it("should use Dutch locale when _lang=nl", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US&_lang=nl");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("nl");
      expect(payload.locale.banner.optIn.acceptAll).toBe("Alles accepteren");
    });

    it("should use Portuguese locale when _lang=pt", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US&_lang=pt");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("pt");
      expect(payload.locale.banner.optIn.acceptAll).toBe("Aceitar tudo");
    });

    it("should be case-insensitive (_lang=DE resolves to de)", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US&_lang=DE");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("de");
    });

    it("should fall back to English for unknown _lang code", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US&_lang=zz");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("en");
      expect(payload.locale.banner.optIn.acceptAll).toBe("Accept all");
    });
  });

  describe("Geo-based resolution", () => {
    it("should resolve German locale for DE geo", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=DE");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("de");
    });

    it("should resolve French locale for FR geo", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=FR");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("fr");
    });

    it("should resolve German locale for AT geo (Austria)", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=AT");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("de");
    });

    it("should resolve French locale for BE geo (Belgium)", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=BE");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("fr");
    });

    it("should resolve Portuguese locale for BR geo (Brazil)", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=BR");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("pt");
    });

    it("should fall back to English for unmapped countries (US)", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("en");
    });

    it("should fall back to English for unmapped countries (AU)", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=AU");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("en");
    });
  });

  describe("Dev override takes priority over geo", () => {
    it("should use _lang override even when geo would resolve differently", async () => {
      // DE geo normally resolves to German, but _lang=fr should win
      const response = await SELF.fetch("https://example.com/?_geo=DE&_lang=fr");
      const html = await response.text();
      const payload = extractPayload(html);
      expect(payload.localeCode).toBe("fr");
    });
  });

  describe("Dev overlay", () => {
    it("should display locale code in the dev overlay", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=DE");
      const html = await response.text();
      expect(html).toContain("lang=de");
    });

    it("should display overridden locale code in dev overlay", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=US&_lang=fr");
      const html = await response.text();
      expect(html).toContain("lang=fr");
    });
  });

  describe("Bootstrap payload includes full locale strings", () => {
    it("should include all locale sections in the payload", async () => {
      const response = await SELF.fetch("https://example.com/?_geo=DE");
      const html = await response.text();
      const payload = extractPayload(html);

      // Verify all top-level locale sections are present
      expect(payload.locale).toHaveProperty("banner");
      expect(payload.locale).toHaveProperty("modal");
      expect(payload.locale).toHaveProperty("categories");
      expect(payload.locale).toHaveProperty("common");

      // Verify banner has all variants
      expect(payload.locale.banner).toHaveProperty("optIn");
      expect(payload.locale.banner).toHaveProperty("optOut");
      expect(payload.locale.banner).toHaveProperty("noticeOnly");
    });
  });
});

// ── Helper ──────────────────────────────────────────────────────────

interface BootstrapPayloadShape {
  localeCode: string;
  locale: {
    banner: {
      optIn: { acceptAll: string };
      optOut: Record<string, unknown>;
      noticeOnly: Record<string, unknown>;
    };
    modal: Record<string, unknown>;
    categories: Record<string, unknown>;
    common: Record<string, unknown>;
  };
}

function extractPayload(html: string): BootstrapPayloadShape {
  const match = html.match(
    /<script id="ig-consent-bootstrap" type="application\/json">(.*?)<\/script>/,
  );
  if (!match) throw new Error("Bootstrap JSON not found in HTML");
  return JSON.parse(match[1]) as BootstrapPayloadShape;
}
