-- =====================================================
-- Hospital Management System - Seed Data
-- Initial data for development and testing
-- =====================================================

-- =====================================================
-- 1. CREATE SUPERADMIN USER (for development)
-- =====================================================
-- Note: In production, this should be created via Supabase Auth Admin API
-- This is just for reference - actual user creation happens via API

-- Insert superadmin profile (assuming auth.users record exists)
-- This would typically be done after creating the user via Supabase Auth
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid, -- Replace with actual UUID
    'superadmin@hospital.local',
    'Super Administrator',
    'superadmin',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    is_active = true,
    email_verified = true,
    updated_at = NOW();

-- =====================================================
-- 2. SAMPLE DEPARTMENTS (if needed for invitations)
-- =====================================================
-- Note: This assumes you have a departments table
-- If not, you can remove department_id from invitations

-- CREATE TABLE IF NOT EXISTS departments (
--     id SERIAL PRIMARY KEY,
--     name TEXT NOT NULL,
--     code TEXT NOT NULL UNIQUE,
--     description TEXT,
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- INSERT INTO departments (name, code, description) VALUES
-- ('Cardiology', 'CARD', 'Heart and cardiovascular diseases'),
-- ('Neurology', 'NEUR', 'Brain and nervous system disorders'),
-- ('Pediatrics', 'PEDI', 'Medical care for infants, children, and adolescents'),
-- ('Emergency', 'EMER', 'Emergency medical services'),
-- ('General Medicine', 'GMED', 'General medical practice'),
-- ('Administration', 'ADMIN', 'Hospital administration and management')
-- ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 3. SAMPLE CONSENT VERSIONS
-- =====================================================
-- These represent the current versions of various consent types
-- Used for tracking consent compliance

-- You might want to create a consent_versions table for better management
CREATE TABLE IF NOT EXISTS consent_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_type TEXT NOT NULL,
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_current BOOLEAN DEFAULT false,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(consent_type, version)
);

INSERT INTO consent_versions (consent_type, version, title, content, is_current, effective_date) VALUES
(
    'tos',
    '1.0',
    'Terms of Service',
    'By using this hospital management system, you agree to comply with and be bound by the following terms and conditions...',
    true,
    CURRENT_DATE
),
(
    'privacy',
    '1.0',
    'Privacy Policy',
    'This Privacy Policy describes how we collect, use, and protect your personal information when you use our hospital management system...',
    true,
    CURRENT_DATE
),
(
    'marketing',
    '1.0',
    'Marketing Communications',
    'We would like to send you information about our services, health tips, and hospital updates. You can opt out at any time...',
    true,
    CURRENT_DATE
),
(
    'data_processing',
    '1.0',
    'Data Processing Consent',
    'We process your personal health information to provide medical services, maintain medical records, and improve healthcare delivery...',
    true,
    CURRENT_DATE
)
ON CONFLICT (consent_type, version) DO UPDATE SET
    is_current = EXCLUDED.is_current,
    updated_at = NOW();

-- =====================================================
-- 4. SAMPLE PATIENT DATA (for testing)
-- =====================================================
-- Note: These are fake users for development/testing only
-- In production, real users are created via registration flow

-- Sample patient profile
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    date_of_birth,
    gender,
    phone,
    preferred_language,
    is_active,
    email_verified,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'patient.test@example.com',
    'Nguyễn Văn Test',
    'patient',
    '1990-01-15',
    'male',
    '+84901234567',
    'vi',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Sample patient profile details
INSERT INTO patient_profiles (
    user_id,
    patient_id,
    blood_type,
    allergies,
    chronic_conditions,
    onboarding_completed
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'PAT-' || to_char(NOW(), 'YYYYMM') || '-001',
    'O+',
    ARRAY['Penicillin', 'Shellfish'],
    ARRAY['Hypertension'],
    true
) ON CONFLICT (user_id) DO NOTHING;

-- Sample address
INSERT INTO addresses (
    user_id,
    type,
    line1,
    ward,
    district,
    city,
    postal_code,
    is_primary
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'home',
    '123 Đường ABC',
    'Phường XYZ',
    'Quận 1',
    'Hồ Chí Minh',
    '70000',
    true
) ON CONFLICT DO NOTHING;

-- Sample emergency contact
INSERT INTO emergency_contacts (
    user_id,
    name,
    relation,
    phone,
    email,
    is_primary
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Nguyễn Thị Emergency',
    'Spouse',
    '+84901234568',
    'emergency@example.com',
    true
) ON CONFLICT DO NOTHING;

-- Sample insurance
INSERT INTO insurances (
    user_id,
    provider,
    insurance_number,
    valid_from,
    valid_to,
    is_primary
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'BHXH Việt Nam',
    'VN1234567890',
    CURRENT_DATE - INTERVAL '1 year',
    CURRENT_DATE + INTERVAL '1 year',
    true
) ON CONFLICT DO NOTHING;

-- Sample consents for test patient
INSERT INTO consents (user_id, consent_type, version, granted, granted_at) VALUES
('11111111-1111-1111-1111-111111111111'::uuid, 'tos', '1.0', true, NOW()),
('11111111-1111-1111-1111-111111111111'::uuid, 'privacy', '1.0', true, NOW()),
('11111111-1111-1111-1111-111111111111'::uuid, 'data_processing', '1.0', true, NOW())
ON CONFLICT (user_id, consent_type, version) DO NOTHING;

-- =====================================================
-- 5. SAMPLE STAFF INVITATION (for testing)
-- =====================================================
-- Sample invitation for testing invite flow
INSERT INTO staff_invitations (
    email,
    role,
    token,
    token_hash,
    invited_by,
    expires_at
) VALUES (
    'doctor.test@example.com',
    'doctor',
    'test-invitation-token-123',
    hash_invitation_token('test-invitation-token-123'),
    '00000000-0000-0000-0000-000000000001'::uuid, -- superadmin
    NOW() + INTERVAL '7 days'
) ON CONFLICT (token) DO NOTHING;

-- =====================================================
-- 6. SAMPLE AUDIT LOGS
-- =====================================================
-- Log the seed data creation
SELECT log_audit_event(
    NULL,
    'seed_data_created',
    'system',
    NULL,
    NULL,
    jsonb_build_object(
        'action', 'Initial seed data creation',
        'tables', ARRAY['profiles', 'patient_profiles', 'addresses', 'emergency_contacts', 'insurances', 'consents', 'staff_invitations'],
        'timestamp', NOW()
    )
);

-- =====================================================
-- 7. UTILITY VIEWS (for easier querying)
-- =====================================================

-- View for complete patient information
CREATE OR REPLACE VIEW patient_complete_view AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.date_of_birth,
    p.gender,
    p.phone,
    p.preferred_language,
    p.is_active,
    p.email_verified,
    pp.patient_id,
    pp.blood_type,
    pp.allergies,
    pp.chronic_conditions,
    pp.onboarding_completed,
    a.line1 as address_line1,
    a.ward,
    a.district,
    a.city,
    ec.name as emergency_contact_name,
    ec.phone as emergency_contact_phone,
    i.provider as insurance_provider,
    i.insurance_number,
    p.created_at,
    p.updated_at
FROM profiles p
LEFT JOIN patient_profiles pp ON p.id = pp.user_id
LEFT JOIN addresses a ON p.id = a.user_id AND a.is_primary = true
LEFT JOIN emergency_contacts ec ON p.id = ec.user_id AND ec.is_primary = true
LEFT JOIN insurances i ON p.id = i.user_id AND i.is_primary = true
WHERE p.role = 'patient';

-- View for active invitations
CREATE OR REPLACE VIEW active_invitations_view AS
SELECT 
    si.*,
    p.full_name as invited_by_name,
    CASE 
        WHEN si.consumed_at IS NOT NULL THEN 'consumed'
        WHEN si.expires_at < NOW() THEN 'expired'
        ELSE 'active'
    END as status
FROM staff_invitations si
LEFT JOIN profiles p ON si.invited_by = p.id
ORDER BY si.created_at DESC;

-- View for user statistics
CREATE OR REPLACE VIEW user_statistics_view AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
    COUNT(*) FILTER (WHERE role = 'patient') as patients,
    COUNT(*) FILTER (WHERE role = 'doctor') as doctors,
    COUNT(*) FILTER (WHERE role = 'staff') as staff,
    COUNT(*) FILTER (WHERE role = 'admin') as admins,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_this_week,
    COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE - INTERVAL '7 days') as active_this_week
FROM profiles;

-- =====================================================
-- 8. PERFORMANCE OPTIMIZATION
-- =====================================================

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON profiles(last_login_at);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON staff_invitations(expires_at, consumed_at);
CREATE INDEX IF NOT EXISTS idx_consents_granted ON consents(user_id, granted, consent_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

-- =====================================================
-- 9. HEALTH CHECK FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION health_check()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    table_counts jsonb;
BEGIN
    -- Get table counts
    SELECT jsonb_build_object(
        'profiles', (SELECT COUNT(*) FROM profiles),
        'staff_invitations', (SELECT COUNT(*) FROM staff_invitations),
        'consents', (SELECT COUNT(*) FROM consents),
        'patient_profiles', (SELECT COUNT(*) FROM patient_profiles),
        'audit_logs', (SELECT COUNT(*) FROM audit_logs)
    ) INTO table_counts;
    
    -- Build health check result
    result := jsonb_build_object(
        'status', 'healthy',
        'timestamp', NOW(),
        'database', 'connected',
        'table_counts', table_counts,
        'version', '1.0.0'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FINAL NOTES
-- =====================================================
-- 1. Remember to update the superadmin UUID with actual value after user creation
-- 2. Remove or modify test data before production deployment
-- 3. Regularly run cleanup_expired_invitations() to maintain data hygiene
-- 4. Monitor audit_logs table size and implement archiving if needed
-- 5. Update consent versions when terms change and handle user re-consent flow
