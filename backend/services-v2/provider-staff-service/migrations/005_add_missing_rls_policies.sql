/**
 * Migration: Add Missing RLS Policies
 * Provider Staff Service - Phase 1 Critical Fixes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @date 2025-01-07
 * @compliance HIPAA, Vietnamese Healthcare Standards, Security Best Practices
 * 
 * Description:
 * Adds 3 missing RLS policies to staff_profiles table:
 * 1. admin_all_staff_profiles - Full access for ADMIN and SUPER_ADMIN
 * 2. doctor_view_doctors - Allows doctors to view other doctors
 * 3. department_manager_access - Department managers can manage their staff
 */

-- ============================================================================
-- POLICY 1: Admin Full Access
-- ============================================================================

/**
 * Policy: admin_all_staff_profiles
 * Purpose: Grant full CRUD access to ADMIN and SUPER_ADMIN roles
 * Scope: ALL operations (SELECT, INSERT, UPDATE, DELETE)
 * Security: Checks user_roles table for admin privileges
 */
CREATE POLICY admin_all_staff_profiles ON provider_schema.staff_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_name IN ('ADMIN', 'SUPER_ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_name IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

COMMENT ON POLICY admin_all_staff_profiles ON provider_schema.staff_profiles IS 
  'Allows ADMIN and SUPER_ADMIN roles full access to all staff profiles for management purposes';

-- ============================================================================
-- POLICY 2: Doctor View Doctors
-- ============================================================================

/**
 * Policy: doctor_view_doctors
 * Purpose: Allow doctors to view profiles of other doctors
 * Scope: SELECT only
 * Security: Checks user has DOCTOR role and target is also a doctor
 * Use Case: Collaboration, referrals, consultation
 */
CREATE POLICY doctor_view_doctors ON provider_schema.staff_profiles
  FOR SELECT
  TO authenticated
  USING (
    staff_type = 'DOCTOR' 
    AND EXISTS (
      SELECT 1 FROM auth_schema.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_name = 'DOCTOR'
    )
  );

COMMENT ON POLICY doctor_view_doctors ON provider_schema.staff_profiles IS 
  'Allows doctors to view other doctors profiles for collaboration and referrals';

-- ============================================================================
-- POLICY 3: Department Manager Access
-- ============================================================================

/**
 * Policy: department_manager_access
 * Purpose: Allow department managers to manage staff in their department
 * Scope: ALL operations (SELECT, INSERT, UPDATE, DELETE)
 * Security: Checks manager position and department match
 * Positions: Department Head, Department Manager, Chief of Department
 */
CREATE POLICY department_manager_access ON provider_schema.staff_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM provider_schema.staff_profiles manager
      WHERE manager.user_id = auth.uid()
        AND manager.professional_info->>'position' IN ('Department Head', 'Department Manager', 'Chief of Department')
        AND manager.professional_info->>'department' = staff_profiles.professional_info->>'department'
        AND manager.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM provider_schema.staff_profiles manager
      WHERE manager.user_id = auth.uid()
        AND manager.professional_info->>'position' IN ('Department Head', 'Department Manager', 'Chief of Department')
        AND manager.professional_info->>'department' = staff_profiles.professional_info->>'department'
        AND manager.is_active = true
    )
  );

COMMENT ON POLICY department_manager_access ON provider_schema.staff_profiles IS 
  'Allows department managers to manage staff within their department';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

/**
 * Verify all RLS policies are in place
 * Expected: 6 policies total
 * 1. service_role_all_staff_profiles (existing)
 * 2. authenticated_view_active_staff (existing)
 * 3. staff_own_profile (existing)
 * 4. admin_all_staff_profiles (new)
 * 5. doctor_view_doctors (new)
 * 6. department_manager_access (new)
 */
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'provider_schema' 
    AND tablename = 'staff_profiles';
  
  IF policy_count < 6 THEN
    RAISE WARNING 'Expected 6 RLS policies, found %', policy_count;
  ELSE
    RAISE NOTICE 'RLS policies verified: % policies found', policy_count;
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

/**
 * To rollback this migration, run:
 * 
 * DROP POLICY IF EXISTS admin_all_staff_profiles ON provider_schema.staff_profiles;
 * DROP POLICY IF EXISTS doctor_view_doctors ON provider_schema.staff_profiles;
 * DROP POLICY IF EXISTS department_manager_access ON provider_schema.staff_profiles;
 */

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

/**
 * Security Considerations:
 * 
 * 1. Admin Access:
 *    - Only users with ADMIN or SUPER_ADMIN role can access all profiles
 *    - Role assignment is controlled by Identity Service
 *    - Audit logging tracks all admin actions
 * 
 * 2. Doctor Collaboration:
 *    - Doctors can only VIEW other doctors (read-only)
 *    - Cannot modify other doctors' profiles
 *    - Supports clinical collaboration workflows
 * 
 * 3. Department Management:
 *    - Managers can only manage staff in their own department
 *    - Position-based access control (Department Head, Manager, Chief)
 *    - Manager must be active to have access
 *    - Prevents cross-department unauthorized access
 * 
 * 4. Existing Policies:
 *    - service_role: Backend services have full access
 *    - authenticated_view_active_staff: All authenticated users can view active staff
 *    - staff_own_profile: Staff can manage their own profile
 * 
 * 5. HIPAA Compliance:
 *    - All access is logged via audit_logs table
 *    - PHI access tracked in phi_access_log
 *    - Role-based access control enforced at database level
 */

