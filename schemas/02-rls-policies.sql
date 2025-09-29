-- =====================================================
-- Hospital Management System - Row Level Security Policies
-- Secure access control for Supabase Free Tier
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Prevent role changes from client
        (OLD.role = NEW.role OR auth.jwt() ->> 'role' IN ('admin', 'superadmin'))
    );

-- Service role can do everything
CREATE POLICY "Service role full access" ON profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin') OR
        (auth.jwt() ->> 'role' = 'doctor' AND role = 'patient') OR
        (auth.jwt() ->> 'role' = 'staff' AND role = 'patient')
    );

-- Admins can update user roles and status
CREATE POLICY "Admins can update user roles" ON profiles
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- New users can insert their profile during registration
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id AND role = 'patient');

-- =====================================================
-- STAFF INVITATIONS POLICIES
-- =====================================================

-- Only admins can read invitations
CREATE POLICY "Admins can read invitations" ON staff_invitations
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations" ON staff_invitations
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Only admins can update invitations
CREATE POLICY "Admins can update invitations" ON staff_invitations
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Only admins can delete invitations
CREATE POLICY "Admins can delete invitations" ON staff_invitations
    FOR DELETE USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- Service role can access for invite acceptance
CREATE POLICY "Service role can access invitations" ON staff_invitations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- CONSENTS POLICIES
-- =====================================================

-- Users can read their own consents
CREATE POLICY "Users can read own consents" ON consents
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Users can insert own consents" ON consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents (revoke)
CREATE POLICY "Users can update own consents" ON consents
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can read all consents
CREATE POLICY "Admins can read all consents" ON consents
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- =====================================================
-- ADDRESSES POLICIES
-- =====================================================

-- Users can manage their own addresses
CREATE POLICY "Users can manage own addresses" ON addresses
    FOR ALL USING (auth.uid() = user_id);

-- Healthcare staff can read patient addresses
CREATE POLICY "Staff can read patient addresses" ON addresses
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('doctor', 'staff', 'admin', 'superadmin')
    );

-- =====================================================
-- EMERGENCY CONTACTS POLICIES
-- =====================================================

-- Users can manage their own emergency contacts
CREATE POLICY "Users can manage own emergency contacts" ON emergency_contacts
    FOR ALL USING (auth.uid() = user_id);

-- Healthcare staff can read patient emergency contacts
CREATE POLICY "Staff can read patient emergency contacts" ON emergency_contacts
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('doctor', 'staff', 'admin', 'superadmin')
    );

-- =====================================================
-- INSURANCES POLICIES
-- =====================================================

-- Users can manage their own insurance info
CREATE POLICY "Users can manage own insurances" ON insurances
    FOR ALL USING (auth.uid() = user_id);

-- Healthcare staff can read patient insurance info
CREATE POLICY "Staff can read patient insurances" ON insurances
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('doctor', 'staff', 'admin', 'superadmin')
    );

-- =====================================================
-- PATIENT PROFILES POLICIES
-- =====================================================

-- Users can manage their own patient profile
CREATE POLICY "Users can manage own patient profile" ON patient_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Healthcare staff can read patient profiles
CREATE POLICY "Staff can read patient profiles" ON patient_profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('doctor', 'staff', 'admin', 'superadmin')
    );

-- Doctors can update patient medical info
CREATE POLICY "Doctors can update patient medical info" ON patient_profiles
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('doctor', 'admin', 'superadmin')
    );

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================

-- Users can manage their own documents
CREATE POLICY "Users can manage own documents" ON documents
    FOR ALL USING (auth.uid() = user_id);

-- Healthcare staff can read patient documents
CREATE POLICY "Staff can read patient documents" ON documents
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('doctor', 'staff', 'admin', 'superadmin')
    );

-- Staff can verify documents
CREATE POLICY "Staff can verify documents" ON documents
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('staff', 'admin', 'superadmin')
    ) WITH CHECK (
        -- Only allow updating verification fields
        OLD.user_id = NEW.user_id AND
        OLD.document_type = NEW.document_type AND
        OLD.file_path = NEW.file_path
    );

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- No updates or deletes on audit logs (immutable)
-- (No policies = no access except for service role)

-- =====================================================
-- MFA SETTINGS POLICIES
-- =====================================================

-- Users can manage their own MFA settings
CREATE POLICY "Users can manage own MFA settings" ON mfa_settings
    FOR ALL USING (auth.uid() = user_id);

-- Admins can read MFA settings for support
CREATE POLICY "Admins can read MFA settings" ON mfa_settings
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'superadmin'));

-- =====================================================
-- STORAGE POLICIES (for file uploads)
-- =====================================================

-- Create storage bucket for documents if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder
CREATE POLICY "Users can upload own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        -- Validate file path structure: users/{user_id}/{type}/{uuid}.{ext}
        array_length(storage.foldername(name), 1) = 3
    );

-- Users can read their own documents
CREATE POLICY "Users can read own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own documents
CREATE POLICY "Users can update own documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Healthcare staff can read patient documents
CREATE POLICY "Staff can read patient documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        auth.jwt() ->> 'role' IN ('doctor', 'staff', 'admin', 'superadmin')
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION auth.has_role(required_role text)
RETURNS boolean AS $$
BEGIN
    RETURN auth.jwt() ->> 'role' = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION auth.has_any_role(roles text[])
RETURNS boolean AS $$
BEGIN
    RETURN auth.jwt() ->> 'role' = ANY(roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS text AS $$
BEGIN
    RETURN auth.jwt() ->> 'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
