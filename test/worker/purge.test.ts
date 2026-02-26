import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { purgeExpiredRecords } from "../../src/worker/consent-api.js";

const DAY_MS = 24 * 60 * 60 * 1000;

async function insertRecord(
  consentId: string,
  timestamp: number,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO consent_records (consent_id, timestamp, consent_state, config_version, method, consent_model, geo_location, locale)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      consentId,
      timestamp,
      JSON.stringify({ necessary: "granted" }),
      "1.0.0",
      "banner",
      "opt-in",
      "DE",
      "en",
    )
    .run();
}

describe("Consent record purge", () => {
  it("should delete records older than retention period", async () => {
    const now = Date.now();
    const retentionDays = parseInt(env.RECORD_RETENTION_DAYS || "1095", 10);

    // Insert an old record (beyond retention)
    await insertRecord("old-record", now - (retentionDays + 1) * DAY_MS);

    // Insert a fresh record (within retention)
    await insertRecord("fresh-record", now);

    const deleted = await purgeExpiredRecords(env);
    expect(deleted).toBe(1);

    // Verify old record is gone
    const oldResult = await env.DB.prepare(
      "SELECT * FROM consent_records WHERE consent_id = ?",
    )
      .bind("old-record")
      .first();
    expect(oldResult).toBeNull();

    // Verify fresh record is preserved
    const freshResult = await env.DB.prepare(
      "SELECT * FROM consent_records WHERE consent_id = ?",
    )
      .bind("fresh-record")
      .first();
    expect(freshResult).not.toBeNull();
  });

  it("should preserve records within retention window", async () => {
    const now = Date.now();

    await insertRecord("recent-record", now - 30 * DAY_MS);

    const deleted = await purgeExpiredRecords(env);
    expect(deleted).toBe(0);

    const result = await env.DB.prepare(
      "SELECT * FROM consent_records WHERE consent_id = ?",
    )
      .bind("recent-record")
      .first();
    expect(result).not.toBeNull();
  });

  it("should return 0 when no records to purge", async () => {
    const deleted = await purgeExpiredRecords(env);
    expect(deleted).toBe(0);
  });
});
