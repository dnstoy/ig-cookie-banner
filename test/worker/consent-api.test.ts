import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

function validRecord() {
  return {
    consentId: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: Date.now(),
    consentState: { necessary: "granted", analytics: "denied", marketing: "denied" },
    configVersion: "1.0.0",
    method: "banner",
    consentModel: "opt-in",
    geoLocation: "DE",
    locale: "en",
  };
}

describe("Consent API - POST /consent", () => {
  it("should accept a valid consent record and return 201", async () => {
    const response = await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRecord()),
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("should write the record to D1", async () => {
    const record = validRecord();
    await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });

    const result = await env.DB.prepare(
      "SELECT * FROM consent_records WHERE consent_id = ?",
    )
      .bind(record.consentId)
      .first<Record<string, unknown>>();

    expect(result).not.toBeNull();
    expect(result!.consent_id).toBe(record.consentId);
    expect(result!.config_version).toBe("1.0.0");
    expect(result!.method).toBe("banner");
    expect(result!.consent_model).toBe("opt-in");
    expect(result!.geo_location).toBe("DE");
    expect(result!.locale).toBe("en");

    const state = JSON.parse(result!.consent_state as string) as Record<string, string>;
    expect(state.analytics).toBe("denied");
  });

  it("should reject invalid JSON with 400", async () => {
    const response = await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    expect(response.status).toBe(400);
  });

  it("should reject a record missing consentId with 400", async () => {
    const record = validRecord();
    const { consentId: _, ...withoutId } = record;
    const response = await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withoutId),
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors: string[] };
    expect(body.errors).toContain("consentId is required");
  });

  it("should reject a record missing consentState with 400", async () => {
    const record = validRecord();
    const { consentState: _, ...withoutState } = record;
    const response = await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withoutState),
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors: string[] };
    expect(body.errors).toContain("consentState is required");
  });

  it("should reject a record with invalid method with 400", async () => {
    const record = { ...validRecord(), method: "invalid" };
    const response = await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors: string[] };
    expect(body.errors).toContain("method must be one of: banner, gpc, api");
  });

  it("should reject a record with invalid consentModel with 400", async () => {
    const record = { ...validRecord(), consentModel: "maybe" };
    const response = await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors: string[] };
    expect(body.errors).toContain(
      "consentModel must be one of: opt-in, opt-out, notice-only",
    );
  });

  it("should accept GPC method records", async () => {
    const record = { ...validRecord(), method: "gpc" };
    const response = await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    expect(response.status).toBe(201);
  });

  it("should accept API method records", async () => {
    const record = { ...validRecord(), method: "api" };
    const response = await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    expect(response.status).toBe(201);
  });

  it("should store multiple records for the same consentId", async () => {
    const record = validRecord();

    // First consent
    await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });

    // Updated consent (same consentId)
    const updated = {
      ...record,
      timestamp: Date.now() + 1000,
      consentState: { necessary: "granted", analytics: "granted", marketing: "granted" },
    };
    await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    const results = await env.DB.prepare(
      "SELECT * FROM consent_records WHERE consent_id = ? ORDER BY timestamp ASC",
    )
      .bind(record.consentId)
      .all<Record<string, unknown>>();

    expect(results.results).toHaveLength(2);
  });
});

describe("Consent API - GET /consent/:id", () => {
  it("should return consent records for a given consentId", async () => {
    const record = validRecord();
    record.consentId = "get-test-uuid-1234";

    await SELF.fetch("https://example.com/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });

    const response = await SELF.fetch(
      `https://example.com/consent/${record.consentId}`,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      records: Array<Record<string, unknown>>;
    };
    expect(body.records).toHaveLength(1);
    expect(body.records[0].consent_id).toBe(record.consentId);
  });

  it("should return empty array for unknown consentId", async () => {
    const response = await SELF.fetch(
      "https://example.com/consent/nonexistent-id",
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      records: Array<Record<string, unknown>>;
    };
    expect(body.records).toHaveLength(0);
  });
});
