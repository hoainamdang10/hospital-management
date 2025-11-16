-- Migration: Scope Reduction - Staff Types
-- Date: 2025-01-15
-- Purpose: Reduce staff types from 7 to 2 (DOCTOR, RECEPTIONIST) for MVP scope
-- Author: Hospital Management Team
-- Related: Phase 1 Code Cleanup - Provider/Staff Service Scope Reduction

-- ============================================================================
-- STEP 1: Verify existing data
-- ============================================================================

-- Check if there are any staff with types other than 'doctor' and 'receptionist'
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM provider_schema.staff_profiles
  WHERE staff_type NOT IN ('doctor', 'receptionist');
  
  IF invalid_count > 0 THEN
    RAISE NOTICE 'Found % staff records with invalid types that need migration', invalid_count;
    
    -- Show details of invalid records
    RAISE NOTICE 'Invalid staff records:';
    FOR rec IN 
      SELECT staff_id, staff_type, personal_info->>'fullName' as full_name
      FROM provider_schema.staff_profiles
      WHERE staff_type NOT IN ('doctor', 'receptionist')
      ORDER BY staff_type, staff_id
    LOOP
      RAISE NOTICE '  - Staff ID: %, Type: %, Name: %', rec.staff_id, rec.staff_type, rec.full_name;
    END LOOP;
  ELSE
    RAISE NOTICE 'No invalid staff records found. Safe to proceed.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Migrate existing data (if needed)
-- ============================================================================

-- Option A: For test/development environment - Delete invalid records
-- Uncomment if you want to delete test data
-- DELETE FROM provider_schema.staff_profiles
-- WHERE staff_type NOT IN ('doctor', 'receptionist');

-- Option B: For production environment - Migrate to receptionist
-- Uncomment if you want to preserve data by converting to receptionist
-- UPDATE provider_schema.staff_profiles
-- SET 
--   staff_type = 'receptionist',
--   updated_at = NOW(),
--   updated_by = 'system_migration_20250115'
-- WHERE staff_type IN ('nurse', 'admin');

-- Option C: Manual review required
-- If you have production data, review each record manually before migration
-- SELECT staff_id, staff_type, personal_info->>'fullName' as full_name, 
--        professional_info->>'title' as title
-- FROM provider_schema.staff_profiles
-- WHERE staff_type NOT IN ('doctor', 'receptionist');

-- ============================================================================
-- STEP 3: Drop old CHECK constraint
-- ============================================================================

ALTER TABLE provider_schema.staff_profiles
DROP CONSTRAINT IF EXISTS chk_staff_type;

-- ============================================================================
-- STEP 4: Add new CHECK constraint (only 'doctor' and 'receptionist')
-- ============================================================================

ALTER TABLE provider_schema.staff_profiles
ADD CONSTRAINT chk_staff_type 
CHECK (staff_type IN ('doctor', 'receptionist'));

-- ============================================================================
-- STEP 5: Update column comment
-- ============================================================================

COMMENT ON COLUMN provider_schema.staff_profiles.staff_type IS 
'Staff type: doctor (bác sĩ) or receptionist (lễ tân). Scope reduced for MVP. Legacy types (nurse, technician, pharmacist, therapist, admin) are no longer supported.';

-- ============================================================================
-- STEP 6: Verify migration
-- ============================================================================

DO $$
DECLARE
  total_count INTEGER;
  doctor_count INTEGER;
  receptionist_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM provider_schema.staff_profiles;
  SELECT COUNT(*) INTO doctor_count FROM provider_schema.staff_profiles WHERE staff_type = 'doctor';
  SELECT COUNT(*) INTO receptionist_count FROM provider_schema.staff_profiles WHERE staff_type = 'receptionist';
  
  RAISE NOTICE '=== Migration Verification ===';
  RAISE NOTICE 'Total staff records: %', total_count;
  RAISE NOTICE 'Doctors: %', doctor_count;
  RAISE NOTICE 'Receptionists: %', receptionist_count;
  RAISE NOTICE 'Migration completed successfully!';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- ALTER TABLE provider_schema.staff_profiles DROP CONSTRAINT IF EXISTS chk_staff_type;
-- ALTER TABLE provider_schema.staff_profiles ADD CONSTRAINT chk_staff_type 
-- CHECK (staff_type IN ('doctor', 'nurse', 'technician', 'pharmacist', 'therapist', 'admin', 'receptionist'));
