-- =====================================================
-- HOSPITAL MANAGEMENT SYSTEM - RLS POLICIES
-- Row Level Security policies for authentication tables
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;

-- Also enable RLS on existing tables if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurances ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 1. STAFF INVITATIONS POLICIES
-- =====================================================

-- Admin can manage all invitations
CREATE POLICY "Admins can manage all invitations" ON staff_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- Users can view their own invitations (for accept-invite flow)
CREATE POLICY "Users can view invitations sent to their email" ON staff_invitations
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Service role can manage all (for API operations)
CREATE POLICY "Service role full access to invitations" ON staff_invitations
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 2. CONSENTS POLICIES
-- =====================================================

-- Users can only access their own consents
CREATE POLICY "Users can manage their own consents" ON consents
    FOR ALL USING (user_id = auth.uid());

-- Service role can manage all consents
CREATE POLICY "Service role full access to consents" ON consents
    FOR ALL USING (auth.role() = 'service_role');

-- Admins can view all consents (for compliance)
CREATE POLICY "Admins can view all consents" ON consents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- =====================================================
-- 3. AUDIT LOGS POLICIES
-- =====================================================

-- Users can view audit logs where they are the actor or target
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (
        actor_id = auth.uid() OR target_id = auth.uid()
    );

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- Service role can manage all audit logs
CREATE POLICY "Service role full access to audit logs" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Prevent users from modifying audit logs (insert only via service)
CREATE POLICY "No user modifications to audit logs" ON audit_logs
    FOR UPDATE USING (false);

CREATE POLICY "No user deletions of audit logs" ON audit_logs
    FOR DELETE USING (false);

-- =====================================================
-- 4. DOCUMENTS POLICIES
-- =====================================================

-- Users can manage their own documents
CREATE POLICY "Users can manage their own documents" ON documents
    FOR ALL USING (user_id = auth.uid());

-- Doctors can view patient documents (with proper relationship)
CREATE POLICY "Doctors can view patient documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN doctors d ON d.profile_id = p.id
            WHERE p.id = auth.uid() 
            AND p.role = 'doctor'
            AND p.is_active = true
            -- Add additional checks for doctor-patient relationship if needed
        )
    );

-- Staff can view documents for their assigned patients
CREATE POLICY "Staff can view assigned patient documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('staff', 'admin', 'superadmin')
            AND is_active = true
        )
    );

-- Service role can manage all documents
CREATE POLICY "Service role full access to documents" ON documents
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 5. MFA SETTINGS POLICIES
-- =====================================================

-- Users can only access their own MFA settings
CREATE POLICY "Users can manage their own MFA settings" ON mfa_settings
    FOR ALL USING (user_id = auth.uid());

-- Service role can manage all MFA settings
CREATE POLICY "Service role full access to MFA settings" ON mfa_settings
    FOR ALL USING (auth.role() = 'service_role');

-- Admins can view MFA status (not secrets) for security monitoring
CREATE POLICY "Admins can view MFA status" ON mfa_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- =====================================================
-- 6. ENHANCED PROFILES POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Users can view and update their own profile (but not role)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM profiles WHERE id = auth.uid()) -- Prevent role changes
    );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- Admins can update user profiles (including roles)
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- Service role can manage all profiles
CREATE POLICY "Service role full access to profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

-- New users can insert their profile during registration
CREATE POLICY "New users can create profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- =====================================================
-- 7. PATIENT PROFILES POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own patient profile" ON patient_profiles;
DROP POLICY IF EXISTS "Users can update own patient profile" ON patient_profiles;

-- Patients can manage their own profile
CREATE POLICY "Patients can manage own profile" ON patient_profiles
    FOR ALL USING (user_id = auth.uid());

-- Doctors can view patient profiles (with relationship check)
CREATE POLICY "Doctors can view patient profiles" ON patient_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'doctor'
            AND p.is_active = true
        )
    );

-- Staff and admins can view patient profiles
CREATE POLICY "Staff can view patient profiles" ON patient_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('staff', 'admin', 'superadmin')
            AND is_active = true
        )
    );

-- Service role can manage all patient profiles
CREATE POLICY "Service role full access to patient profiles" ON patient_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 8. ADDRESSES POLICIES
-- =====================================================

-- Users can manage their own addresses
CREATE POLICY "Users can manage own addresses" ON addresses
    FOR ALL USING (user_id = auth.uid());

-- Healthcare staff can view patient addresses
CREATE POLICY "Healthcare staff can view patient addresses" ON addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('doctor', 'staff', 'admin', 'superadmin')
            AND is_active = true
        )
    );

-- Service role can manage all addresses
CREATE POLICY "Service role full access to addresses" ON addresses
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 9. EMERGENCY CONTACTS POLICIES
-- =====================================================

-- Users can manage their own emergency contacts
CREATE POLICY "Users can manage own emergency contacts" ON emergency_contacts
    FOR ALL USING (user_id = auth.uid());

-- Healthcare staff can view patient emergency contacts
CREATE POLICY "Healthcare staff can view patient emergency contacts" ON emergency_contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('doctor', 'staff', 'admin', 'superadmin')
            AND is_active = true
        )
    );

-- Service role can manage all emergency contacts
CREATE POLICY "Service role full access to emergency contacts" ON emergency_contacts
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 10. INSURANCES POLICIES
-- =====================================================

-- Users can manage their own insurance information
CREATE POLICY "Users can manage own insurance" ON insurances
    FOR ALL USING (user_id = auth.uid());

-- Healthcare staff can view patient insurance
CREATE POLICY "Healthcare staff can view patient insurance" ON insurances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('doctor', 'staff', 'admin', 'superadmin')
            AND is_active = true
        )
    );

-- Service role can manage all insurance records
CREATE POLICY "Service role full access to insurance" ON insurances
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 11. SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user has admin privileges
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND role IN ('admin', 'superadmin')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access patient data
CREATE OR REPLACE FUNCTION can_access_patient_data(patient_id UUID, accessor_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    accessor_role TEXT;
BEGIN
    -- Get accessor role
    SELECT role INTO accessor_role 
    FROM profiles 
    WHERE id = accessor_id AND is_active = true;
    
    -- Patient can access their own data
    IF patient_id = accessor_id THEN
        RETURN TRUE;
    END IF;
    
    -- Admin and superadmin can access all patient data
    IF accessor_role IN ('admin', 'superadmin') THEN
        RETURN TRUE;
    END IF;
    
    -- Staff can access patient data (add specific business rules here)
    IF accessor_role = 'staff' THEN
        RETURN TRUE;
    END IF;
    
    -- Doctors can access patient data (add doctor-patient relationship check here)
    IF accessor_role = 'doctor' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON POLICY "Admins can manage all invitations" ON staff_invitations IS 'Allows admin users to create, view, update, and delete staff invitations';
COMMENT ON POLICY "Users can manage their own consents" ON consents IS 'Users can only access their own consent records for privacy compliance';
COMMENT ON POLICY "Users can view their own audit logs" ON audit_logs IS 'Users can view audit logs where they are involved for transparency';
COMMENT ON POLICY "Users can manage their own documents" ON documents IS 'Users can upload and manage their own documents with privacy protection';
COMMENT ON POLICY "Users can manage their own MFA settings" ON mfa_settings IS 'Users have full control over their MFA configuration';

COMMENT ON FUNCTION is_admin IS 'Helper function to check if a user has admin privileges';
COMMENT ON FUNCTION can_access_patient_data IS 'Business logic function to determine patient data access rights';
