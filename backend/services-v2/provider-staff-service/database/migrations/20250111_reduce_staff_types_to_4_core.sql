-- Migration: Reduce Staff Types from 7 to 4 Core Types
-- Date: 2025-01-11
-- Author: Hospital Management Team
-- Purpose: Simplify staff types to 4 core types aligned with Identity Service roles
-- 
-- Changes:
-- - Remove staff types: technician, pharmacist, therapist
-- - Keep core types: doctor, nurse, admin, receptionist
-- - Update constraint chk_staff_type
--
-- Extensibility: Can be extended later by:
-- 1. ALTER TABLE ... DROP CONSTRAINT chk_staff_type
-- 2. ALTER TABLE ... ADD CONSTRAINT chk_staff_type CHECK (staff_type IN (...))
-- 3. Add corresponding role in Identity Service (auth_schema.healthcare_roles)
--
-- Rollback: See rollback section at the end of this file

-- =====================================================
-- STEP 1: Check current staff_type distribution
-- =====================================================
DO $$
DECLARE
  v_doctor_count INTEGER;
  v_nurse_count INTEGER;
  v_technician_count INTEGER;
  v_pharmacist_count INTEGER;
  v_therapist_count INTEGER;
  v_admin_count INTEGER;
  v_receptionist_count INTEGER;
BEGIN
  -- Count records by staff_type
  SELECT COUNT(*) INTO v_doctor_count FROM provider_schema.staff_profiles WHERE staff_type = 'doctor';
  SELECT COUNT(*) INTO v_nurse_count FROM provider_schema.staff_profiles WHERE staff_type = 'nurse';
  SELECT COUNT(*) INTO v_technician_count FROM provider_schema.staff_profiles WHERE staff_type = 'technician';
  SELECT COUNT(*) INTO v_pharmacist_count FROM provider_schema.staff_profiles WHERE staff_type = 'pharmacist';
  SELECT COUNT(*) INTO v_therapist_count FROM provider_schema.staff_profiles WHERE staff_type = 'therapist';
  SELECT COUNT(*) INTO v_admin_count FROM provider_schema.staff_profiles WHERE staff_type = 'admin';
  SELECT COUNT(*) INTO v_receptionist_count FROM provider_schema.staff_profiles WHERE staff_type = 'receptionist';

  -- Log current distribution
  RAISE NOTICE 'Current staff_type distribution:';
  RAISE NOTICE '  doctor: %', v_doctor_count;
  RAISE NOTICE '  nurse: %', v_nurse_count;
  RAISE NOTICE '  technician: %', v_technician_count;
  RAISE NOTICE '  pharmacist: %', v_pharmacist_count;
  RAISE NOTICE '  therapist: %', v_therapist_count;
  RAISE NOTICE '  admin: %', v_admin_count;
  RAISE NOTICE '  receptionist: %', v_receptionist_count;

  -- Check if there are any records with types to be removed
  IF v_technician_count > 0 OR v_pharmacist_count > 0 OR v_therapist_count > 0 THEN
    RAISE EXCEPTION 'Cannot proceed: Found % technician, % pharmacist, % therapist records. Please migrate or delete these records first.',
      v_technician_count, v_pharmacist_count, v_therapist_count;
  END IF;

  RAISE NOTICE 'Pre-migration check passed: No records with removed staff types found.';
END $$;

-- =====================================================
-- STEP 2: Drop old constraint
-- =====================================================
DO $$
BEGIN
  ALTER TABLE provider_schema.staff_profiles
  DROP CONSTRAINT IF EXISTS chk_staff_type;

  RAISE NOTICE 'Dropped old chk_staff_type constraint';
END $$;

-- =====================================================
-- STEP 3: Add new constraint with 4 core types
-- =====================================================
DO $$
BEGIN
  ALTER TABLE provider_schema.staff_profiles
  ADD CONSTRAINT chk_staff_type
  CHECK (staff_type IN ('doctor', 'nurse', 'admin', 'receptionist'));

  RAISE NOTICE 'Added new chk_staff_type constraint with 4 core types';
END $$;

-- =====================================================
-- STEP 4: Verify migration
-- =====================================================
DO $$
DECLARE
  v_total_count INTEGER;
  v_valid_count INTEGER;
BEGIN
  -- Count total records
  SELECT COUNT(*) INTO v_total_count FROM provider_schema.staff_profiles;
  
  -- Count records with valid staff_type
  SELECT COUNT(*) INTO v_valid_count 
  FROM provider_schema.staff_profiles 
  WHERE staff_type IN ('doctor', 'nurse', 'admin', 'receptionist');

  RAISE NOTICE 'Post-migration verification:';
  RAISE NOTICE '  Total records: %', v_total_count;
  RAISE NOTICE '  Valid records: %', v_valid_count;

  IF v_total_count != v_valid_count THEN
    RAISE EXCEPTION 'Migration verification failed: % total records but only % valid records',
      v_total_count, v_valid_count;
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
END $$;

-- =====================================================
-- STEP 5: Update table comment
-- =====================================================
DO $$
BEGIN
  COMMENT ON TABLE provider_schema.staff_profiles IS
  'Main aggregate root for all healthcare provider staff (4 core types: doctor, nurse, admin, receptionist)';

  COMMENT ON COLUMN provider_schema.staff_profiles.staff_type IS
  'Type of staff (4 core types - extensible): doctor, nurse, admin, receptionist';

  RAISE NOTICE 'Updated table and column comments';
END $$;

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
-- To rollback this migration, run:
--
-- ALTER TABLE provider_schema.staff_profiles DROP CONSTRAINT chk_staff_type;
-- ALTER TABLE provider_schema.staff_profiles ADD CONSTRAINT chk_staff_type 
-- CHECK (staff_type IN ('doctor', 'nurse', 'technician', 'pharmacist', 'therapist', 'admin', 'receptionist'));
--
-- COMMENT ON TABLE provider_schema.staff_profiles IS 
-- 'Main aggregate root for all healthcare provider staff (doctors, nurses, technicians, etc.)';
--
-- COMMENT ON COLUMN provider_schema.staff_profiles.staff_type IS 
-- 'Type of staff: doctor, nurse, technician, pharmacist, therapist, admin, receptionist';

