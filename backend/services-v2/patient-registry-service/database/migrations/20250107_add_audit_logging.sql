-- =====================================================
-- PATIENT REGISTRY SERVICE - AUDIT LOGGING MIGRATION
-- =====================================================
-- Purpose: Add HIPAA-compliant audit logging tables
-- Date: 2025-01-07
-- Version: 2.0.0
-- =====================================================

-- =====================================================
-- 1. AUDIT_LOGS TABLE (HIPAA Compliance)
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_schema.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event Information
  event_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id VARCHAR(50) NOT NULL,
  
  -- Action Details
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'VIEW', 
    'REGISTER', 'DEACTIVATE', 'REACTIVATE', 'MERGE', 'LINK',
    'GRANT_CONSENT', 'REVOKE_CONSENT',
    'ADD_EMERGENCY_CONTACT', 'UPDATE_EMERGENCY_CONTACT', 'REMOVE_EMERGENCY_CONTACT',
    'ADD_INSURANCE', 'UPDATE_INSURANCE', 'VERIFY_INSURANCE'
  )),
  
  -- User Context
  user_id UUID,
  user_role VARCHAR(50),
  
  -- Patient Context (for HIPAA)
  patient_id VARCHAR(20),
  contains_phi BOOLEAN DEFAULT true,
  
  -- Change Tracking
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  
  -- Request Context
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  correlation_id UUID,
  
  -- Compliance
  compliance_level VARCHAR(20) DEFAULT 'HIPAA',
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT fk_audit_patient FOREIGN KEY (patient_id) 
    REFERENCES patient_schema.patients(patient_id) ON DELETE SET NULL
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_id ON patient_schema.audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON patient_schema.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_id ON patient_schema.audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON patient_schema.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON patient_schema.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON patient_schema.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON patient_schema.audit_logs(correlation_id);

-- =====================================================
-- 2. PHI_ACCESS_LOGS TABLE (HIPAA Compliance)
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_schema.phi_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Patient Context
  patient_id VARCHAR(20) NOT NULL,
  
  -- Access Details
  user_id UUID NOT NULL,
  user_role VARCHAR(50),
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN (
    'READ', 'WRITE', 'EXPORT', 'PRINT', 'DELETE', 'SEARCH'
  )),
  
  -- Accessed Data
  accessed_fields TEXT[],
  reason TEXT,
  
  -- Request Context
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Key
  CONSTRAINT fk_phi_access_patient FOREIGN KEY (patient_id) 
    REFERENCES patient_schema.patients(patient_id) ON DELETE CASCADE
);

-- Indexes for phi_access_logs
CREATE INDEX IF NOT EXISTS idx_phi_access_patient_id ON patient_schema.phi_access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_phi_access_user_id ON patient_schema.phi_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_phi_access_timestamp ON patient_schema.phi_access_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_phi_access_type ON patient_schema.phi_access_logs(access_type);

-- =====================================================
-- 3. EVENT_PROCESSING_LOG TABLE (Idempotency)
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_schema.event_processing_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event Identification
  event_id UUID UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  routing_key VARCHAR(255),
  
  -- Processing Status
  status VARCHAR(20) NOT NULL CHECK (status IN (
    'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED'
  )),
  
  -- Handler Information
  handler_name VARCHAR(255) NOT NULL,
  
  -- Processing Details
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  processing_duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  
  -- Error Tracking
  error_message TEXT,
  error_stack TEXT,
  
  -- Event Data (for debugging)
  event_payload JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_processing_log
CREATE INDEX IF NOT EXISTS idx_event_processing_event_id ON patient_schema.event_processing_log(event_id);
CREATE INDEX IF NOT EXISTS idx_event_processing_event_type ON patient_schema.event_processing_log(event_type);
CREATE INDEX IF NOT EXISTS idx_event_processing_status ON patient_schema.event_processing_log(status);
CREATE INDEX IF NOT EXISTS idx_event_processing_handler ON patient_schema.event_processing_log(handler_name);
CREATE INDEX IF NOT EXISTS idx_event_processing_created_at ON patient_schema.event_processing_log(created_at DESC);

-- =====================================================
-- 4. AUDIT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION patient_schema.audit_patient_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '[]'::jsonb;
  old_vals JSONB := '{}'::jsonb;
  new_vals JSONB := '{}'::jsonb;
  action_type VARCHAR(50);
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'CREATE';
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE';
    old_vals := to_jsonb(OLD);
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE';
    old_vals := to_jsonb(OLD);
  END IF;

  -- Insert audit log
  INSERT INTO patient_schema.audit_logs (
    event_id,
    event_type,
    aggregate_type,
    aggregate_id,
    action,
    patient_id,
    contains_phi,
    old_values,
    new_values,
    user_id,
    compliance_level,
    timestamp
  ) VALUES (
    gen_random_uuid(),
    'Patient' || action_type,
    'Patient',
    COALESCE(NEW.patient_id, OLD.patient_id),
    action_type,
    COALESCE(NEW.patient_id, OLD.patient_id),
    true,
    old_vals,
    new_vals,
    COALESCE(NEW.updated_by::uuid, OLD.updated_by::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
    'HIPAA',
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ATTACH TRIGGER TO PATIENTS TABLE
-- =====================================================

DROP TRIGGER IF EXISTS trg_audit_patients ON patient_schema.patients;

CREATE TRIGGER trg_audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON patient_schema.patients
  FOR EACH ROW
  EXECUTE FUNCTION patient_schema.audit_patient_changes();

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to check if event was already processed (idempotency)
CREATE OR REPLACE FUNCTION patient_schema.is_event_processed(
  p_event_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM patient_schema.event_processing_log
    WHERE event_id = p_event_id
    AND status IN ('COMPLETED', 'PROCESSING')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark event as processing
CREATE OR REPLACE FUNCTION patient_schema.mark_event_processing(
  p_event_id UUID,
  p_event_type VARCHAR,
  p_handler_name VARCHAR,
  p_event_payload JSONB
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO patient_schema.event_processing_log (
    event_id,
    event_type,
    handler_name,
    status,
    event_payload,
    processed_at
  ) VALUES (
    p_event_id,
    p_event_type,
    p_handler_name,
    'PROCESSING',
    p_event_payload,
    NOW()
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark event as completed
CREATE OR REPLACE FUNCTION patient_schema.mark_event_completed(
  p_event_id UUID,
  p_processing_duration_ms INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE patient_schema.event_processing_log
  SET 
    status = 'COMPLETED',
    processing_duration_ms = p_processing_duration_ms,
    updated_at = NOW()
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark event as failed
CREATE OR REPLACE FUNCTION patient_schema.mark_event_failed(
  p_event_id UUID,
  p_error_message TEXT,
  p_error_stack TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE patient_schema.event_processing_log
  SET 
    status = 'FAILED',
    error_message = p_error_message,
    error_stack = p_error_stack,
    retry_count = retry_count + 1,
    updated_at = NOW()
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. COMMENTS
-- =====================================================

COMMENT ON TABLE patient_schema.audit_logs IS 'HIPAA-compliant audit trail for all patient operations';
COMMENT ON TABLE patient_schema.phi_access_logs IS 'HIPAA-compliant PHI access logging';
COMMENT ON TABLE patient_schema.event_processing_log IS 'Event processing log for idempotency and debugging';
COMMENT ON FUNCTION patient_schema.is_event_processed IS 'Check if event was already processed (idempotency)';
COMMENT ON FUNCTION patient_schema.mark_event_processing IS 'Mark event as being processed';
COMMENT ON FUNCTION patient_schema.mark_event_completed IS 'Mark event as successfully completed';
COMMENT ON FUNCTION patient_schema.mark_event_failed IS 'Mark event as failed with error details';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
