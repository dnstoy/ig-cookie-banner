import { describe, it, expect } from "vitest";
import { matchKnownCookie, KNOWN_COOKIES } from "../../src/scanner/known-cookies.js";

describe("Known cookie matching", () => {
  describe("Exact matches", () => {
    it("should match _ga exactly", () => {
      const result = matchKnownCookie("_ga");
      expect(result).toBeDefined();
      expect(result!.category).toBe("analytics");
      expect(result!.purpose).toContain("Google Analytics");
    });

    it("should match _fbp exactly", () => {
      const result = matchKnownCookie("_fbp");
      expect(result).toBeDefined();
      expect(result!.category).toBe("marketing");
    });

    it("should match ig_consent as necessary", () => {
      const result = matchKnownCookie("ig_consent");
      expect(result).toBeDefined();
      expect(result!.category).toBe("necessary");
    });

    it("should match __cf_bm as necessary", () => {
      const result = matchKnownCookie("__cf_bm");
      expect(result).toBeDefined();
      expect(result!.category).toBe("necessary");
    });
  });

  describe("Prefix matches", () => {
    it("should match _ga_ABC123 via _ga_* pattern", () => {
      const result = matchKnownCookie("_ga_ABC123");
      expect(result).toBeDefined();
      expect(result!.category).toBe("analytics");
      expect(result!.pattern).toBe("_ga_*");
    });

    it("should match _hjSessionUser_12345 via _hjSession* pattern", () => {
      const result = matchKnownCookie("_hjSessionUser_12345");
      expect(result).toBeDefined();
      expect(result!.category).toBe("analytics");
    });

    it("should match tt_pixel via tt_* pattern", () => {
      const result = matchKnownCookie("tt_pixel");
      expect(result).toBeDefined();
      expect(result!.category).toBe("marketing");
    });

    it("should match intercom-session-abc via intercom-* pattern", () => {
      const result = matchKnownCookie("intercom-session-abc");
      expect(result).toBeDefined();
      expect(result!.category).toBe("functional");
    });

    it("should match mp_abc123_mixpanel via mp_* pattern", () => {
      const result = matchKnownCookie("mp_abc123_mixpanel");
      expect(result).toBeDefined();
      expect(result!.category).toBe("analytics");
    });
  });

  describe("No match", () => {
    it("should return undefined for unknown cookies", () => {
      expect(matchKnownCookie("my_custom_cookie")).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      expect(matchKnownCookie("")).toBeUndefined();
    });

    it("should not false-match partial names", () => {
      // "_ga" should match, but "x_ga" should not
      expect(matchKnownCookie("x_ga")).toBeUndefined();
    });
  });

  describe("Database integrity", () => {
    it("should have all entries with valid categories", () => {
      const validCategories = new Set(["necessary", "functional", "analytics", "marketing"]);
      for (const entry of KNOWN_COOKIES) {
        expect(validCategories.has(entry.category)).toBe(true);
      }
    });

    it("should have non-empty purpose for all entries", () => {
      for (const entry of KNOWN_COOKIES) {
        expect(entry.purpose.length).toBeGreaterThan(0);
      }
    });

    it("should have no duplicate patterns", () => {
      const patterns = KNOWN_COOKIES.map((e) => e.pattern);
      const unique = new Set(patterns);
      expect(unique.size).toBe(patterns.length);
    });
  });
});
