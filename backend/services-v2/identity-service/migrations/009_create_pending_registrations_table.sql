-- ============================================================================
-- Migration: 009_create_pending_registrations_table.sql
-- Description: Create pending_registrations table for Verify-First approach
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Date: 2025-01-11
-- Compliance: Clean Architecture, DDD, HIPAA
-- ============================================================================

-- Purpose:
-- Implement Verify-First registration pattern where user data is stored
-- temporarily until email verification is completed. This prevents database
-- pollution from unverified users and allows re-registration with same email
-- after token expiration.

-- ============================================================================
-- STEP 1: Create pending_registrations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_schema.pending_registrations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- User data (stored as JSONB for flexibility)
  user_data JSONB NOT NULL,
  
  -- Verification
  verification_token TEXT NOT NULL UNIQUE,
  
  -- Lifecycle
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT pending_registrations_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT pending_registrations_password_hash_check CHECK (LENGTH(password_hash) > 0),
  CONSTRAINT pending_registrations_verification_token_check CHECK (LENGTH(verification_token) > 0),
  CONSTRAINT pending_registrations_expires_at_check CHECK (expires_at > created_at),
  
  -- Unique constraint: Only one active pending registration per email
  CONSTRAINT pending_registrations_email_active_unique 
    UNIQUE (email) 
    WHERE (is_used = FALSE AND expires_at > NOW())
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

-- Index for finding by verification token (most common query)
CREATE INDEX IF NOT EXISTS idx_pending_registrations_token 
  ON auth_schema.pending_registrations(verification_token)
  WHERE is_used = FALSE;

-- Index for finding by email
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email 
  ON auth_schema.pending_registrations(email)
  WHERE is_used = FALSE;

-- Index for cleanup job (finding expired records)
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires 
  ON auth_schema.pending_registrations(expires_at)
  WHERE is_used = FALSE;

-- Index for finding active pending registrations
CREATE INDEX IF NOT EXISTS idx_pending_registrations_active 
  ON auth_schema.pending_registrations(email, expires_at, is_used)
  WHERE is_used = FALSE AND expires_at > NOW();

-- ============================================================================
-- STEP 3: Add table comments for documentation
-- ============================================================================

COMMENT ON TABLE auth_schema.pending_registrations IS 
'Temporary storage for user registrations awaiting email verification. 
Implements Verify-First pattern to prevent database pollution from unverified users.
Records auto-expire after 24 hours and are cleaned up by scheduled job.';

COMMENT ON COLUMN auth_schema.pending_registrations.id IS 
'Unique identifier for pending registration';

COMMENT ON COLUMN auth_schema.pending_registrations.email IS 
'User email address (not yet verified)';

COMMENT ON COLUMN auth_schema.pending_registrations.password_hash IS 
'Bcrypt hashed password (will be used to create auth user after verification)';

COMMENT ON COLUMN auth_schema.pending_registrations.user_data IS 
'User registration data stored as JSONB. Contains: fullName, phoneNumber, citizenId, dateOfBirth, gender, address, roleType';

COMMENT ON COLUMN auth_schema.pending_registrations.verification_token IS 
'JWT token sent via email for verification. Unique per registration.';

COMMENT ON COLUMN auth_schema.pending_registrations.expires_at IS 
'Expiration timestamp (default: 24 hours from creation). After this, record can be deleted.';

COMMENT ON COLUMN auth_schema.pending_registrations.created_at IS 
'Timestamp when pending registration was created';

COMMENT ON COLUMN auth_schema.pending_registrations.is_used IS 
'Flag indicating if verification was completed and user was created. Used records can be deleted.';

-- ============================================================================
-- STEP 4: Create Row Level Security (RLS) policies
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE auth_schema.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for backend service)
CREATE POLICY pending_registrations_service_all 
  ON auth_schema.pending_registrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can only read their own pending registration
CREATE POLICY pending_registrations_user_read_own 
  ON auth_schema.pending_registrations
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Policy: Anonymous users cannot access (all operations via service role)
CREATE POLICY pending_registrations_anon_deny 
  ON auth_schema.pending_registrations
  FOR ALL
  TO anon
  USING (false);

-- ============================================================================
-- STEP 5: Create cleanup function for expired records
-- ============================================================================

CREATE OR REPLACE FUNCTION auth_schema.cleanup_expired_pending_registrations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired or used pending registrations
  DELETE FROM auth_schema.pending_registrations
  WHERE is_used = TRUE 
     OR expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup operation
  INSERT INTO auth_schema.audit_logs (
    action,
    details,
    severity,
    created_at
  ) VALUES (
    'CLEANUP_PENDING_REGISTRATIONS',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'cleanup_time', NOW()
    ),
    'info',
    NOW()
  );
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION auth_schema.cleanup_expired_pending_registrations() IS 
'Cleanup function to delete expired or used pending registrations. 
Should be called periodically (e.g., hourly) by scheduled job.
Returns number of deleted records.';

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

-- Grant service role full access
GRANT ALL ON auth_schema.pending_registrations TO service_role;

-- Grant authenticated users read access (via RLS)
GRANT SELECT ON auth_schema.pending_registrations TO authenticated;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION auth_schema.cleanup_expired_pending_registrations() TO service_role;

-- ============================================================================
-- STEP 7: Verification queries
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth_schema' 
    AND table_name = 'pending_registrations'
  ) THEN
    RAISE NOTICE '✅ Table auth_schema.pending_registrations created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create table auth_schema.pending_registrations';
  END IF;
END $$;

-- Verify indexes
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'auth_schema'
  AND tablename = 'pending_registrations';
  
  IF index_count >= 4 THEN
    RAISE NOTICE '✅ Indexes created successfully (count: %)', index_count;
  ELSE
    RAISE WARNING '⚠️  Expected at least 4 indexes, found: %', index_count;
  END IF;
END $$;

-- Verify RLS enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'auth_schema'
    AND tablename = 'pending_registrations'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ Row Level Security enabled';
  ELSE
    RAISE WARNING '⚠️  Row Level Security not enabled';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (for reference)
-- ============================================================================

-- To rollback this migration, run:
-- DROP FUNCTION IF EXISTS auth_schema.cleanup_expired_pending_registrations();
-- DROP TABLE IF EXISTS auth_schema.pending_registrations CASCADE;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

