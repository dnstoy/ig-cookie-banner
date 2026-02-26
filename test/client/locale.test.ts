import { describe, it, expect } from "vitest";
import {
  validateLocaleFile,
  interpolate,
  type LocaleStrings,
} from "../../src/config/locale.js";
import { defaultLocale } from "../../src/config/default-locale.js";
import frStrings from "../../locales/fr.json";
import deStrings from "../../locales/de.json";
import esStrings from "../../locales/es.json";
import itStrings from "../../locales/it.json";
import nlStrings from "../../locales/nl.json";
import ptStrings from "../../locales/pt.json";

function validLocale(
  overrides: Partial<LocaleStrings> = {},
): Record<string, unknown> {
  return {
    banner: {
      optIn: {
        description:
          "{{organization.name}} uses cookies to improve your experience.",
        acceptAll: "Accept all",
        rejectAll: "Reject all",
        managePreferences: "Manage preferences",
      },
      optOut: {
        description:
          "{{organization.name}} collects data to improve your experience.",
        doNotSell: "Do Not Sell or Share My Personal Information",
        ok: "Got it",
        gpcHonored: "Your opt-out preference has been honored.",
      },
      noticeOnly: {
        description: "This site uses cookies.",
        ok: "Got it",
        learnMore: "Learn more",
      },
    },
    modal: {
      optIn: {
        title: "Cookie preferences",
        acceptAll: "Accept all",
        rejectAll: "Reject all",
        savePreferences: "Save preferences",
        necessaryExplanation:
          "These cookies are essential and cannot be turned off.",
      },
      optOut: {
        title: "Privacy preferences",
        saleDescription:
          "We may sell or share your personal information with third parties.",
        saleToggle: "Opt out of sale/sharing",
        advertisingToggle: "Opt out of targeted advertising",
        save: "Save preferences",
        gpcNote:
          "Global Privacy Control detected. Your opt-out has been applied.",
        dataCollectedTitle: "Information we collect",
        thirdPartiesTitle: "Third parties we share with",
      },
    },
    categories: {
      necessary: {
        name: "Strictly necessary",
        description: "Essential for the site to function.",
      },
      analytics: {
        name: "Analytics",
        description: "Help us understand how visitors use our site.",
      },
      marketing: {
        name: "Marketing",
        description: "Used to deliver relevant ads.",
      },
    },
    common: {
      privacyPolicy: "Privacy policy",
      poweredBy: "Cookie consent by {{organization.name}}",
      alwaysOn: "Always on",
      cookiePreferences: "Cookie preferences",
    },
    ...overrides,
  };
}

describe("validateLocaleFile", () => {
  it("should accept a valid locale file", () => {
    const result = validateLocaleFile(validLocale());
    expect(result.ok).toBe(true);
  });

  it("should reject null input", () => {
    const result = validateLocaleFile(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Locale file must be a non-null object");
    }
  });

  it("should reject missing banner section", () => {
    const locale = validLocale();
    delete (locale as Record<string, unknown>)["banner"];
    const result = validateLocaleFile(locale);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("banner"))).toBe(true);
    }
  });

  it("should reject missing modal section", () => {
    const locale = validLocale();
    delete (locale as Record<string, unknown>)["modal"];
    const result = validateLocaleFile(locale);
    expect(result.ok).toBe(false);
  });

  it("should reject missing categories section", () => {
    const locale = validLocale();
    delete (locale as Record<string, unknown>)["categories"];
    const result = validateLocaleFile(locale);
    expect(result.ok).toBe(false);
  });

  it("should reject missing common section", () => {
    const locale = validLocale();
    delete (locale as Record<string, unknown>)["common"];
    const result = validateLocaleFile(locale);
    expect(result.ok).toBe(false);
  });
});

describe("interpolate", () => {
  it("should replace {{organization.name}} with the value", () => {
    const result = interpolate("Hello {{organization.name}}!", {
      "organization.name": "Acme Corp",
    });
    expect(result).toBe("Hello Acme Corp!");
  });

  it("should replace multiple occurrences", () => {
    const result = interpolate(
      "{{organization.name}} - by {{organization.name}}",
      { "organization.name": "Acme" },
    );
    expect(result).toBe("Acme - by Acme");
  });

  it("should leave unknown placeholders as-is", () => {
    const result = interpolate("Hello {{unknown}}", {});
    expect(result).toBe("Hello {{unknown}}");
  });

  it("should handle strings with no placeholders", () => {
    const result = interpolate("No placeholders here", {
      "organization.name": "Test",
    });
    expect(result).toBe("No placeholders here");
  });
});

describe("locales/en.json (default locale)", () => {
  it("should pass locale validation", () => {
    const result = validateLocaleFile(defaultLocale);
    expect(result.ok).toBe(true);
  });

  it("should have all four standard categories", () => {
    expect(defaultLocale.categories).toHaveProperty("necessary");
    expect(defaultLocale.categories).toHaveProperty("analytics");
    expect(defaultLocale.categories).toHaveProperty("marketing");
    expect(defaultLocale.categories).toHaveProperty("functional");
  });

  it("should have all required banner sections", () => {
    expect(defaultLocale.banner.optIn.description).toBeTruthy();
    expect(defaultLocale.banner.optOut.description).toBeTruthy();
    expect(defaultLocale.banner.noticeOnly.description).toBeTruthy();
  });

  it("should have all required modal sections", () => {
    expect(defaultLocale.modal.optIn.title).toBeTruthy();
    expect(defaultLocale.modal.optOut.title).toBeTruthy();
  });
});

// ── Translation conformance ─────────────────────────────────────────

/** Recursively collect all leaf keys as dot-separated paths */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

const enKeys = collectKeys(defaultLocale as unknown as Record<string, unknown>);

const translations: Record<string, unknown> = {
  fr: frStrings,
  de: deStrings,
  es: esStrings,
  it: itStrings,
  nl: nlStrings,
  pt: ptStrings,
};

describe.each(Object.keys(translations))("locales/%s.json", (lang) => {
  const locale = translations[lang] as Record<string, unknown>;

  it("should pass locale validation", () => {
    const result = validateLocaleFile(locale);
    expect(result.ok).toBe(true);
  });

  it("should have the same keys as en.json", () => {
    const langKeys = collectKeys(locale);
    expect(langKeys).toEqual(enKeys);
  });

  it("should have no empty string values", () => {
    const langKeys = collectKeys(locale);
    for (const key of langKeys) {
      const value = key.split(".").reduce<unknown>((o, k) => {
        return (o as Record<string, unknown>)?.[k];
      }, locale);
      expect(value, `${lang}: ${key} should not be empty`).toBeTruthy();
    }
  });
});
