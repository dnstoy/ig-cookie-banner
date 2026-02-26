// ── Locale Strings Type ─────────────────────────────────────────────

export interface OptInBannerStrings {
  readonly description: string;
  readonly acceptAll: string;
  readonly rejectAll: string;
  readonly managePreferences: string;
}

export interface OptOutBannerStrings {
  readonly description: string;
  readonly doNotSell: string;
  readonly ok: string;
  readonly gpcHonored: string;
}

export interface NoticeOnlyBannerStrings {
  readonly description: string;
  readonly ok: string;
  readonly learnMore: string;
}

export interface OptInModalStrings {
  readonly title: string;
  readonly acceptAll: string;
  readonly rejectAll: string;
  readonly savePreferences: string;
  readonly necessaryExplanation: string;
}

export interface OptOutModalStrings {
  readonly title: string;
  readonly saleDescription: string;
  readonly saleToggle: string;
  readonly advertisingToggle: string;
  readonly save: string;
  readonly gpcNote: string;
  readonly dataCollectedTitle: string;
  readonly thirdPartiesTitle: string;
}

export interface CategoryStrings {
  readonly name: string;
  readonly description: string;
}

export interface CommonStrings {
  readonly privacyPolicy: string;
  readonly poweredBy: string;
  readonly alwaysOn: string;
  readonly cookiePreferences: string;
}

export interface LocaleStrings {
  readonly banner: {
    readonly optIn: OptInBannerStrings;
    readonly optOut: OptOutBannerStrings;
    readonly noticeOnly: NoticeOnlyBannerStrings;
  };
  readonly modal: {
    readonly optIn: OptInModalStrings;
    readonly optOut: OptOutModalStrings;
  };
  readonly categories: Readonly<Record<string, CategoryStrings>>;
  readonly common: CommonStrings;
}

// ── Validation ──────────────────────────────────────────────────────

type LocaleValidationSuccess = { ok: true; value: LocaleStrings };
type LocaleValidationFailure = { ok: false; errors: string[] };
export type LocaleValidationResult =
  | LocaleValidationSuccess
  | LocaleValidationFailure;

export function validateLocaleFile(input: unknown): LocaleValidationResult {
  const errors: string[] = [];

  if (input === null || input === undefined || typeof input !== "object") {
    return { ok: false, errors: ["Locale file must be a non-null object"] };
  }

  const obj = input as Record<string, unknown>;

  if (!obj["banner"] || typeof obj["banner"] !== "object") {
    errors.push("banner: required section missing");
  }
  if (!obj["modal"] || typeof obj["modal"] !== "object") {
    errors.push("modal: required section missing");
  }
  if (!obj["categories"] || typeof obj["categories"] !== "object") {
    errors.push("categories: required section missing");
  }
  if (!obj["common"] || typeof obj["common"] !== "object") {
    errors.push("common: required section missing");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: input as LocaleStrings };
}

// ── Interpolation ───────────────────────────────────────────────────

/** Replaces {{key}} placeholders with values from the provided map */
export function interpolate(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const value = values[key.trim()];
    return value !== undefined ? value : match;
  });
}
