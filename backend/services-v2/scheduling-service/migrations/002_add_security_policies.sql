-- =====================================================================================
-- SCHEDULING SERVICE - SECURITY HARDENING
-- Migration 002: Add RLS Policies for All Tables
-- =====================================================================================
-- Author: Hospital Management Team
-- Version: 3.0.1
-- Date: 2025-01-07
-- Compliance: HIPAA, Security Best Practices
-- =====================================================================================

-- =====================================================================================
-- 1. ADD ADMIN POLICY FOR APPOINTMENTS
-- =====================================================================================

-- Admin can view all appointments
CREATE POLICY "admins_view_all_appointments"
  ON scheduling_schema.appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Admin can manage all appointments
CREATE POLICY "admins_manage_all_appointments"
  ON scheduling_schema.appointments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- =====================================================================================
-- 2. ENABLE RLS ON REMAINING TABLES
-- =====================================================================================

ALTER TABLE scheduling_schema.appointment_read_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_schema.appointment_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_schema.phi_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_schema.waiting_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_schema.appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_schema.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_schema.appointment_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- 3. ADD POLICIES FOR APPOINTMENT_READ_MODEL
-- =====================================================================================

-- Service role full access
CREATE POLICY "service_role_full_access_read_model"
  ON scheduling_schema.appointment_read_model
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Patients view own appointments
CREATE POLICY "patients_view_own_appointments_read_model"
  ON scheduling_schema.appointment_read_model
  FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients 
      WHERE user_id = auth.uid()
    )
  );

-- Doctors view own appointments
CREATE POLICY "doctors_view_own_appointments_read_model"
  ON scheduling_schema.appointment_read_model
  FOR SELECT
  USING (
    doctor_id IN (
      SELECT provider_id FROM provider_schema.providers 
      WHERE user_id = auth.uid()
    )
  );

-- Admins view all
CREATE POLICY "admins_view_all_read_model"
  ON scheduling_schema.appointment_read_model
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- =====================================================================================
-- 4. ADD POLICIES FOR APPOINTMENT_AUDIT_LOGS
-- =====================================================================================

-- Service role full access
CREATE POLICY "service_role_full_access_audit_logs"
  ON scheduling_schema.appointment_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Only admins can view audit logs
CREATE POLICY "admins_view_audit_logs"
  ON scheduling_schema.appointment_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- =====================================================================================
-- 5. ADD POLICIES FOR PHI_ACCESS_LOGS
-- =====================================================================================

-- Service role full access
CREATE POLICY "service_role_full_access_phi_logs"
  ON scheduling_schema.phi_access_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Only admins can view PHI access logs
CREATE POLICY "admins_view_phi_logs"
  ON scheduling_schema.phi_access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- =====================================================================================
-- 6. ADD POLICIES FOR WAITING_QUEUE
-- =====================================================================================

-- Service role full access
CREATE POLICY "service_role_full_access_queue"
  ON scheduling_schema.waiting_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Patients view own queue entries
CREATE POLICY "patients_view_own_queue"
  ON scheduling_schema.waiting_queue
  FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients 
      WHERE user_id = auth.uid()
    )
  );

-- Doctors view own queue
CREATE POLICY "doctors_view_own_queue"
  ON scheduling_schema.waiting_queue
  FOR SELECT
  USING (
    doctor_id IN (
      SELECT provider_id FROM provider_schema.providers 
      WHERE user_id = auth.uid()
    )
  );

-- Admins view all queue
CREATE POLICY "admins_view_all_queue"
  ON scheduling_schema.waiting_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- =====================================================================================
-- 7. ADD POLICIES FOR APPOINTMENT_SLOTS
-- =====================================================================================

-- Service role full access
CREATE POLICY "service_role_full_access_slots"
  ON scheduling_schema.appointment_slots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Everyone can view available slots
CREATE POLICY "public_view_available_slots"
  ON scheduling_schema.appointment_slots
  FOR SELECT
  USING (is_available = true);

-- Doctors manage own slots
CREATE POLICY "doctors_manage_own_slots"
  ON scheduling_schema.appointment_slots
  FOR ALL
  USING (
    doctor_id IN (
      SELECT provider_id FROM provider_schema.providers 
      WHERE user_id = auth.uid()
    )
  );

-- Admins manage all slots
CREATE POLICY "admins_manage_all_slots"
  ON scheduling_schema.appointment_slots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- =====================================================================================
-- 8. ADD POLICIES FOR APPOINTMENT_TYPES (Reference Data)
-- =====================================================================================

-- Service role full access
CREATE POLICY "service_role_full_access_types"
  ON scheduling_schema.appointment_types
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Everyone can view active types
CREATE POLICY "public_view_active_types"
  ON scheduling_schema.appointment_types
  FOR SELECT
  USING (is_active = true);

-- Admins manage types
CREATE POLICY "admins_manage_types"
  ON scheduling_schema.appointment_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- =====================================================================================
-- 9. ADD POLICIES FOR APPOINTMENT_TEMPLATES
-- =====================================================================================

-- Service role full access
CREATE POLICY "service_role_full_access_templates"
  ON scheduling_schema.appointment_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Doctors view/manage own templates
CREATE POLICY "doctors_manage_own_templates"
  ON scheduling_schema.appointment_templates
  FOR ALL
  USING (
    doctor_id IN (
      SELECT provider_id FROM provider_schema.providers 
      WHERE user_id = auth.uid()
    )
  );

-- Admins manage all templates
CREATE POLICY "admins_manage_all_templates"
  ON scheduling_schema.appointment_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- =====================================================================================
-- END OF MIGRATION 002
-- =====================================================================================

