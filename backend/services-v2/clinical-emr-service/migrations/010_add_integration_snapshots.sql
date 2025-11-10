-- 010_add_integration_snapshots.sql
-- Adds integration inbox + patient/provider snapshot tables for cross-service sync

BEGIN;

CREATE SCHEMA IF NOT EXISTS clinical_schema;
SET search_path TO clinical_schema;

-- Ensure pgcrypto is available for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE clinical_integration_event_status AS ENUM (
    'RECEIVED',
    'PROCESSING',
    'PROCESSED',
    'FAILED'
);

CREATE TABLE IF NOT EXISTS integration_inbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    routing_key TEXT NOT NULL,
    source_service TEXT,
    payload JSONB NOT NULL,
    status clinical_integration_event_status NOT NULL DEFAULT 'RECEIVED',
    received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    processed_at TIMESTAMPTZ,
    last_error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_integration_inbox_status
    ON integration_inbox_events(status);

CREATE INDEX IF NOT EXISTS idx_integration_inbox_routing_key
    ON integration_inbox_events(routing_key);

CREATE TABLE IF NOT EXISTS patient_snapshots (
    patient_id TEXT PRIMARY KEY,
    full_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    phone TEXT,
    email TEXT,
    address JSONB,
    insurance JSONB,
    emergency_contact JSONB,
    last_appointment_id TEXT,
    last_appointment_at TIMESTAMPTZ,
    last_doctor_id TEXT,
    last_appointment_status TEXT,
    source_service TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_patient_snapshots_last_synced
    ON patient_snapshots(last_synced_at DESC);

CREATE TABLE IF NOT EXISTS provider_snapshots (
    provider_id TEXT PRIMARY KEY,
    full_name TEXT,
    specialization TEXT,
    department TEXT,
    license_number TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_known_status TEXT,
    source_service TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_provider_snapshots_active
    ON provider_snapshots(is_active, specialization);

COMMENT ON TABLE integration_inbox_events IS 'Idempotent inbox for cross-service integration events';
COMMENT ON TABLE patient_snapshots IS 'Cached patient context received from patient registry events';
COMMENT ON TABLE provider_snapshots IS 'Cached provider/staff context received from provider events';

COMMIT;
