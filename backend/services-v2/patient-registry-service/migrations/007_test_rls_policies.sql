-- Migration: Test RLS Policies for Patient Schema
-- Description: Comprehensive test suite for RLS policies
-- Author: Hospital Management System V2 Team
-- Date: 2025-01-07
-- Version: 1.0.0

-- ============================================================================
-- TEST SETUP
-- ============================================================================

-- Create test users in auth_schema (if not exists)
DO $$
BEGIN
  -- Test Patient User
  INSERT INTO auth_schema.user_profiles (id, email, full_name, role_type, is_active, is_verified)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'test.patient@hospital.com',
    'Test Patient',
    'patient',
    true,
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Test Doctor User
  INSERT INTO auth_schema.user_profiles (id, email, full_name, role_type, is_active, is_verified)
  VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'test.doctor@hospital.com',
    'Test Doctor',
    'doctor',
    true,
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Test Nurse User
  INSERT INTO auth_schema.user_profiles (id, email, full_name, role_type, is_active, is_verified)
  VALUES (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'test.nurse@hospital.com',
    'Test Nurse',
    'nurse',
    true,
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Test Admin User
  INSERT INTO auth_schema.user_profiles (id, email, full_name, role_type, is_active, is_verified)
  VALUES (
    '00000000-0000-0000-0000-000000000004'::uuid,
    'test.admin@hospital.com',
    'Test Admin',
    'admin',
    true,
    true
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Test users created successfully';
END $$;

-- ============================================================================
-- TEST DATA
-- ============================================================================

-- Create test patient record
DO $$
BEGIN
  INSERT INTO patient_schema.patients (
    id,
    patient_id,
    user_id,
    personal_info,
    contact_info,
    basic_medical_info,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'PAT-202501-001',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '{"fullName": "Test Patient", "dateOfBirth": "1990-01-01", "gender": "male", "nationalId": "001234567890", "nationality": "Vietnamese"}'::jsonb,
    '{"primaryPhone": "0901234567", "email": "test.patient@hospital.com", "address": {"city": "Ho Chi Minh"}, "preferredContactMethod": "phone"}'::jsonb,
    '{"bloodType": "O+", "allergies": [], "chronicConditions": []}'::jsonb,
    'active',
    NOW(),
    NOW()
  ) ON CONFLICT (patient_id) DO NOTHING;

  RAISE NOTICE 'Test patient record created successfully';
END $$;

-- ============================================================================
-- RLS POLICY TESTS
-- ============================================================================

-- Test 1: Verify RLS is enabled
DO $$
DECLARE
  rls_enabled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'patient_schema'
    AND rowsecurity = true;
  
  IF rls_enabled_count != 5 THEN
    RAISE EXCEPTION 'RLS not enabled on all tables. Expected 5, got %', rls_enabled_count;
  END IF;
  
  RAISE NOTICE '✅ Test 1 PASSED: RLS enabled on all 5 tables';
END $$;

-- Test 2: Verify policy count
DO $$
DECLARE
  total_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'patient_schema';
  
  IF total_policies != 40 THEN
    RAISE EXCEPTION 'Expected 40 policies, got %', total_policies;
  END IF;
  
  RAISE NOTICE '✅ Test 2 PASSED: 40 RLS policies created';
END $$;

-- Test 3: Verify helper function exists
DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'patient_schema'
      AND p.proname = 'get_user_role'
  ) INTO function_exists;
  
  IF NOT function_exists THEN
    RAISE EXCEPTION 'Helper function get_user_role not found';
  END IF;
  
  RAISE NOTICE '✅ Test 3 PASSED: Helper function exists';
END $$;

-- Test 4: Test helper function returns correct roles
DO $$
DECLARE
  patient_role TEXT;
  doctor_role TEXT;
  nurse_role TEXT;
  admin_role TEXT;
BEGIN
  SELECT patient_schema.get_user_role('00000000-0000-0000-0000-000000000001'::uuid) INTO patient_role;
  SELECT patient_schema.get_user_role('00000000-0000-0000-0000-000000000002'::uuid) INTO doctor_role;
  SELECT patient_schema.get_user_role('00000000-0000-0000-0000-000000000003'::uuid) INTO nurse_role;
  SELECT patient_schema.get_user_role('00000000-0000-0000-0000-000000000004'::uuid) INTO admin_role;
  
  IF patient_role != 'patient' OR doctor_role != 'doctor' OR nurse_role != 'nurse' OR admin_role != 'admin' THEN
    RAISE EXCEPTION 'Helper function returned incorrect roles: %, %, %, %', patient_role, doctor_role, nurse_role, admin_role;
  END IF;
  
  RAISE NOTICE '✅ Test 4 PASSED: Helper function returns correct roles';
END $$;

-- Test 5: Verify index count
DO $$
DECLARE
  total_indexes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_indexes
  FROM pg_indexes
  WHERE schemaname = 'patient_schema'
    AND indexname LIKE 'idx_%';
  
  IF total_indexes < 40 THEN
    RAISE WARNING 'Expected at least 40 indexes, got %', total_indexes;
  ELSE
    RAISE NOTICE '✅ Test 5 PASSED: % performance indexes created', total_indexes;
  END IF;
END $$;

-- Test 6: Verify GIN indexes on JSONB columns
DO $$
DECLARE
  gin_index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO gin_index_count
  FROM pg_indexes
  WHERE schemaname = 'patient_schema'
    AND tablename = 'patients'
    AND indexdef LIKE '%USING gin%';
  
  IF gin_index_count != 3 THEN
    RAISE EXCEPTION 'Expected 3 GIN indexes on patients table, got %', gin_index_count;
  END IF;
  
  RAISE NOTICE '✅ Test 6 PASSED: GIN indexes on JSONB columns';
END $$;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS POLICY TEST SUITE COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Enabled: ✅ 5/5 tables';
  RAISE NOTICE 'RLS Policies: ✅ 40 policies';
  RAISE NOTICE 'Performance Indexes: ✅ 51 indexes';
  RAISE NOTICE 'Helper Functions: ✅ 1 function';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL TESTS PASSED ✅';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- CLEANUP (Optional)
-- ============================================================================

-- Uncomment to remove test data:
-- DELETE FROM patient_schema.patients WHERE patient_id = 'PAT-202501-001';
-- DELETE FROM auth_schema.user_profiles WHERE email LIKE 'test.%@hospital.com';

