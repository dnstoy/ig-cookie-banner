import type { Env } from "./index.js";

interface ConsentRecordInput {
  consentId: string;
  timestamp: number;
  consentState: Record<string, string>;
  configVersion: string;
  method: string;
  consentModel: string;
  geoLocation: string;
  locale: string;
}

const VALID_METHODS = ["banner", "gpc", "api"] as const;
const VALID_MODELS = ["opt-in", "opt-out", "notice-only"] as const;

export async function handleConsentPost(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { ok: false, errors: ["Invalid JSON"] });
  }

  const errors = validateConsentRecord(body);
  if (errors.length > 0) {
    return jsonResponse(400, { ok: false, errors });
  }

  const record = body as ConsentRecordInput;

  await env.DB.prepare(
    `INSERT INTO consent_records (consent_id, timestamp, consent_state, config_version, method, consent_model, geo_location, locale)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      record.consentId,
      record.timestamp,
      JSON.stringify(record.consentState),
      record.configVersion,
      record.method,
      record.consentModel,
      record.geoLocation,
      record.locale,
    )
    .run();

  return jsonResponse(201, { ok: true });
}

export async function handleConsentGet(
  consentId: string,
  env: Env,
): Promise<Response> {
  const results = await env.DB.prepare(
    "SELECT * FROM consent_records WHERE consent_id = ? ORDER BY timestamp DESC",
  )
    .bind(consentId)
    .all<Record<string, unknown>>();

  return jsonResponse(200, { records: results.results });
}

export async function purgeExpiredRecords(env: Env): Promise<number> {
  const retentionDays = parseInt(env.RECORD_RETENTION_DAYS || "1095", 10);
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let totalDeleted = 0;

  // Batched delete — D1 has per-query row limits
  while (true) {
    const result = await env.DB.prepare(
      "DELETE FROM consent_records WHERE timestamp < ? LIMIT 1000",
    )
      .bind(cutoff)
      .run();

    const deleted =
      result.meta.changes !== undefined && result.meta.changes !== null
        ? result.meta.changes
        : 0;
    totalDeleted += deleted;

    if (deleted < 1000) {
      break;
    }
  }

  return totalDeleted;
}

function validateConsentRecord(input: unknown): string[] {
  const errors: string[] = [];

  if (input === null || typeof input !== "object") {
    return ["Request body must be a JSON object"];
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.consentId !== "string" || obj.consentId.length === 0) {
    errors.push("consentId is required");
  }
  if (typeof obj.timestamp !== "number") {
    errors.push("timestamp is required and must be a number");
  }
  if (obj.consentState === null || typeof obj.consentState !== "object") {
    errors.push("consentState is required");
  }
  if (typeof obj.configVersion !== "string" || obj.configVersion.length === 0) {
    errors.push("configVersion is required");
  }
  if (
    typeof obj.method !== "string" ||
    !VALID_METHODS.includes(obj.method as (typeof VALID_METHODS)[number])
  ) {
    errors.push(`method must be one of: ${VALID_METHODS.join(", ")}`);
  }
  if (
    typeof obj.consentModel !== "string" ||
    !VALID_MODELS.includes(obj.consentModel as (typeof VALID_MODELS)[number])
  ) {
    errors.push(
      `consentModel must be one of: ${VALID_MODELS.join(", ")}`,
    );
  }
  if (typeof obj.geoLocation !== "string" || obj.geoLocation.length === 0) {
    errors.push("geoLocation is required");
  }
  if (typeof obj.locale !== "string" || obj.locale.length === 0) {
    errors.push("locale is required");
  }

  return errors;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
