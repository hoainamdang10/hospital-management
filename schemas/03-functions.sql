-- =====================================================
-- Hospital Management System - Database Functions
-- Utility functions for business logic
-- =====================================================

-- =====================================================
-- 1. PATIENT ID GENERATION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS text AS $$
DECLARE
    current_month text;
    sequence_num integer;
    patient_id text;
BEGIN
    -- Get current YYYYMM
    current_month := to_char(NOW(), 'YYYYMM');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(patient_id FROM 'PAT-' || current_month || '-(.*)') AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM patient_profiles
    WHERE patient_id LIKE 'PAT-' || current_month || '-%';
    
    -- Format as PAT-YYYYMM-XXX (3 digits)
    patient_id := 'PAT-' || current_month || '-' || LPAD(sequence_num::text, 3, '0');
    
    RETURN patient_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. INVITATION TOKEN GENERATION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text AS $$
DECLARE
    token text;
    token_exists boolean;
BEGIN
    LOOP
        -- Generate a secure random token
        token := encode(gen_random_bytes(32), 'base64url');
        
        -- Check if token already exists
        SELECT EXISTS(
            SELECT 1 FROM staff_invitations WHERE token = token
        ) INTO token_exists;
        
        -- Exit loop if token is unique
        EXIT WHEN NOT token_exists;
    END LOOP;
    
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. INVITATION TOKEN HASH
-- =====================================================
CREATE OR REPLACE FUNCTION hash_invitation_token(token text, secret text DEFAULT 'default_secret')
RETURNS text AS $$
BEGIN
    RETURN encode(hmac(token, secret, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. AUDIT LOG FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION log_audit_event(
    p_actor_id uuid,
    p_action text,
    p_resource_type text,
    p_resource_id text DEFAULT NULL,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_session_id text DEFAULT NULL,
    p_success boolean DEFAULT true,
    p_error_message text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO audit_logs (
        actor_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        session_id,
        success,
        error_message
    ) VALUES (
        p_actor_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_user_agent,
        p_session_id,
        p_success,
        p_error_message
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. PROFILE CREATION TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role text;
BEGIN
    -- Get role from user metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    
    -- Insert into profiles table
    INSERT INTO profiles (
        id,
        email,
        full_name,
        role,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        user_role,
        NEW.email_confirmed_at IS NOT NULL,
        NEW.created_at,
        NEW.updated_at
    );
    
    -- Log the user creation
    PERFORM log_audit_event(
        NEW.id,
        'user_created',
        'profile',
        NEW.id::text,
        NULL,
        jsonb_build_object(
            'email', NEW.email,
            'role', user_role,
            'email_verified', NEW.email_confirmed_at IS NOT NULL
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 6. CONSENT MANAGEMENT FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION grant_consent(
    p_user_id uuid,
    p_consent_type text,
    p_version text DEFAULT '1.0',
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    consent_id uuid;
BEGIN
    INSERT INTO consents (
        user_id,
        consent_type,
        version,
        granted,
        granted_at,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_consent_type,
        p_version,
        true,
        NOW(),
        p_ip_address,
        p_user_agent
    ) 
    ON CONFLICT (user_id, consent_type, version) 
    DO UPDATE SET
        granted = true,
        granted_at = NOW(),
        revoked_at = NULL,
        ip_address = p_ip_address,
        user_agent = p_user_agent,
        updated_at = NOW()
    RETURNING id INTO consent_id;
    
    -- Log consent granted
    PERFORM log_audit_event(
        p_user_id,
        'consent_granted',
        'consent',
        consent_id::text,
        NULL,
        jsonb_build_object(
            'consent_type', p_consent_type,
            'version', p_version
        ),
        p_ip_address,
        p_user_agent
    );
    
    RETURN consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION revoke_consent(
    p_user_id uuid,
    p_consent_type text,
    p_version text DEFAULT '1.0',
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    consent_found boolean;
BEGIN
    UPDATE consents 
    SET 
        granted = false,
        revoked_at = NOW(),
        ip_address = p_ip_address,
        user_agent = p_user_agent,
        updated_at = NOW()
    WHERE 
        user_id = p_user_id 
        AND consent_type = p_consent_type 
        AND version = p_version
        AND granted = true;
    
    GET DIAGNOSTICS consent_found = FOUND;
    
    IF consent_found THEN
        -- Log consent revoked
        PERFORM log_audit_event(
            p_user_id,
            'consent_revoked',
            'consent',
            NULL,
            NULL,
            jsonb_build_object(
                'consent_type', p_consent_type,
                'version', p_version
            ),
            p_ip_address,
            p_user_agent
        );
    END IF;
    
    RETURN consent_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. INVITATION CLEANUP FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM staff_invitations 
    WHERE expires_at < NOW() AND consumed_at IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup
    PERFORM log_audit_event(
        NULL,
        'invitations_cleanup',
        'staff_invitation',
        NULL,
        NULL,
        jsonb_build_object('deleted_count', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. USER STATISTICS FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_users', COUNT(*),
        'active_users', COUNT(*) FILTER (WHERE is_active = true),
        'verified_users', COUNT(*) FILTER (WHERE email_verified = true),
        'by_role', jsonb_object_agg(role, role_count)
    ) INTO stats
    FROM (
        SELECT 
            role,
            COUNT(*) as role_count
        FROM profiles 
        GROUP BY role
    ) role_stats,
    profiles;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. BACKUP CODE GENERATION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_backup_codes(count integer DEFAULT 10)
RETURNS text[] AS $$
DECLARE
    codes text[];
    i integer;
    code text;
BEGIN
    codes := ARRAY[]::text[];
    
    FOR i IN 1..count LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(encode(gen_random_bytes(6), 'base32') from 1 for 8));
        codes := array_append(codes, code);
    END LOOP;
    
    RETURN codes;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. DOCUMENT PATH VALIDATION
-- =====================================================
CREATE OR REPLACE FUNCTION validate_document_path(
    user_id uuid,
    file_path text
)
RETURNS boolean AS $$
BEGIN
    -- Validate path structure: users/{user_id}/{type}/{uuid}.{ext}
    RETURN file_path ~ ('^users/' || user_id::text || '/[a-z_]+/[a-f0-9-]+\.(jpg|jpeg|png|pdf)$');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEDULED CLEANUP (for cron if available)
-- =====================================================
-- Note: This would typically be run via pg_cron or external scheduler
-- For Free Tier, this can be called manually or via API endpoint

CREATE OR REPLACE FUNCTION daily_cleanup()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    expired_invitations integer;
    old_audit_logs integer;
BEGIN
    -- Clean up expired invitations
    SELECT cleanup_expired_invitations() INTO expired_invitations;
    
    -- Clean up old audit logs (keep last 90 days)
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS old_audit_logs = ROW_COUNT;
    
    result := jsonb_build_object(
        'expired_invitations_cleaned', expired_invitations,
        'old_audit_logs_cleaned', old_audit_logs,
        'cleanup_date', NOW()
    );
    
    -- Log cleanup activity
    PERFORM log_audit_event(
        NULL,
        'daily_cleanup',
        'system',
        NULL,
        NULL,
        result
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
