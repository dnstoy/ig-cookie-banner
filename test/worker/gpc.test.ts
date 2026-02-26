import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("GPC detection", () => {
  it("should detect GPC via _gpc=1 query param in dev mode (US-CA region)", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=US-CA&_gpc=1");
    const html = await response.text();
    expect(html).toContain('"gpcState":"detected"');
    expect(html).toContain("gpc=on");
  });

  it("should not detect GPC when _gpc=1 but region is not in honorInRegions", async () => {
    // DE is opt-in but not a GPC-honored region
    const response = await SELF.fetch("https://example.com/?_geo=DE&_gpc=1");
    const html = await response.text();
    expect(html).toContain('"gpcState":"not-detected"');
    expect(html).toContain("gpc=off");
  });

  it("should detect GPC via Sec-GPC header in GPC-honored region", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=US-CA", {
      headers: { "Sec-GPC": "1" },
    });
    const html = await response.text();
    expect(html).toContain('"gpcState":"detected"');
  });

  it("should not detect GPC via Sec-GPC header in non-GPC region", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=AU", {
      headers: { "Sec-GPC": "1" },
    });
    const html = await response.text();
    expect(html).toContain('"gpcState":"not-detected"');
  });

  it("should default to not-detected when no GPC signal is present", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=US-CA");
    const html = await response.text();
    expect(html).toContain('"gpcState":"not-detected"');
  });

  it("should detect GPC for US-CO (another honored region)", async () => {
    const response = await SELF.fetch("https://example.com/?_geo=US-CO&_gpc=1");
    const html = await response.text();
    expect(html).toContain('"gpcState":"detected"');
  });
});
