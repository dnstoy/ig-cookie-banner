import type { ScannedCookie, CookieInventory } from "./types.js";
import { matchKnownCookie } from "./known-cookies.js";

export interface ScanOptions {
  /** The URL to start scanning from */
  readonly url: string;
  /** Maximum number of same-origin pages to crawl (default: 5) */
  readonly maxPages?: number;
  /** Wait time in ms after page load before collecting cookies (default: 3000) */
  readonly waitMs?: number;
  /** Headless mode (default: true) */
  readonly headless?: boolean;
}

interface PuppeteerBrowser {
  newPage(): Promise<PuppeteerPage>;
  close(): Promise<void>;
}

interface PuppeteerPage {
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>;
  cookies(): Promise<PuppeteerCookie[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $$eval(selector: string, fn: (elements: any[]) => string[]): Promise<string[]>;
  evaluate(fn: () => Promise<void> | void): Promise<void>;
  close(): Promise<void>;
}

interface PuppeteerCookie {
  name: string;
  domain: string;
  path: string;
  expires: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
}

/**
 * Crawl a site with Puppeteer and collect all cookies set across pages.
 * Requires `puppeteer` to be installed as a peer dependency.
 */
export async function scanSite(options: ScanOptions): Promise<CookieInventory> {
  const { url, maxPages = 5, waitMs = 3000, headless = true } = options;

  // Dynamic import so puppeteer is only required when scanner is actually used
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let puppeteer: any;
  try {
    const moduleName = "puppeteer";
    puppeteer = await import(/* webpackIgnore: true */ moduleName);
  } catch {
    throw new Error(
      "puppeteer is required for cookie scanning. Install it with: npm install -D puppeteer",
    );
  }

  const browser = await puppeteer.launch({ headless });
  const allCookies = new Map<string, ScannedCookie>();
  const crawledPages: string[] = [];

  try {
    const baseUrl = new URL(url);
    const pagesToVisit = [url];
    const visited = new Set<string>();

    while (pagesToVisit.length > 0 && crawledPages.length < maxPages) {
      const pageUrl = pagesToVisit.shift()!;
      const normalized = normalizeUrl(pageUrl);

      if (visited.has(normalized)) continue;
      visited.add(normalized);

      const page = await browser.newPage();

      try {
        await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });

        // Wait for async scripts to set cookies
        await delay(page, waitMs);

        // Collect cookies
        const cookies = await page.cookies();
        for (const cookie of cookies) {
          const key = `${cookie.name}::${cookie.domain}`;
          if (!allCookies.has(key)) {
            const known = matchKnownCookie(cookie.name);
            allCookies.set(key, {
              name: cookie.name,
              domain: cookie.domain,
              path: cookie.path,
              expires: cookie.expires === -1
                ? "session"
                : new Date(cookie.expires * 1000).toISOString(),
              secure: cookie.secure,
              httpOnly: cookie.httpOnly,
              sameSite: cookie.sameSite ?? "None",
              category: known?.category ?? "unknown",
              purpose: known?.purpose ?? "",
            });
          }
        }

        crawledPages.push(pageUrl);

        // Discover same-origin links
        if (crawledPages.length < maxPages) {
          const links: string[] = await page.$$eval("a[href]", (elements: any[]) =>
            elements.map((el) => el.href as string),
          );

          for (const link of links) {
            try {
              const linkUrl = new URL(link);
              if (
                linkUrl.origin === baseUrl.origin &&
                !visited.has(normalizeUrl(link)) &&
                !pagesToVisit.includes(link)
              ) {
                pagesToVisit.push(link);
              }
            } catch {
              // Skip malformed URLs
            }
          }
        }
      } catch (err) {
        // Log but continue crawling
        console.error(`Failed to scan ${pageUrl}:`, err);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return {
    scannedAt: new Date().toISOString(),
    url,
    pagesCrawled: crawledPages,
    cookies: Array.from(allCookies.values()),
  };
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Strip hash and trailing slash
    return `${u.origin}${u.pathname.replace(/\/$/, "")}${u.search}`;
  } catch {
    return url;
  }
}

async function delay(_page: PuppeteerPage, ms: number): Promise<void> {
  await new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Format a CookieInventory as a summary table string.
 */
export function formatInventory(inventory: CookieInventory): string {
  const lines: string[] = [];

  lines.push(`Cookie Scan Report`);
  lines.push(`URL: ${inventory.url}`);
  lines.push(`Scanned: ${inventory.scannedAt}`);
  lines.push(`Pages crawled: ${inventory.pagesCrawled.length}`);
  lines.push(`Total cookies: ${inventory.cookies.length}`);
  lines.push("");

  // Group by category
  const byCategory = new Map<string, ScannedCookie[]>();
  for (const cookie of inventory.cookies) {
    const cat = cookie.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(cookie);
  }

  const order = ["necessary", "functional", "analytics", "marketing", "unknown"];
  const sorted = [...byCategory.entries()].sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  for (const [category, cookies] of sorted) {
    lines.push(`[${category.toUpperCase()}] (${cookies.length})`);
    for (const c of cookies) {
      const expiry = c.expires === "session" ? "session" : "persistent";
      const flags = [
        c.secure ? "Secure" : "",
        c.httpOnly ? "HttpOnly" : "",
        c.sameSite !== "None" ? `SameSite=${c.sameSite}` : "",
      ]
        .filter(Boolean)
        .join(", ");
      const purpose = c.purpose ? ` - ${c.purpose}` : "";
      lines.push(`  ${c.name} (${c.domain}) [${expiry}]${purpose}`);
      if (flags) lines.push(`    Flags: ${flags}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
