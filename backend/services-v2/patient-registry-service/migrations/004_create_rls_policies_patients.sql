-- Migration: Create RLS Policies for Patients Table
-- Description: Implement role-based access control for patients table
-- Author: Hospital Management System V2 Team
-- Date: 2025-01-07
-- Version: 1.0.0

-- ============================================================================
-- HELPER FUNCTION: Get User Role
-- ============================================================================

CREATE OR REPLACE FUNCTION patient_schema.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role_type INTO user_role
  FROM auth_schema.user_profiles
  WHERE id = user_uuid;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- Policy 1: Patients can view their own data
CREATE POLICY "patients_select_own" ON patient_schema.patients
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Policy 2: Doctors can view all patients
CREATE POLICY "patients_select_doctor" ON patient_schema.patients
  FOR SELECT
  USING (
    patient_schema.get_user_role(auth.uid()) = 'doctor'
  );

-- Policy 3: Nurses can view all patients
CREATE POLICY "patients_select_nurse" ON patient_schema.patients
  FOR SELECT
  USING (
    patient_schema.get_user_role(auth.uid()) = 'nurse'
  );

-- Policy 4: Admins can view all patients
CREATE POLICY "patients_select_admin" ON patient_schema.patients
  FOR SELECT
  USING (
    patient_schema.get_user_role(auth.uid()) = 'admin'
  );

-- Policy 5: Receptionists can view all patients
CREATE POLICY "patients_select_receptionist" ON patient_schema.patients
  FOR SELECT
  USING (
    patient_schema.get_user_role(auth.uid()) = 'receptionist'
  );

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Policy 6: Patients can register themselves
CREATE POLICY "patients_insert_own" ON patient_schema.patients
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy 7: Admins can register patients
CREATE POLICY "patients_insert_admin" ON patient_schema.patients
  FOR INSERT
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) = 'admin'
  );

-- Policy 8: Receptionists can register patients
CREATE POLICY "patients_insert_receptionist" ON patient_schema.patients
  FOR INSERT
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) = 'receptionist'
  );

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Policy 9: Patients can update their own data
CREATE POLICY "patients_update_own" ON patient_schema.patients
  FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy 10: Doctors can update patient data
CREATE POLICY "patients_update_doctor" ON patient_schema.patients
  FOR UPDATE
  USING (
    patient_schema.get_user_role(auth.uid()) = 'doctor'
  )
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) = 'doctor'
  );

-- Policy 11: Nurses can update patient data
CREATE POLICY "patients_update_nurse" ON patient_schema.patients
  FOR UPDATE
  USING (
    patient_schema.get_user_role(auth.uid()) = 'nurse'
  )
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) = 'nurse'
  );

-- Policy 12: Admins can update patient data
CREATE POLICY "patients_update_admin" ON patient_schema.patients
  FOR UPDATE
  USING (
    patient_schema.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) = 'admin'
  );

-- Policy 13: Receptionists can update patient data
CREATE POLICY "patients_update_receptionist" ON patient_schema.patients
  FOR UPDATE
  USING (
    patient_schema.get_user_role(auth.uid()) = 'receptionist'
  )
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) = 'receptionist'
  );

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- Policy 14: Only admins can delete patients (soft delete)
CREATE POLICY "patients_delete_admin" ON patient_schema.patients
  FOR DELETE
  USING (
    patient_schema.get_user_role(auth.uid()) = 'admin'
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies are created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'patient_schema'
    AND tablename = 'patients';
  
  IF policy_count != 14 THEN
    RAISE EXCEPTION 'Expected 14 policies, got %', policy_count;
  END IF;
  
  RAISE NOTICE 'Successfully created 14 RLS policies for patients table';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

-- To rollback this migration, run:
-- DROP POLICY IF EXISTS "patients_select_own" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_select_doctor" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_select_nurse" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_select_admin" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_select_receptionist" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_insert_own" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_insert_admin" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_insert_receptionist" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_update_own" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_update_doctor" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_update_nurse" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_update_admin" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_update_receptionist" ON patient_schema.patients;
-- DROP POLICY IF EXISTS "patients_delete_admin" ON patient_schema.patients;
-- DROP FUNCTION IF EXISTS patient_schema.get_user_role(UUID);

