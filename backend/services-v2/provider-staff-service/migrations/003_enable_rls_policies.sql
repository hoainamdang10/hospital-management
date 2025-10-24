-- =====================================================
-- Migration: 003_enable_rls_policies.sql
-- Description: Enable Row Level Security (RLS) policies for HIPAA compliance
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Date: 2025-01-20
-- Compliance: HIPAA, Vietnamese Healthcare Standards
-- =====================================================

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE provider_schema.staff_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Policy 1: Service Role Full Access
-- Service role (backend services) can do everything
CREATE POLICY "service_role_all_staff_profiles" 
ON provider_schema.staff_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated Users View Active Staff
-- Authenticated users can view active staff profiles
CREATE POLICY "authenticated_view_active_staff" 
ON provider_schema.staff_profiles
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND status = 'active'
);

-- Policy 3: Staff Own Profile Access
-- Staff can view and update their own profile
CREATE POLICY "staff_own_profile" 
ON provider_schema.staff_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admin Full Access
-- Users with admin role can access all staff profiles
-- Note: This requires auth.jwt() to contain role claim
CREATE POLICY "admin_all_staff_profiles" 
ON provider_schema.staff_profiles
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text IN ('SUPER_ADMIN', 'ADMIN')
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text IN ('SUPER_ADMIN', 'ADMIN')
);

-- Policy 5: Doctor View Other Doctors
-- Doctors can view other active doctors (for collaboration)
CREATE POLICY "doctor_view_other_doctors" 
ON provider_schema.staff_profiles
FOR SELECT
TO authenticated
USING (
  staff_type = 'doctor' 
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM provider_schema.staff_profiles AS own_profile
    WHERE own_profile.user_id = auth.uid()
    AND own_profile.staff_type = 'doctor'
    AND own_profile.is_active = true
  )
);

-- Policy 6: Department Manager Access
-- Department managers can view staff in their department
-- Note: Requires department_assignments JSONB to contain manager flag
CREATE POLICY "department_manager_view_staff" 
ON provider_schema.staff_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM provider_schema.staff_profiles AS manager_profile
    WHERE manager_profile.user_id = auth.uid()
    AND manager_profile.is_active = true
    AND manager_profile.department_assignments @> 
      jsonb_build_array(
        jsonb_build_object(
          'departmentId', 
          (staff_profiles.department_assignments->0->>'departmentId')::text,
          'role', 'manager'
        )
      )
  )
);

-- =====================================================
-- AUDIT LOGGING TRIGGER
-- =====================================================

-- Create audit log function
CREATE OR REPLACE FUNCTION provider_schema.audit_staff_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert audit log for UPDATE operations
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (
      service_name,
      action,
      resource_type,
      resource_id,
      user_id,
      timestamp,
      details,
      compliance_level,
      contains_phi
    ) VALUES (
      'provider-staff-service',
      'UPDATE_STAFF_PROFILE',
      'ProviderStaff',
      NEW.staff_id,
      NEW.updated_by,
      NOW(),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_employment_type', OLD.employment_type,
        'new_employment_type', NEW.employment_type,
        'updated_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
        )
      ),
      'hipaa',
      true
    );
    RETURN NEW;
  
  -- Insert audit log for DELETE operations
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (
      service_name,
      action,
      resource_type,
      resource_id,
      user_id,
      timestamp,
      details,
      compliance_level,
      contains_phi
    ) VALUES (
      'provider-staff-service',
      'DELETE_STAFF_PROFILE',
      'ProviderStaff',
      OLD.staff_id,
      OLD.updated_by,
      NOW(),
      jsonb_build_object(
        'staff_type', OLD.staff_type,
        'status', OLD.status,
        'deleted_at', NOW()
      ),
      'hipaa',
      true
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS audit_staff_changes_trigger ON provider_schema.staff_profiles;
CREATE TRIGGER audit_staff_changes_trigger
AFTER UPDATE OR DELETE ON provider_schema.staff_profiles
FOR EACH ROW
EXECUTE FUNCTION provider_schema.audit_staff_changes();

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

-- Create updated_at function
CREATE OR REPLACE FUNCTION provider_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_staff_profiles_updated_at ON provider_schema.staff_profiles;
CREATE TRIGGER update_staff_profiles_updated_at
BEFORE UPDATE ON provider_schema.staff_profiles
FOR EACH ROW
EXECUTE FUNCTION provider_schema.update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY "service_role_all_staff_profiles" ON provider_schema.staff_profiles IS 'Backend services have full access';
COMMENT ON POLICY "authenticated_view_active_staff" ON provider_schema.staff_profiles IS 'Authenticated users can view active staff';
COMMENT ON POLICY "staff_own_profile" ON provider_schema.staff_profiles IS 'Staff can manage their own profile';
COMMENT ON POLICY "admin_all_staff_profiles" ON provider_schema.staff_profiles IS 'Admins have full access';

-- =====================================================
-- ROLLBACK
-- =====================================================
-- To rollback this migration:
-- DROP TRIGGER IF EXISTS audit_staff_changes_trigger ON provider_schema.staff_profiles;
-- DROP TRIGGER IF EXISTS update_staff_profiles_updated_at ON provider_schema.staff_profiles;
-- DROP FUNCTION IF EXISTS provider_schema.audit_staff_changes();
-- DROP FUNCTION IF EXISTS provider_schema.update_updated_at_column();
-- DROP POLICY IF EXISTS "service_role_all_staff_profiles" ON provider_schema.staff_profiles;
-- DROP POLICY IF EXISTS "authenticated_view_active_staff" ON provider_schema.staff_profiles;
-- DROP POLICY IF EXISTS "staff_own_profile" ON provider_schema.staff_profiles;
-- DROP POLICY IF EXISTS "admin_all_staff_profiles" ON provider_schema.staff_profiles;
-- DROP POLICY IF EXISTS "doctor_view_other_doctors" ON provider_schema.staff_profiles;
-- DROP POLICY IF EXISTS "department_manager_view_staff" ON provider_schema.staff_profiles;
-- ALTER TABLE provider_schema.staff_profiles DISABLE ROW LEVEL SECURITY;
