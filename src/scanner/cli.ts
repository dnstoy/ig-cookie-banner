#!/usr/bin/env node

import { scanSite, formatInventory } from "./scanner.js";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

interface CliArgs {
  url: string;
  maxPages: number;
  waitMs: number;
  output?: string;
  json: boolean;
  headless: boolean;
}

function printUsage(): void {
  console.log(`
ig-cookie-scanner - Scan a website for cookies and categorize them

Usage:
  npx ig-cookie-scanner <url> [options]

Options:
  --max-pages <n>   Maximum pages to crawl (default: 5)
  --wait <ms>       Wait time after page load in ms (default: 3000)
  --output <file>   Write results to file (JSON format)
  --json            Output JSON to stdout instead of table
  --no-headless     Run browser in visible mode
  -h, --help        Show this help

Examples:
  npx ig-cookie-scanner https://example.com
  npx ig-cookie-scanner https://example.com --max-pages 10 --output cookies.json
  npx ig-cookie-scanner https://example.com --json | jq '.cookies[] | .name'
`);
}

function parseArgs(argv: string[]): CliArgs | null {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    return null;
  }

  const url = args[0]!;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    console.error(`Error: URL must start with http:// or https://`);
    return null;
  }

  let maxPages = 5;
  let waitMs = 3000;
  let output: string | undefined;
  let json = false;
  let headless = true;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "--max-pages":
        maxPages = parseInt(args[++i] ?? "", 10);
        if (isNaN(maxPages) || maxPages < 1) {
          console.error("Error: --max-pages must be a positive integer");
          return null;
        }
        break;
      case "--wait":
        waitMs = parseInt(args[++i] ?? "", 10);
        if (isNaN(waitMs) || waitMs < 0) {
          console.error("Error: --wait must be a non-negative integer");
          return null;
        }
        break;
      case "--output":
        output = args[++i];
        if (!output) {
          console.error("Error: --output requires a file path");
          return null;
        }
        break;
      case "--json":
        json = true;
        break;
      case "--no-headless":
        headless = false;
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        return null;
    }
  }

  return { url, maxPages, waitMs, output, json, headless };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (!args) {
    printUsage();
    process.exit(args === null ? 1 : 0);
  }

  console.error(`Scanning ${args.url} (max ${args.maxPages} pages)...`);

  const inventory = await scanSite({
    url: args.url,
    maxPages: args.maxPages,
    waitMs: args.waitMs,
    headless: args.headless,
  });

  if (args.output) {
    const outPath = resolve(args.output);
    await writeFile(outPath, JSON.stringify(inventory, null, 2));
    console.error(`Results written to ${outPath}`);
  }

  if (args.json) {
    console.log(JSON.stringify(inventory, null, 2));
  } else {
    console.log(formatInventory(inventory));
  }
}

main().catch((err) => {
  console.error("Scanner failed:", err);
  process.exit(1);
});
