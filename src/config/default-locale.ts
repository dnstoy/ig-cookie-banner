import enStrings from "../../locales/en.json";
import type { LocaleStrings } from "./locale.js";

/**
 * Default (English) locale strings, imported from locales/en.json.
 * This is the single source of truth for Phase 1.
 * In Phase 2, locale will come from the bootstrap payload instead.
 */
export const defaultLocale: LocaleStrings = enStrings as LocaleStrings;
