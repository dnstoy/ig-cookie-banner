export interface ScannedCookie {
  readonly name: string;
  readonly domain: string;
  readonly path: string;
  readonly expires: string;
  readonly secure: boolean;
  readonly httpOnly: boolean;
  readonly sameSite: string;
  readonly category: string;
  readonly purpose: string;
}

export interface CookieInventory {
  readonly scannedAt: string;
  readonly url: string;
  readonly pagesCrawled: readonly string[];
  readonly cookies: readonly ScannedCookie[];
}

export interface KnownCookie {
  readonly pattern: string;
  readonly category: string;
  readonly purpose: string;
}
