-- Migration: Create login_attempts table
-- Purpose: Track login attempts for security and audit purposes
-- Schema: auth_schema
-- 
-- This table is used by SupabaseAuthClient.updateLastLogin()
-- Location: src/infrastructure/auth/SupabaseAuthClient.ts:247-254

-- Drop table if exists (for idempotency)
DROP TABLE IF EXISTS auth_schema.login_attempts CASCADE;

-- Create login_attempts table
CREATE TABLE auth_schema.login_attempts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User identification
  email VARCHAR(255) NOT NULL,
  user_id UUID, -- Optional: link to user_profiles.id
  
  -- Request metadata
  ip_address VARCHAR(45) NOT NULL, -- Supports both IPv4 and IPv6
  user_agent TEXT,
  
  -- Attempt details
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT, -- e.g., "Invalid credentials", "Account locked"
  
  -- Timestamps
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_login_attempts_email 
  ON auth_schema.login_attempts(email);

CREATE INDEX idx_login_attempts_user_id 
  ON auth_schema.login_attempts(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_login_attempts_attempted_at 
  ON auth_schema.login_attempts(attempted_at DESC);

CREATE INDEX idx_login_attempts_ip_address 
  ON auth_schema.login_attempts(ip_address);

CREATE INDEX idx_login_attempts_success 
  ON auth_schema.login_attempts(success, attempted_at DESC);

-- Composite index for common queries
CREATE INDEX idx_login_attempts_email_attempted_at 
  ON auth_schema.login_attempts(email, attempted_at DESC);

-- Enable Row Level Security
ALTER TABLE auth_schema.login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage all login attempts
CREATE POLICY "Service role can manage login attempts"
  ON auth_schema.login_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Authenticated users can view their own login attempts
CREATE POLICY "Users can view their own login attempts"
  ON auth_schema.login_attempts
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth_schema.user_profiles WHERE id = auth.uid())
  );

-- Add comments for documentation
COMMENT ON TABLE auth_schema.login_attempts IS 
'Tracks all login attempts (successful and failed) for security monitoring and audit purposes.';

COMMENT ON COLUMN auth_schema.login_attempts.email IS 
'Email address used in the login attempt.';

COMMENT ON COLUMN auth_schema.login_attempts.user_id IS 
'Optional: User ID if the email corresponds to an existing user.';

COMMENT ON COLUMN auth_schema.login_attempts.ip_address IS 
'IP address of the client making the login attempt. Supports IPv4 and IPv6.';

COMMENT ON COLUMN auth_schema.login_attempts.user_agent IS 
'User agent string from the client browser/application.';

COMMENT ON COLUMN auth_schema.login_attempts.success IS 
'Whether the login attempt was successful.';

COMMENT ON COLUMN auth_schema.login_attempts.failure_reason IS 
'Reason for login failure (e.g., "Invalid credentials", "Account locked").';

COMMENT ON COLUMN auth_schema.login_attempts.attempted_at IS 
'Timestamp when the login attempt occurred.';

-- Create function to clean up old login attempts (optional)
CREATE OR REPLACE FUNCTION auth_schema.cleanup_old_login_attempts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete login attempts older than 90 days
  DELETE FROM auth_schema.login_attempts
  WHERE attempted_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION auth_schema.cleanup_old_login_attempts() IS 
'Deletes login attempts older than 90 days. Run periodically via cron job.';

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION auth_schema.cleanup_old_login_attempts() TO service_role;

-- Verification queries (run manually to test)
-- INSERT INTO auth_schema.login_attempts (email, ip_address, success) 
-- VALUES ('test@example.com', '192.168.1.1', true);
-- 
-- SELECT * FROM auth_schema.login_attempts ORDER BY attempted_at DESC LIMIT 10;
-- 
-- SELECT auth_schema.cleanup_old_login_attempts();

