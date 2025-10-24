-- =====================================================
-- Migration: Fix Soft References to Use Business IDs
-- =====================================================
-- Author: Hospital Management Team
-- Date: 2025-01-11
-- Purpose: Convert patient_id and doctor_id from UUID to VARCHAR (business IDs)
-- Compliance: Schema Per Service Pattern

BEGIN;

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA
-- =====================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS scheduling_schema.appointments_backup_20250111 AS
SELECT * FROM scheduling_schema.appointments;

COMMENT ON TABLE scheduling_schema.appointments_backup_20250111 IS 'Backup before migration 001_fix_soft_references';

-- =====================================================
-- STEP 2: ADD NEW COLUMNS WITH CORRECT TYPES
-- =====================================================

ALTER TABLE scheduling_schema.appointments
  ADD COLUMN IF NOT EXISTS patient_business_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS doctor_business_id VARCHAR(30);

-- =====================================================
-- STEP 3: MIGRATE DATA (IF ANY EXISTS)
-- =====================================================

-- NOTE: This requires mapping UUIDs to business IDs
-- If you have existing data, you need to run these queries:

-- Map patient UUIDs to business IDs
-- UPDATE scheduling_schema.appointments a
-- SET patient_business_id = p.patient_id
-- FROM patient_schema.patients p
-- WHERE a.patient_id = p.id;

-- Map doctor UUIDs to business IDs  
-- UPDATE scheduling_schema.appointments a
-- SET doctor_business_id = s.staff_id
-- FROM provider_schema.staff_profiles s
-- WHERE a.doctor_id = s.id;

-- For now, we'll just log a warning if data exists
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM scheduling_schema.appointments;
  
  IF row_count > 0 THEN
    RAISE WARNING 'Found % existing appointments. Manual data migration required!', row_count;
    RAISE WARNING 'Run the UPDATE queries in STEP 3 to migrate data.';
  ELSE
    RAISE NOTICE 'No existing appointments found. Safe to proceed.';
  END IF;
END $$;

-- =====================================================
-- STEP 4: DROP OLD COLUMNS
-- =====================================================

-- Only drop if new columns are populated or table is empty
DO $$
DECLARE
  row_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM scheduling_schema.appointments;
  SELECT COUNT(*) INTO migrated_count 
  FROM scheduling_schema.appointments 
  WHERE patient_business_id IS NOT NULL AND doctor_business_id IS NOT NULL;
  
  IF row_count = 0 OR row_count = migrated_count THEN
    -- Safe to drop old columns
    ALTER TABLE scheduling_schema.appointments
      DROP COLUMN IF EXISTS patient_id CASCADE,
      DROP COLUMN IF EXISTS doctor_id CASCADE;
    
    RAISE NOTICE 'Old columns dropped successfully.';
  ELSE
    RAISE EXCEPTION 'Cannot drop old columns: data migration incomplete. Migrated: %, Total: %', migrated_count, row_count;
  END IF;
END $$;

-- =====================================================
-- STEP 5: RENAME NEW COLUMNS
-- =====================================================

ALTER TABLE scheduling_schema.appointments
  RENAME COLUMN patient_business_id TO patient_id;

ALTER TABLE scheduling_schema.appointments
  RENAME COLUMN doctor_business_id TO doctor_id;

-- =====================================================
-- STEP 6: ADD NOT NULL CONSTRAINTS
-- =====================================================

ALTER TABLE scheduling_schema.appointments
  ALTER COLUMN patient_id SET NOT NULL,
  ALTER COLUMN doctor_id SET NOT NULL;

-- =====================================================
-- STEP 7: ADD CHECK CONSTRAINTS
-- =====================================================

ALTER TABLE scheduling_schema.appointments
  ADD CONSTRAINT chk_patient_id_format 
    CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$'),
  ADD CONSTRAINT chk_doctor_id_format 
    CHECK (doctor_id ~ '^[A-Z]{2,4}-DOC-\d{6}-\d{3}$');

-- =====================================================
-- STEP 8: RECREATE INDEXES
-- =====================================================

-- Drop old indexes if they exist
DROP INDEX IF EXISTS scheduling_schema.idx_appointments_patient_id;
DROP INDEX IF EXISTS scheduling_schema.idx_appointments_doctor_id;

-- Create new indexes
CREATE INDEX idx_appointments_patient_id 
  ON scheduling_schema.appointments(patient_id);
  
CREATE INDEX idx_appointments_doctor_id 
  ON scheduling_schema.appointments(doctor_id);

-- =====================================================
-- STEP 9: UPDATE COMMENTS
-- =====================================================

COMMENT ON COLUMN scheduling_schema.appointments.patient_id IS 
  'Soft reference to patient_schema.patients.patient_id (PAT-YYYYMM-XXX) - NO FK constraint';
  
COMMENT ON COLUMN scheduling_schema.appointments.doctor_id IS 
  'Soft reference to provider_schema.staff_profiles.staff_id (DEPT-DOC-YYYYMM-XXX) - NO FK constraint';

-- =====================================================
-- STEP 10: VERIFY MIGRATION
-- =====================================================

DO $$
DECLARE
  patient_id_type TEXT;
  doctor_id_type TEXT;
BEGIN
  -- Check column types
  SELECT data_type INTO patient_id_type
  FROM information_schema.columns
  WHERE table_schema = 'scheduling_schema'
    AND table_name = 'appointments'
    AND column_name = 'patient_id';
    
  SELECT data_type INTO doctor_id_type
  FROM information_schema.columns
  WHERE table_schema = 'scheduling_schema'
    AND table_name = 'appointments'
    AND column_name = 'doctor_id';
  
  IF patient_id_type = 'character varying' AND doctor_id_type = 'character varying' THEN
    RAISE NOTICE '✅ Migration successful! patient_id: %, doctor_id: %', patient_id_type, doctor_id_type;
  ELSE
    RAISE EXCEPTION '❌ Migration failed! patient_id: %, doctor_id: %', patient_id_type, doctor_id_type;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK SCRIPT (Run this if migration fails)
-- =====================================================

-- To rollback, run:
-- BEGIN;
-- DROP TABLE IF EXISTS scheduling_schema.appointments;
-- ALTER TABLE scheduling_schema.appointments_backup_20250111 RENAME TO appointments;
-- COMMIT;

