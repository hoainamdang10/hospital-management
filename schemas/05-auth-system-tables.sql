-- =====================================================
-- HOSPITAL MANAGEMENT SYSTEM - AUTHENTICATION TABLES
-- Production-ready schema optimized for Supabase Free Tier
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. STAFF INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS staff_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    role TEXT NOT NULL CHECK (role IN ('staff', 'doctor', 'admin')),
    department_id INTEGER REFERENCES departments(id),
    token_hash TEXT NOT NULL UNIQUE, -- HMAC-SHA256 hash of invitation token
    invited_by UUID NOT NULL REFERENCES profiles(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    consumed_at TIMESTAMPTZ,
    consumed_by UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}', -- Additional invitation data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_expiry CHECK (expires_at > created_at),
    CONSTRAINT consumed_logic CHECK (
        (consumed_at IS NULL AND consumed_by IS NULL) OR 
        (consumed_at IS NOT NULL AND consumed_by IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token_hash ON staff_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_expires_at ON staff_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status ON staff_invitations(consumed_at, expires_at);

-- =====================================================
-- 2. CONSENTS TABLE (GDPR/Privacy Compliance)
-- =====================================================
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('tos', 'privacy', 'marketing', 'data_processing')),
    version TEXT NOT NULL DEFAULT '1.0',
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT consent_logic CHECK (
        (granted = true AND granted_at IS NOT NULL) OR 
        (granted = false AND granted_at IS NULL)
    ),
    CONSTRAINT revoke_logic CHECK (
        revoked_at IS NULL OR revoked_at > granted_at
    ),
    
    -- Unique constraint: one active consent per user per type
    UNIQUE(user_id, consent_type, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consents_user_type ON consents(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_granted ON consents(granted, granted_at);

-- =====================================================
-- 3. AUDIT LOGS TABLE (Security & Compliance)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id), -- Who performed the action
    target_id UUID REFERENCES profiles(id), -- Who was affected (optional)
    action TEXT NOT NULL CHECK (length(action) <= 100),
    resource_type TEXT NOT NULL CHECK (resource_type IN (
        'user', 'profile', 'invitation', 'consent', 'document', 
        'appointment', 'medical_record', 'payment', 'session'
    )),
    resource_id TEXT, -- ID of the affected resource
    details JSONB DEFAULT '{}', -- Action details
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('low', 'info', 'warning', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT action_not_empty CHECK (length(trim(action)) > 0)
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- 4. DOCUMENTS TABLE (File Upload Metadata)
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'id_card', 'insurance_card', 'medical_report', 'prescription', 
        'lab_result', 'profile_photo', 'other'
    )),
    file_name TEXT NOT NULL CHECK (length(file_name) <= 255),
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 2097152), -- Max 2MB
    mime_type TEXT NOT NULL CHECK (mime_type IN (
        'image/jpeg', 'image/png', 'image/webp', 
        'application/pdf', 'text/plain'
    )),
    checksum TEXT, -- SHA-256 hash for integrity
    upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'completed', 'failed', 'deleted')),
    virus_scan_status TEXT DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'error')),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ, -- For temporary documents
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_file_name CHECK (file_name !~ '[<>:"/\\|?*]'), -- No invalid chars
    CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_type ON documents(user_id, document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(upload_status, virus_scan_status);
CREATE INDEX IF NOT EXISTS idx_documents_expires_at ON documents(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- 5. MFA SETTINGS TABLE (Multi-Factor Authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS mfa_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    totp_enabled BOOLEAN DEFAULT false,
    totp_secret TEXT, -- Encrypted TOTP secret
    backup_codes TEXT[], -- Encrypted backup codes
    recovery_codes_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT totp_logic CHECK (
        (totp_enabled = false AND totp_secret IS NULL AND enrolled_at IS NULL) OR
        (totp_enabled = true AND totp_secret IS NOT NULL AND enrolled_at IS NOT NULL)
    ),
    CONSTRAINT backup_codes_count CHECK (
        backup_codes IS NULL OR array_length(backup_codes, 1) BETWEEN 8 AND 12
    )
);

-- Index
CREATE INDEX IF NOT EXISTS idx_mfa_settings_user ON mfa_settings(user_id);

-- =====================================================
-- 6. UPDATE EXISTING PROFILES TABLE
-- =====================================================
-- Add new columns to existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW();

-- Add constraints
ALTER TABLE profiles 
ADD CONSTRAINT IF NOT EXISTS email_verified_logic CHECK (
    (email_verified = false AND email_verified_at IS NULL) OR
    (email_verified = true AND email_verified_at IS NOT NULL)
),
ADD CONSTRAINT IF NOT EXISTS onboarding_logic CHECK (
    (onboarding_completed = false AND onboarding_completed_at IS NULL) OR
    (onboarding_completed = true AND onboarding_completed_at IS NOT NULL)
);

-- =====================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_staff_invitations_updated_at ON staff_invitations;
CREATE TRIGGER update_staff_invitations_updated_at 
    BEFORE UPDATE ON staff_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consents_updated_at ON consents;
CREATE TRIGGER update_consents_updated_at 
    BEFORE UPDATE ON consents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mfa_settings_updated_at ON mfa_settings;
CREATE TRIGGER update_mfa_settings_updated_at 
    BEFORE UPDATE ON mfa_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. UTILITY FUNCTIONS
-- =====================================================

-- Function to generate patient ID
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'PAT-';
    date_part TEXT := to_char(NOW(), 'YYYYMM');
    sequence_num INTEGER;
    patient_id TEXT;
BEGIN
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(patient_id FROM LENGTH(prefix || date_part || '-') + 1) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM patient_profiles 
    WHERE patient_id LIKE prefix || date_part || '-%';
    
    -- Format with zero padding
    patient_id := prefix || date_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN patient_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if invitation is valid
CREATE OR REPLACE FUNCTION is_invitation_valid(token_hash_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    SELECT * INTO invitation_record
    FROM staff_invitations
    WHERE token_hash = token_hash_input;
    
    -- Check if invitation exists, not consumed, and not expired
    RETURN (
        invitation_record.id IS NOT NULL AND
        invitation_record.consumed_at IS NULL AND
        invitation_record.expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE staff_invitations IS 'Stores invitation tokens for staff/doctor/admin roles with security features';
COMMENT ON TABLE consents IS 'GDPR-compliant consent management for privacy and terms acceptance';
COMMENT ON TABLE audit_logs IS 'Security audit trail for all sensitive operations';
COMMENT ON TABLE documents IS 'Metadata for uploaded files with security validation';
COMMENT ON TABLE mfa_settings IS 'Multi-factor authentication configuration per user';

COMMENT ON COLUMN staff_invitations.token_hash IS 'HMAC-SHA256 hash of invitation token for security';
COMMENT ON COLUMN consents.version IS 'Version of terms/privacy policy for compliance tracking';
COMMENT ON COLUMN documents.checksum IS 'SHA-256 hash for file integrity verification';
COMMENT ON COLUMN mfa_settings.totp_secret IS 'Encrypted TOTP secret key';
