-- ============================================================================
-- Migration 012: Create Read Models for Pure Outbox Pattern
-- Purpose: Maintain local denormalized copies of Patient and Provider data
-- Author: Hospital Management Team
-- Date: 2025-10-29
-- ============================================================================

-- Switch to appointments schema
SET search_path TO appointments_schema;

-- ============================================================================
-- 1. Patient Read Model (Denormalized Cache)
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_read_model (
  patient_id VARCHAR(50) PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'hospital-1',
  
  -- Personal Information
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  national_id TEXT,
  
  -- Contact Information
  phone TEXT,
  email TEXT,
  address JSONB,
  
  -- Insurance Information
  insurance_number TEXT,
  insurance_type TEXT, -- 'BHYT' | 'BHTN' | 'PRIVATE' | 'NONE'
  
  -- Sync Metadata
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE patient_read_model IS 'Denormalized patient data for appointments service (eventual consistency)';
COMMENT ON COLUMN patient_read_model.synced_at IS 'Last sync time from patient-registry-service';

-- Indexes for patient read model
CREATE INDEX idx_patient_read_tenant ON patient_read_model(tenant_id);
CREATE INDEX idx_patient_read_phone ON patient_read_model(phone);
CREATE INDEX idx_patient_read_email ON patient_read_model(email);
CREATE INDEX idx_patient_read_national_id ON patient_read_model(national_id);
CREATE INDEX idx_patient_read_synced_at ON patient_read_model(synced_at DESC);

-- ============================================================================
-- 2. Provider/Staff Read Model (Denormalized Cache)
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_read_model (
  provider_id VARCHAR(50) PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'hospital-1',
  
  -- Personal Information
  full_name TEXT NOT NULL,
  
  -- Professional Information
  specialization TEXT,
  department TEXT,
  license_number TEXT,
  
  -- Contact Information
  phone TEXT,
  email TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Sync Metadata
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE provider_read_model IS 'Denormalized provider/staff data for appointments service (eventual consistency)';
COMMENT ON COLUMN provider_read_model.synced_at IS 'Last sync time from provider-staff-service';

-- Indexes for provider read model
CREATE INDEX idx_provider_read_tenant ON provider_read_model(tenant_id);
CREATE INDEX idx_provider_read_specialization ON provider_read_model(specialization);
CREATE INDEX idx_provider_read_department ON provider_read_model(department);
CREATE INDEX idx_provider_read_active ON provider_read_model(is_active);
CREATE INDEX idx_provider_read_synced_at ON provider_read_model(synced_at DESC);

-- ============================================================================
-- 3. Inbox Events (Idempotent Event Processing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Identity
  event_id TEXT NOT NULL UNIQUE, -- From external event (patient.patient.registered, etc.)
  event_type TEXT NOT NULL,
  source_service TEXT NOT NULL, -- 'patient-registry' | 'provider-staff'
  
  -- Event Data
  payload_json JSONB NOT NULL,
  
  -- Processing Metadata
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inbox_events IS 'Inbox for idempotent event processing (prevents duplicate processing)';
COMMENT ON COLUMN inbox_events.event_id IS 'Unique event ID from source service (deduplication key)';

-- Indexes for inbox
CREATE INDEX idx_inbox_event_id ON inbox_events(event_id);
CREATE INDEX idx_inbox_event_type ON inbox_events(event_type);
CREATE INDEX idx_inbox_source_service ON inbox_events(source_service);
CREATE INDEX idx_inbox_processed_at ON inbox_events(processed_at DESC);
CREATE INDEX idx_inbox_created_at ON inbox_events(created_at DESC); -- For cleanup queries

-- ============================================================================
-- 4. Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE patient_read_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_read_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_events ENABLE ROW LEVEL SECURITY;

-- Service role can access all data
CREATE POLICY patient_read_service_policy ON patient_read_model
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY provider_read_service_policy ON provider_read_model
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY inbox_service_policy ON inbox_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_read_model_updated_at
  BEFORE UPDATE ON patient_read_model
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_read_model_updated_at
  BEFORE UPDATE ON provider_read_model
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. Monitoring Views
-- ============================================================================

-- View: Read model sync lag
CREATE OR REPLACE VIEW read_model_sync_status AS
SELECT
  'patient' AS model_type,
  COUNT(*) AS total_records,
  MAX(synced_at) AS last_sync,
  EXTRACT(EPOCH FROM (NOW() - MAX(synced_at))) AS lag_seconds
FROM patient_read_model
UNION ALL
SELECT
  'provider' AS model_type,
  COUNT(*) AS total_records,
  MAX(synced_at) AS last_sync,
  EXTRACT(EPOCH FROM (NOW() - MAX(synced_at))) AS lag_seconds
FROM provider_read_model;

COMMENT ON VIEW read_model_sync_status IS 'Monitor read model sync lag (target: <60s)';

-- View: Inbox event processing rate
CREATE OR REPLACE VIEW inbox_processing_stats AS
SELECT
  source_service,
  event_type,
  COUNT(*) AS total_processed,
  MAX(processed_at) AS last_processed,
  COUNT(*) FILTER (WHERE processed_at > NOW() - INTERVAL '1 hour') AS processed_last_hour
FROM inbox_events
GROUP BY source_service, event_type
ORDER BY last_processed DESC;

COMMENT ON VIEW inbox_processing_stats IS 'Monitor inbox event processing rate';

-- ============================================================================
-- 7. Grant Permissions
-- ============================================================================

-- Grant to service role
GRANT ALL ON patient_read_model TO authenticated;
GRANT ALL ON provider_read_model TO authenticated;
GRANT ALL ON inbox_events TO authenticated;

-- Grant sequence permissions if using SERIAL
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA appointments_schema TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON SCHEMA appointments_schema IS 'Appointments Service Schema - Read Models Added (v012)';

-- Verify tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'appointments_schema' AND table_name = 'patient_read_model') THEN
    RAISE EXCEPTION 'Migration 012 failed: patient_read_model not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'appointments_schema' AND table_name = 'provider_read_model') THEN
    RAISE EXCEPTION 'Migration 012 failed: provider_read_model not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'appointments_schema' AND table_name = 'inbox_events') THEN
    RAISE EXCEPTION 'Migration 012 failed: inbox_events not created';
  END IF;
  
  RAISE NOTICE 'Migration 012: Read Models created successfully ✓';
END $$;
