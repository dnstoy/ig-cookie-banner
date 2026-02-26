import type {
  BannerConfig,
  BootstrapPayload,
  ConsentCookiePayload,
  ConsentModel,
  ConsentState,
  GpcState,
} from "../types/index.js";

export type ConsentChangeCallback = (state: ConsentState) => void;

export interface CookieAdapter {
  read(): ConsentCookiePayload | null;
  write(payload: ConsentCookiePayload, config: BannerConfig): void;
}

export const documentCookieAdapter: CookieAdapter = {
  read(): ConsentCookiePayload | null {
    if (typeof document === "undefined") return null;

    const match = document.cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("ig_consent="));

    if (!match) return null;

    try {
      const value = match.slice("ig_consent=".length);
      if (!value) return null;
      const decoded = decodeURIComponent(value);
      return JSON.parse(decoded) as ConsentCookiePayload;
    } catch {
      return null;
    }
  },

  write(payload: ConsentCookiePayload, config: BannerConfig): void {
    if (typeof document === "undefined") return;

    const value = encodeURIComponent(JSON.stringify(payload));
    const maxAge = config.consentLifetimeDays * 24 * 60 * 60;
    const parts = [
      `ig_consent=${value}`,
      `Path=/`,
      `SameSite=Lax`,
      `Max-Age=${maxAge}`,
    ];

    if (config.cookieDomain) {
      parts.push(`Domain=${config.cookieDomain}`);
    }

    if (
      typeof location !== "undefined" &&
      location.protocol === "https:"
    ) {
      parts.push("Secure");
    }

    document.cookie = parts.join("; ");
  },
};

export class ConsentManager {
  private state: ConsentState;
  private readonly config: BannerConfig;
  private readonly consentModel: ConsentModel;
  private readonly gpcState: GpcState;
  private readonly geo: { country: string; region?: string };
  private consentId: string;
  private listeners: ConsentChangeCallback[] = [];
  private readonly cookieAdapter: CookieAdapter;

  constructor(bootstrap: BootstrapPayload, cookieAdapter?: CookieAdapter) {
    this.config = bootstrap.config;
    this.consentModel = bootstrap.consentModel;
    this.gpcState = bootstrap.gpcState;
    this.geo = bootstrap.geo;
    this.consentId = "";
    this.cookieAdapter = cookieAdapter ?? documentCookieAdapter;
    this.state = this.resolveInitialState(bootstrap);
  }

  getState(): ConsentState {
    return { ...this.state };
  }

  getConsentModel(): ConsentModel {
    return this.consentModel;
  }

  getConsentId(): string {
    return this.consentId;
  }

  isConsentValid(): boolean {
    const cookie = this.cookieAdapter.read();
    if (!cookie) return false;
    return cookie.configVersion === this.config.version;
  }

  updateConsent(categories: ConsentState): void {
    this.state = { ...categories };

    for (const cat of this.config.categories) {
      if (cat.required) {
        this.state[cat.id] = "granted";
      }
    }

    if (!this.consentId) {
      this.consentId = generateUUID();
    }

    this.writeCookie("banner");
    this.sendConsentRecord("banner");
    this.notifyListeners();
  }

  withdrawConsent(): void {
    for (const cat of this.config.categories) {
      this.state[cat.id] = cat.required ? "granted" : "denied";
    }

    this.writeCookie("banner");
    this.sendConsentRecord("banner");
    this.notifyListeners();
  }

  onConsentChange(callback: ConsentChangeCallback): void {
    this.listeners.push(callback);
  }

  applyGpc(): void {
    for (const cat of this.config.categories) {
      if (!cat.required) {
        this.state[cat.id] = "denied";
      }
    }

    if (!this.consentId) {
      this.consentId = generateUUID();
    }

    this.writeCookie("gpc");
    this.sendConsentRecord("gpc");
    this.notifyListeners();
  }

  private resolveInitialState(bootstrap: BootstrapPayload): ConsentState {
    const state: ConsentState = {};

    for (const cat of this.config.categories) {
      if (cat.required) {
        state[cat.id] = "granted";
      } else if (
        this.consentModel === "opt-out" ||
        this.consentModel === "notice-only"
      ) {
        state[cat.id] = "granted";
      } else {
        state[cat.id] = "denied";
      }
    }

    if (bootstrap.bannerState === "none") {
      const cookie = this.cookieAdapter.read();
      if (cookie) {
        this.consentId = cookie.consentId;
        for (const [key, value] of Object.entries(cookie.consentState)) {
          state[key] = value;
        }
      }
    }

    return state;
  }

  private writeCookie(method: "banner" | "gpc"): void {
    const payload: ConsentCookiePayload = {
      consentId: this.consentId,
      consentState: { ...this.state },
      configVersion: this.config.version,
      timestamp: Date.now(),
      method,
    };

    this.cookieAdapter.write(payload, this.config);
  }

  private sendConsentRecord(method: "banner" | "gpc"): void {
    const geoLocation = this.geo.region
      ? `${this.geo.country}-${this.geo.region}`
      : this.geo.country;

    const record = {
      consentId: this.consentId,
      timestamp: Date.now(),
      consentState: { ...this.state },
      configVersion: this.config.version,
      method,
      consentModel: this.consentModel,
      geoLocation,
      locale: this.config.locales.defaultLocale,
    };

    sendWithRetry("/consent", record).catch((err: unknown) => {
      console.error("[ig-consent] Failed to send consent record:", err);
    });
  }

  private notifyListeners(): void {
    const snapshot = { ...this.state };
    for (const cb of this.listeners) {
      cb(snapshot);
    }
  }
}

async function sendWithRetry(
  url: string,
  body: unknown,
  maxAttempts = 3,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok || response.status === 201) return;
      if (response.status >= 400 && response.status < 500) return;
    } catch {
      // Network error — retry
    }

    if (attempt < maxAttempts - 1) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
