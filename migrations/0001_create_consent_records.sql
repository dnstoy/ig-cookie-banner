-- Consent records table for audit logging
CREATE TABLE IF NOT EXISTS consent_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  consent_state TEXT NOT NULL,
  config_version TEXT NOT NULL,
  method TEXT NOT NULL,
  consent_model TEXT NOT NULL,
  geo_location TEXT NOT NULL,
  locale TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consent_id ON consent_records (consent_id);
CREATE INDEX IF NOT EXISTS idx_timestamp ON consent_records (timestamp);
