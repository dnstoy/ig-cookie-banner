import { describe, it, expect } from "vitest";
import { formatInventory } from "../../src/scanner/scanner.js";
import type { CookieInventory } from "../../src/scanner/types.js";

function makeInventory(
  overrides?: Partial<CookieInventory>,
): CookieInventory {
  return {
    scannedAt: "2026-01-01T00:00:00.000Z",
    url: "https://example.com",
    pagesCrawled: ["https://example.com"],
    cookies: [],
    ...overrides,
  };
}

describe("formatInventory", () => {
  it("should include header information", () => {
    const output = formatInventory(makeInventory());
    expect(output).toContain("Cookie Scan Report");
    expect(output).toContain("https://example.com");
    expect(output).toContain("Pages crawled: 1");
    expect(output).toContain("Total cookies: 0");
  });

  it("should group cookies by category", () => {
    const output = formatInventory(
      makeInventory({
        cookies: [
          {
            name: "_ga",
            domain: ".example.com",
            path: "/",
            expires: "2027-01-01T00:00:00.000Z",
            secure: true,
            httpOnly: false,
            sameSite: "Lax",
            category: "analytics",
            purpose: "Google Analytics client ID",
          },
          {
            name: "__cf_bm",
            domain: ".example.com",
            path: "/",
            expires: "session",
            secure: true,
            httpOnly: true,
            sameSite: "None",
            category: "necessary",
            purpose: "Cloudflare bot management",
          },
        ],
      }),
    );

    expect(output).toContain("[NECESSARY]");
    expect(output).toContain("[ANALYTICS]");
    expect(output).toContain("Total cookies: 2");
  });

  it("should show necessary before analytics", () => {
    const output = formatInventory(
      makeInventory({
        cookies: [
          {
            name: "_ga",
            domain: ".example.com",
            path: "/",
            expires: "2027-01-01T00:00:00.000Z",
            secure: false,
            httpOnly: false,
            sameSite: "None",
            category: "analytics",
            purpose: "Google Analytics",
          },
          {
            name: "__cf_bm",
            domain: ".example.com",
            path: "/",
            expires: "session",
            secure: true,
            httpOnly: true,
            sameSite: "None",
            category: "necessary",
            purpose: "Cloudflare bot management",
          },
        ],
      }),
    );

    const necessaryIndex = output.indexOf("[NECESSARY]");
    const analyticsIndex = output.indexOf("[ANALYTICS]");
    expect(necessaryIndex).toBeLessThan(analyticsIndex);
  });

  it("should display cookie flags", () => {
    const output = formatInventory(
      makeInventory({
        cookies: [
          {
            name: "secure_cookie",
            domain: ".example.com",
            path: "/",
            expires: "session",
            secure: true,
            httpOnly: true,
            sameSite: "Strict",
            category: "necessary",
            purpose: "Test",
          },
        ],
      }),
    );

    expect(output).toContain("Secure");
    expect(output).toContain("HttpOnly");
    expect(output).toContain("SameSite=Strict");
  });

  it("should show session vs persistent", () => {
    const output = formatInventory(
      makeInventory({
        cookies: [
          {
            name: "session_cookie",
            domain: ".example.com",
            path: "/",
            expires: "session",
            secure: false,
            httpOnly: false,
            sameSite: "None",
            category: "necessary",
            purpose: "",
          },
          {
            name: "persistent_cookie",
            domain: ".example.com",
            path: "/",
            expires: "2027-01-01T00:00:00.000Z",
            secure: false,
            httpOnly: false,
            sameSite: "None",
            category: "analytics",
            purpose: "",
          },
        ],
      }),
    );

    expect(output).toContain("[session]");
    expect(output).toContain("[persistent]");
  });

  it("should handle unknown category cookies", () => {
    const output = formatInventory(
      makeInventory({
        cookies: [
          {
            name: "mystery",
            domain: ".example.com",
            path: "/",
            expires: "session",
            secure: false,
            httpOnly: false,
            sameSite: "None",
            category: "unknown",
            purpose: "",
          },
        ],
      }),
    );

    expect(output).toContain("[UNKNOWN]");
  });
});
