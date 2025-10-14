-- Migration: Create RLS Policies for Related Patient Tables
-- Description: Implement role-based access control for insurance_info, emergency_contacts, patient_consents, patient_links
-- Author: Hospital Management System V2 Team
-- Date: 2025-01-07
-- Version: 1.0.0

-- ============================================================================
-- INSURANCE_INFO TABLE POLICIES
-- ============================================================================

-- SELECT: Patient can view own insurance, staff can view all
CREATE POLICY "insurance_select_own" ON patient_schema.insurance_info
  FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "insurance_select_staff" ON patient_schema.insurance_info
  FOR SELECT
  USING (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'nurse', 'admin', 'receptionist')
  );

-- INSERT: Patient can add own insurance, staff can add for any patient
CREATE POLICY "insurance_insert_own" ON patient_schema.insurance_info
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "insurance_insert_staff" ON patient_schema.insurance_info
  FOR INSERT
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) IN ('admin', 'receptionist')
  );

-- UPDATE: Patient can update own insurance, staff can update any
CREATE POLICY "insurance_update_own" ON patient_schema.insurance_info
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "insurance_update_staff" ON patient_schema.insurance_info
  FOR UPDATE
  USING (
    patient_schema.get_user_role(auth.uid()) IN ('admin', 'receptionist')
  )
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) IN ('admin', 'receptionist')
  );

-- DELETE: Only admin can delete
CREATE POLICY "insurance_delete_admin" ON patient_schema.insurance_info
  FOR DELETE
  USING (
    patient_schema.get_user_role(auth.uid()) = 'admin'
  );

-- ============================================================================
-- EMERGENCY_CONTACTS TABLE POLICIES
-- ============================================================================

-- SELECT: Patient can view own contacts, staff can view all
CREATE POLICY "emergency_select_own" ON patient_schema.emergency_contacts
  FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "emergency_select_staff" ON patient_schema.emergency_contacts
  FOR SELECT
  USING (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'nurse', 'admin', 'receptionist')
  );

-- INSERT: Patient can add own contacts, staff can add for any patient
CREATE POLICY "emergency_insert_own" ON patient_schema.emergency_contacts
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "emergency_insert_staff" ON patient_schema.emergency_contacts
  FOR INSERT
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) IN ('admin', 'receptionist')
  );

-- UPDATE: Patient can update own contacts, staff can update any
CREATE POLICY "emergency_update_own" ON patient_schema.emergency_contacts
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "emergency_update_staff" ON patient_schema.emergency_contacts
  FOR UPDATE
  USING (
    patient_schema.get_user_role(auth.uid()) IN ('admin', 'receptionist')
  )
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) IN ('admin', 'receptionist')
  );

-- DELETE: Only admin can delete
CREATE POLICY "emergency_delete_admin" ON patient_schema.emergency_contacts
  FOR DELETE
  USING (
    patient_schema.get_user_role(auth.uid()) = 'admin'
  );

-- ============================================================================
-- PATIENT_CONSENTS TABLE POLICIES (HIPAA Compliance)
-- ============================================================================

-- SELECT: Patient can view own consents, staff can view all
CREATE POLICY "consents_select_own" ON patient_schema.patient_consents
  FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "consents_select_staff" ON patient_schema.patient_consents
  FOR SELECT
  USING (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'nurse', 'admin', 'receptionist')
  );

-- INSERT: Patient can grant own consents, staff can record consents
CREATE POLICY "consents_insert_own" ON patient_schema.patient_consents
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "consents_insert_staff" ON patient_schema.patient_consents
  FOR INSERT
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'admin', 'receptionist')
  );

-- UPDATE: Patient can revoke own consents, staff can update consent status
CREATE POLICY "consents_update_own" ON patient_schema.patient_consents
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "consents_update_staff" ON patient_schema.patient_consents
  FOR UPDATE
  USING (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'admin')
  )
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'admin')
  );

-- DELETE: Only admin can delete (audit trail preservation)
CREATE POLICY "consents_delete_admin" ON patient_schema.patient_consents
  FOR DELETE
  USING (
    patient_schema.get_user_role(auth.uid()) = 'admin'
  );

-- ============================================================================
-- PATIENT_LINKS TABLE POLICIES (FHIR Compliance)
-- ============================================================================

-- SELECT: Patient can view own links, staff can view all
CREATE POLICY "links_select_own" ON patient_schema.patient_links
  FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
    OR
    other_patient_id IN (
      SELECT patient_id FROM patient_schema.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "links_select_staff" ON patient_schema.patient_links
  FOR SELECT
  USING (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'nurse', 'admin', 'receptionist')
  );

-- INSERT: Only staff can create patient links
CREATE POLICY "links_insert_staff" ON patient_schema.patient_links
  FOR INSERT
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'admin')
  );

-- UPDATE: Only staff can update patient links
CREATE POLICY "links_update_staff" ON patient_schema.patient_links
  FOR UPDATE
  USING (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'admin')
  )
  WITH CHECK (
    patient_schema.get_user_role(auth.uid()) IN ('doctor', 'admin')
  );

-- DELETE: Only admin can delete
CREATE POLICY "links_delete_admin" ON patient_schema.patient_links
  FOR DELETE
  USING (
    patient_schema.get_user_role(auth.uid()) = 'admin'
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  insurance_count INTEGER;
  emergency_count INTEGER;
  consents_count INTEGER;
  links_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO insurance_count FROM pg_policies WHERE schemaname = 'patient_schema' AND tablename = 'insurance_info';
  SELECT COUNT(*) INTO emergency_count FROM pg_policies WHERE schemaname = 'patient_schema' AND tablename = 'emergency_contacts';
  SELECT COUNT(*) INTO consents_count FROM pg_policies WHERE schemaname = 'patient_schema' AND tablename = 'patient_consents';
  SELECT COUNT(*) INTO links_count FROM pg_policies WHERE schemaname = 'patient_schema' AND tablename = 'patient_links';
  
  RAISE NOTICE 'insurance_info: % policies', insurance_count;
  RAISE NOTICE 'emergency_contacts: % policies', emergency_count;
  RAISE NOTICE 'patient_consents: % policies', consents_count;
  RAISE NOTICE 'patient_links: % policies', links_count;
  
  IF insurance_count != 7 OR emergency_count != 7 OR consents_count != 7 OR links_count != 5 THEN
    RAISE EXCEPTION 'Policy count mismatch';
  END IF;
  
  RAISE NOTICE 'Successfully created all RLS policies for related tables';
END $$;

