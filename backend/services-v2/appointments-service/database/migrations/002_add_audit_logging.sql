-- =====================================================
-- Migration: Add HIPAA-Compliant Audit Logging
-- =====================================================
-- Author: Hospital Management Team
-- Date: 2025-01-11
-- Purpose: Add audit logging tables for HIPAA compliance
-- Compliance: HIPAA, Vietnamese Healthcare Standards

BEGIN;

-- =====================================================
-- 1. APPOINTMENT_AUDIT_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduling_schema.appointment_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'VIEW', 
    'CANCEL', 'RESCHEDULE', 'CONFIRM', 
    'CHECK_IN', 'COMPLETE', 'NO_SHOW'
  )),
  user_id UUID NOT NULL,
  user_role TEXT,
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Key within same schema
  CONSTRAINT fk_audit_appointment FOREIGN KEY (appointment_id) 
    REFERENCES scheduling_schema.appointments(appointment_id) ON DELETE CASCADE
);

-- Indexes for audit logs
CREATE INDEX idx_audit_appointment_id 
  ON scheduling_schema.appointment_audit_logs(appointment_id);
  
CREATE INDEX idx_audit_timestamp 
  ON scheduling_schema.appointment_audit_logs(timestamp DESC);
  
CREATE INDEX idx_audit_user_id 
  ON scheduling_schema.appointment_audit_logs(user_id);
  
CREATE INDEX idx_audit_action 
  ON scheduling_schema.appointment_audit_logs(action);

-- Comments
COMMENT ON TABLE scheduling_schema.appointment_audit_logs IS 
  'HIPAA-compliant audit trail for all appointment operations';
  
COMMENT ON COLUMN scheduling_schema.appointment_audit_logs.changed_fields IS 
  'Array of field names that were changed';
  
COMMENT ON COLUMN scheduling_schema.appointment_audit_logs.old_values IS 
  'JSONB object containing old values of changed fields';
  
COMMENT ON COLUMN scheduling_schema.appointment_audit_logs.new_values IS 
  'JSONB object containing new values of changed fields';

-- =====================================================
-- 2. PHI_ACCESS_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduling_schema.phi_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN (
    'READ', 'WRITE', 'EXPORT', 'PRINT', 'DELETE'
  )),
  accessed_fields TEXT[],
  reason TEXT,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign Key within same schema
  CONSTRAINT fk_phi_access_appointment FOREIGN KEY (appointment_id) 
    REFERENCES scheduling_schema.appointments(appointment_id) ON DELETE CASCADE
);

-- Indexes for PHI access logs
CREATE INDEX idx_phi_access_appointment 
  ON scheduling_schema.phi_access_logs(appointment_id);
  
CREATE INDEX idx_phi_access_timestamp 
  ON scheduling_schema.phi_access_logs(timestamp DESC);
  
CREATE INDEX idx_phi_access_user_id 
  ON scheduling_schema.phi_access_logs(user_id);
  
CREATE INDEX idx_phi_access_type 
  ON scheduling_schema.phi_access_logs(access_type);

-- Comments
COMMENT ON TABLE scheduling_schema.phi_access_logs IS 
  'HIPAA-compliant PHI (Protected Health Information) access logging';
  
COMMENT ON COLUMN scheduling_schema.phi_access_logs.accessed_fields IS 
  'Array of PHI field names that were accessed (e.g., reason, symptoms, notes)';
  
COMMENT ON COLUMN scheduling_schema.phi_access_logs.reason IS 
  'Business reason for accessing PHI (required for HIPAA compliance)';

-- =====================================================
-- 3. AUDIT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION scheduling_schema.audit_appointment_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '[]'::jsonb;
  old_vals JSONB := '{}'::jsonb;
  new_vals JSONB := '{}'::jsonb;
  field_name TEXT;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    -- Log creation
    INSERT INTO scheduling_schema.appointment_audit_logs (
      appointment_id, action, user_id, user_role, 
      new_values, timestamp
    ) VALUES (
      NEW.appointment_id, 'CREATE', 
      COALESCE(NEW.created_by::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
      'SYSTEM',
      to_jsonb(NEW),
      NOW()
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Compare old and new values
    FOR field_name IN 
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'scheduling_schema' 
        AND table_name = 'appointments'
        AND column_name NOT IN ('id', 'created_at', 'updated_at')
    LOOP
      IF to_jsonb(OLD) ->> field_name IS DISTINCT FROM to_jsonb(NEW) ->> field_name THEN
        changed_fields := changed_fields || to_jsonb(field_name);
        old_vals := old_vals || jsonb_build_object(field_name, to_jsonb(OLD) -> field_name);
        new_vals := new_vals || jsonb_build_object(field_name, to_jsonb(NEW) -> field_name);
      END IF;
    END LOOP;
    
    -- Only log if there are actual changes
    IF jsonb_array_length(changed_fields) > 0 THEN
      INSERT INTO scheduling_schema.appointment_audit_logs (
        appointment_id, action, user_id, user_role,
        changed_fields, old_values, new_values, timestamp
      ) VALUES (
        NEW.appointment_id, 'UPDATE',
        COALESCE(NEW.last_modified_by::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
        'SYSTEM',
        changed_fields, old_vals, new_vals,
        NOW()
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Log deletion
    INSERT INTO scheduling_schema.appointment_audit_logs (
      appointment_id, action, user_id, user_role,
      old_values, timestamp
    ) VALUES (
      OLD.appointment_id, 'DELETE',
      '00000000-0000-0000-0000-000000000000'::uuid,
      'SYSTEM',
      to_jsonb(OLD),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. ATTACH TRIGGER TO APPOINTMENTS TABLE
-- =====================================================

DROP TRIGGER IF EXISTS trg_audit_appointments ON scheduling_schema.appointments;

CREATE TRIGGER trg_audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON scheduling_schema.appointments
  FOR EACH ROW
  EXECUTE FUNCTION scheduling_schema.audit_appointment_changes();

-- =====================================================
-- 5. PHI ACCESS LOGGING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION scheduling_schema.log_phi_access(
  p_appointment_id TEXT,
  p_user_id UUID,
  p_access_type TEXT,
  p_accessed_fields TEXT[],
  p_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO scheduling_schema.phi_access_logs (
    appointment_id, user_id, access_type,
    accessed_fields, reason, ip_address, timestamp
  ) VALUES (
    p_appointment_id, p_user_id, p_access_type,
    p_accessed_fields, p_reason, p_ip_address, NOW()
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION scheduling_schema.log_phi_access IS 
  'Helper function to log PHI access. Call this from application code when accessing sensitive appointment data.';

-- =====================================================
-- 6. VERIFY AUDIT LOGGING SETUP
-- =====================================================

DO $$
DECLARE
  audit_table_exists BOOLEAN;
  phi_table_exists BOOLEAN;
  trigger_exists BOOLEAN;
BEGIN
  -- Check if audit tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'scheduling_schema'
      AND table_name = 'appointment_audit_logs'
  ) INTO audit_table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'scheduling_schema'
      AND table_name = 'phi_access_logs'
  ) INTO phi_table_exists;
  
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'scheduling_schema'
      AND trigger_name = 'trg_audit_appointments'
  ) INTO trigger_exists;
  
  IF audit_table_exists AND phi_table_exists AND trigger_exists THEN
    RAISE NOTICE '✅ Audit logging setup successful!';
    RAISE NOTICE '  - appointment_audit_logs: Created';
    RAISE NOTICE '  - phi_access_logs: Created';
    RAISE NOTICE '  - Audit trigger: Attached';
  ELSE
    RAISE EXCEPTION '❌ Audit logging setup failed!';
  END IF;
END $$;

COMMIT;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Log PHI access when viewing appointment
-- SELECT scheduling_schema.log_phi_access(
--   '2025-APT-011001-001',
--   'user-uuid-here'::uuid,
--   'READ',
--   ARRAY['reason', 'symptoms', 'notes'],
--   'Reviewing patient appointment for consultation',
--   '192.168.1.100'::inet
-- );

-- Example 2: Query audit logs for an appointment
-- SELECT * FROM scheduling_schema.appointment_audit_logs
-- WHERE appointment_id = '2025-APT-011001-001'
-- ORDER BY timestamp DESC;

-- Example 3: Query PHI access logs for compliance report
-- SELECT 
--   user_id,
--   COUNT(*) as access_count,
--   array_agg(DISTINCT access_type) as access_types
-- FROM scheduling_schema.phi_access_logs
-- WHERE timestamp >= NOW() - INTERVAL '30 days'
-- GROUP BY user_id
-- ORDER BY access_count DESC;

