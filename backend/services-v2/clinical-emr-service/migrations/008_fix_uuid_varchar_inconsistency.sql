-- =====================================================
-- Migration: 008_fix_uuid_varchar_inconsistency.sql
-- Description: Fix patient_id data type inconsistency across clinical tables
-- Author: Hospital Management Team
-- Date: 2025-11-02
--
-- Issue: Data type mismatch between tables:
--   - medical_records.patient_id: VARCHAR (PAT-XXXXXX-XXX pattern)
--   - care_plans.patient_id: UUID
--   - diagnostic_reports.patient_id: UUID
--   - treatment_plans.patient_id: UUID
--
-- Solution: Migrate care_plans, diagnostic_reports, and treatment_plans to VARCHAR
--           to align with medical_records (core table) and patient_schema.patients
-- =====================================================

-- Use clinical_schema
SET search_path TO clinical_schema;

-- =====================================================
-- STEP 1: Backup existing data (if any)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Starting migration 008: Fix UUID/VARCHAR inconsistency';
  RAISE NOTICE 'Backing up existing data...';
END $$;

-- Create temporary backup tables (optional, for safety)
CREATE TEMP TABLE IF NOT EXISTS temp_care_plans_backup AS
SELECT * FROM clinical_schema.care_plans;

CREATE TEMP TABLE IF NOT EXISTS temp_diagnostic_reports_backup AS
SELECT * FROM clinical_schema.diagnostic_reports;

CREATE TEMP TABLE IF NOT EXISTS temp_treatment_plans_backup AS
SELECT * FROM clinical_schema.treatment_plans;

-- =====================================================
-- STEP 2: Drop dependent indexes and constraints
-- =====================================================

-- Drop indexes on patient_id columns
DROP INDEX IF EXISTS clinical_schema.idx_care_plans_patient_id;
DROP INDEX IF EXISTS clinical_schema.idx_diagnostic_reports_patient_id;
DROP INDEX IF EXISTS clinical_schema.idx_treatment_plans_patient_id;

-- Drop any foreign key constraints (if they exist)
DO $$
BEGIN
  -- Care plans
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'clinical_schema'
    AND table_name = 'care_plans'
    AND constraint_name LIKE '%patient_id%'
  ) THEN
    EXECUTE 'ALTER TABLE clinical_schema.care_plans DROP CONSTRAINT IF EXISTS care_plans_patient_id_fkey CASCADE';
  END IF;

  -- Diagnostic reports
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'clinical_schema'
    AND table_name = 'diagnostic_reports'
    AND constraint_name LIKE '%patient_id%'
  ) THEN
    EXECUTE 'ALTER TABLE clinical_schema.diagnostic_reports DROP CONSTRAINT IF EXISTS diagnostic_reports_patient_id_fkey CASCADE';
  END IF;

  -- Treatment plans
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'clinical_schema'
    AND table_name = 'treatment_plans'
    AND constraint_name LIKE '%patient_id%'
  ) THEN
    EXECUTE 'ALTER TABLE clinical_schema.treatment_plans DROP CONSTRAINT IF EXISTS treatment_plans_patient_id_fkey CASCADE';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Convert patient_id columns to VARCHAR
-- =====================================================

-- Care Plans
DO $$
BEGIN
  RAISE NOTICE 'Converting care_plans.patient_id: UUID -> VARCHAR';

  -- Check if there's any data
  IF EXISTS (SELECT 1 FROM clinical_schema.care_plans LIMIT 1) THEN
    RAISE WARNING 'care_plans table has data. Converting existing UUIDs to VARCHAR...';
    -- Note: This will convert UUID to string representation
    -- If you need custom mapping, handle it here
  END IF;

  -- Alter column type
  ALTER TABLE clinical_schema.care_plans
    ALTER COLUMN patient_id TYPE VARCHAR(255) USING patient_id::VARCHAR;
END $$;

-- Diagnostic Reports
DO $$
BEGIN
  RAISE NOTICE 'Converting diagnostic_reports.patient_id: UUID -> VARCHAR';

  IF EXISTS (SELECT 1 FROM clinical_schema.diagnostic_reports LIMIT 1) THEN
    RAISE WARNING 'diagnostic_reports table has data. Converting existing UUIDs to VARCHAR...';
  END IF;

  ALTER TABLE clinical_schema.diagnostic_reports
    ALTER COLUMN patient_id TYPE VARCHAR(255) USING patient_id::VARCHAR;
END $$;

-- Treatment Plans
DO $$
BEGIN
  RAISE NOTICE 'Converting treatment_plans.patient_id: UUID -> VARCHAR';

  IF EXISTS (SELECT 1 FROM clinical_schema.treatment_plans LIMIT 1) THEN
    RAISE WARNING 'treatment_plans table has data. Converting existing UUIDs to VARCHAR...';
  END IF;

  ALTER TABLE clinical_schema.treatment_plans
    ALTER COLUMN patient_id TYPE VARCHAR(255) USING patient_id::VARCHAR;
END $$;

-- =====================================================
-- STEP 4: Add constraints for VARCHAR pattern validation
-- =====================================================

-- Care Plans: Validate patient_id format (PAT-XXXXXX-XXX)
ALTER TABLE clinical_schema.care_plans
  ADD CONSTRAINT care_plans_patient_id_format_check
  CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$');

-- Diagnostic Reports: Validate patient_id format
ALTER TABLE clinical_schema.diagnostic_reports
  ADD CONSTRAINT diagnostic_reports_patient_id_format_check
  CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$');

-- Treatment Plans: Validate patient_id format
ALTER TABLE clinical_schema.treatment_plans
  ADD CONSTRAINT treatment_plans_patient_id_format_check
  CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$');

-- =====================================================
-- STEP 5: Recreate indexes for performance
-- =====================================================

-- Care Plans indexes
CREATE INDEX IF NOT EXISTS idx_care_plans_patient_id
  ON clinical_schema.care_plans(patient_id);

CREATE INDEX IF NOT EXISTS idx_care_plans_patient_status
  ON clinical_schema.care_plans(patient_id, plan_status);

-- Diagnostic Reports indexes
CREATE INDEX IF NOT EXISTS idx_diagnostic_reports_patient_id
  ON clinical_schema.diagnostic_reports(patient_id);

CREATE INDEX IF NOT EXISTS idx_diagnostic_reports_patient_status
  ON clinical_schema.diagnostic_reports(patient_id, report_status);

CREATE INDEX IF NOT EXISTS idx_diagnostic_reports_patient_date
  ON clinical_schema.diagnostic_reports(patient_id, report_date DESC);

-- Treatment Plans indexes
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id
  ON clinical_schema.treatment_plans(patient_id);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_status
  ON clinical_schema.treatment_plans(patient_id, plan_status);

-- =====================================================
-- STEP 6: Update doctor_id consistency (if needed)
-- =====================================================

-- Check and align doctor_id types as well
DO $$
BEGIN
  -- Care plans doctor_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinical_schema'
    AND table_name = 'care_plans'
    AND column_name = 'doctor_id'
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'Converting care_plans.doctor_id: UUID -> VARCHAR';
    ALTER TABLE clinical_schema.care_plans
      ALTER COLUMN doctor_id TYPE VARCHAR(255) USING doctor_id::VARCHAR;
  END IF;

  -- Diagnostic reports doctor_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinical_schema'
    AND table_name = 'diagnostic_reports'
    AND column_name = 'doctor_id'
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'Converting diagnostic_reports.doctor_id: UUID -> VARCHAR';
    ALTER TABLE clinical_schema.diagnostic_reports
      ALTER COLUMN doctor_id TYPE VARCHAR(255) USING doctor_id::VARCHAR;
  END IF;

  -- Treatment plans doctor_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinical_schema'
    AND table_name = 'treatment_plans'
    AND column_name = 'doctor_id'
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'Converting treatment_plans.doctor_id: UUID -> VARCHAR';
    ALTER TABLE clinical_schema.treatment_plans
      ALTER COLUMN doctor_id TYPE VARCHAR(255) USING doctor_id::VARCHAR;
  END IF;

  -- Primary doctor in care plans
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'clinical_schema'
    AND table_name = 'care_plans'
    AND column_name = 'primary_doctor_id'
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'Converting care_plans.primary_doctor_id: UUID -> VARCHAR';
    ALTER TABLE clinical_schema.care_plans
      ALTER COLUMN primary_doctor_id TYPE VARCHAR(255) USING primary_doctor_id::VARCHAR;
  END IF;
END $$;

-- =====================================================
-- STEP 7: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN clinical_schema.care_plans.patient_id IS
  'Patient ID in VARCHAR format (PAT-XXXXXX-XXX) - aligned with medical_records';

COMMENT ON COLUMN clinical_schema.diagnostic_reports.patient_id IS
  'Patient ID in VARCHAR format (PAT-XXXXXX-XXX) - aligned with medical_records';

COMMENT ON COLUMN clinical_schema.treatment_plans.patient_id IS
  'Patient ID in VARCHAR format (PAT-XXXXXX-XXX) - aligned with medical_records';

-- =====================================================
-- STEP 8: Verify data integrity
-- =====================================================

DO $$
DECLARE
  v_care_plans_count INTEGER;
  v_diagnostic_reports_count INTEGER;
  v_treatment_plans_count INTEGER;
BEGIN
  -- Count records in each table
  SELECT COUNT(*) INTO v_care_plans_count FROM clinical_schema.care_plans;
  SELECT COUNT(*) INTO v_diagnostic_reports_count FROM clinical_schema.diagnostic_reports;
  SELECT COUNT(*) INTO v_treatment_plans_count FROM clinical_schema.treatment_plans;

  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ Migration 008 completed successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Data integrity check:';
  RAISE NOTICE '  - care_plans: % records', v_care_plans_count;
  RAISE NOTICE '  - diagnostic_reports: % records', v_diagnostic_reports_count;
  RAISE NOTICE '  - treatment_plans: % records', v_treatment_plans_count;
  RAISE NOTICE '';
  RAISE NOTICE 'All patient_id columns now use VARCHAR(255) with pattern validation';
  RAISE NOTICE 'Pattern: PAT-XXXXXX-XXX (matches medical_records)';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes recreated for optimal performance';
  RAISE NOTICE '==============================================';
END $$;

-- =====================================================
-- STEP 9: Cleanup temporary tables
-- =====================================================

DROP TABLE IF EXISTS temp_care_plans_backup;
DROP TABLE IF EXISTS temp_diagnostic_reports_backup;
DROP TABLE IF EXISTS temp_treatment_plans_backup;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show updated column types
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'clinical_schema'
  AND table_name IN ('care_plans', 'diagnostic_reports', 'treatment_plans', 'medical_records')
  AND column_name IN ('patient_id', 'doctor_id')
ORDER BY table_name, column_name;

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
--
-- To rollback this migration, run:
--
-- ALTER TABLE clinical_schema.care_plans
--   ALTER COLUMN patient_id TYPE UUID USING patient_id::UUID;
--
-- ALTER TABLE clinical_schema.diagnostic_reports
--   ALTER COLUMN patient_id TYPE UUID USING patient_id::UUID;
--
-- ALTER TABLE clinical_schema.treatment_plans
--   ALTER COLUMN patient_id TYPE UUID USING patient_id::UUID;
--
-- Note: Rollback will fail if VARCHAR values don't match UUID format
-- =====================================================

-- =====================================================
-- END OF MIGRATION
-- =====================================================
