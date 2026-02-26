import { describe, it, expect } from "vitest";
import { env, SELF } from "cloudflare:test";

describe("Worker smoke test", () => {
  it("should have D1 binding available", () => {
    expect(env.DB).toBeDefined();
  });

  it("should have consent_records table from migration", async () => {
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='consent_records'",
    ).first<{ name: string }>();
    expect(result?.name).toBe("consent_records");
  });

  it("should respond to fetch", async () => {
    const response = await SELF.fetch("https://example.com/");
    expect(response.status).toBe(200);
  });

  it("should serve banner JS", async () => {
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
