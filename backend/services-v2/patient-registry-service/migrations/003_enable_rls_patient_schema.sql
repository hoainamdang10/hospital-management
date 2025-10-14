-- Migration: Enable Row Level Security on Patient Schema Tables
-- Description: Enable RLS on all tables in patient_schema for HIPAA compliance
-- Author: Hospital Management System V2 Team
-- Date: 2025-01-07
-- Version: 1.0.0

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on patients table
ALTER TABLE patient_schema.patients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on insurance_info table
ALTER TABLE patient_schema.insurance_info ENABLE ROW LEVEL SECURITY;

-- Enable RLS on emergency_contacts table
ALTER TABLE patient_schema.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on patient_consents table
ALTER TABLE patient_schema.patient_consents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on patient_links table
ALTER TABLE patient_schema.patient_links ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled
DO $$
DECLARE
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'patient_schema'
    AND rowsecurity = true;
  
  IF rls_count != 5 THEN
    RAISE EXCEPTION 'RLS not enabled on all tables. Expected 5, got %', rls_count;
  END IF;
  
  RAISE NOTICE 'RLS successfully enabled on all 5 patient_schema tables';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

-- To rollback this migration, run:
-- ALTER TABLE patient_schema.patients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE patient_schema.insurance_info DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE patient_schema.emergency_contacts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE patient_schema.patient_consents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE patient_schema.patient_links DISABLE ROW LEVEL SECURITY;

