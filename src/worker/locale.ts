import type { LocaleStrings } from "../config/locale.js";
import type { GeoInfo } from "./geo.js";

import en from "../../locales/en.json";
import fr from "../../locales/fr.json";
import de from "../../locales/de.json";
import es from "../../locales/es.json";
import it from "../../locales/it.json";
import nl from "../../locales/nl.json";
import pt from "../../locales/pt.json";

/** All available locale bundles, keyed by locale code. */
const localeRegistry: Readonly<Record<string, LocaleStrings>> = {
  en: en as LocaleStrings,
  fr: fr as LocaleStrings,
  de: de as LocaleStrings,
  es: es as LocaleStrings,
  it: it as LocaleStrings,
  nl: nl as LocaleStrings,
  pt: pt as LocaleStrings,
};

/** Maps a country code to the best-match locale code. */
const countryToLocale: Readonly<Record<string, string>> = {
  DE: "de",
  AT: "de",
  CH: "de",
  FR: "fr",
  BE: "fr",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  IT: "it",
  NL: "nl",
  PT: "pt",
  BR: "pt",
};

export interface LocaleResult {
  readonly locale: LocaleStrings;
  readonly localeCode: string;
}

/**
 * Resolves the locale for the current request.
 *
 * Priority:
 *   1. Dev-only `?_lang=xx` query param override
 *   2. Geo-based country → locale mapping
 *   3. Fallback to English
 */
export function resolveLocale(
  url: URL,
  geo: GeoInfo,
  isDev: boolean,
): LocaleResult {
  // Dev override: ?_lang=xx
  if (isDev) {
    const langOverride = url.searchParams.get("_lang");
    if (langOverride) {
      const code = langOverride.toLowerCase();
      const locale = localeRegistry[code];
      if (locale) {
        return { locale, localeCode: code };
      }
      // Unknown code → fall through to geo/default
    }
  }

  // Geo-based resolution
  const code = countryToLocale[geo.country];
  if (code) {
    const locale = localeRegistry[code];
    if (locale) {
      return { locale, localeCode: code };
    }
  }

  // Fallback to English
  return { locale: localeRegistry["en"]!, localeCode: "en" };
}
