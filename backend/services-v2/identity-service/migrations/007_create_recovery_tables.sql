-- Migration 007: Create Account Recovery Tables
-- Creates tables for account recovery methods and history
-- 
-- @author Hospital Management Team
-- @version 2.0.0
-- @date 2025-01-07

-- ============================================================================
-- 1. CREATE RECOVERY METHODS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_schema.recovery_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recovery_email TEXT,
  recovery_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
  recovery_email_verified_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_user_recovery UNIQUE(user_id),
  CONSTRAINT valid_recovery_email CHECK (
    recovery_email IS NULL OR 
    recovery_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
  ),
  CONSTRAINT verified_consistency CHECK (
    (recovery_email_verified = FALSE AND recovery_email_verified_at IS NULL) OR
    (recovery_email_verified = TRUE AND recovery_email_verified_at IS NOT NULL)
  ),
  CONSTRAINT timestamp_order CHECK (last_updated_at >= created_at)
);

-- Indexes for performance
CREATE INDEX idx_recovery_methods_user_id ON auth_schema.recovery_methods(user_id);
CREATE INDEX idx_recovery_methods_recovery_email ON auth_schema.recovery_methods(recovery_email) WHERE recovery_email IS NOT NULL;
CREATE INDEX idx_recovery_methods_verified ON auth_schema.recovery_methods(recovery_email_verified) WHERE recovery_email IS NOT NULL;

-- Comments
COMMENT ON TABLE auth_schema.recovery_methods IS 'Account recovery methods for users';
COMMENT ON COLUMN auth_schema.recovery_methods.user_id IS 'User ID (references auth.users)';
COMMENT ON COLUMN auth_schema.recovery_methods.recovery_email IS 'Recovery email address (must be different from primary email)';
COMMENT ON COLUMN auth_schema.recovery_methods.recovery_email_verified IS 'Whether recovery email has been verified';
COMMENT ON COLUMN auth_schema.recovery_methods.recovery_email_verified_at IS 'Timestamp when recovery email was verified';
COMMENT ON COLUMN auth_schema.recovery_methods.last_updated_at IS 'Last update timestamp';
COMMENT ON COLUMN auth_schema.recovery_methods.updated_by IS 'User who made the last update';
COMMENT ON COLUMN auth_schema.recovery_methods.created_at IS 'Creation timestamp';

-- ============================================================================
-- 2. CREATE RECOVERY HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_schema.recovery_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recovery_method TEXT NOT NULL,
  attempt_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_recovery_method CHECK (recovery_method IN ('primary_email', 'recovery_email')),
  CONSTRAINT valid_attempt_type CHECK (attempt_type IN ('request_reset', 'verify_token', 'reset_password')),
  CONSTRAINT failure_reason_consistency CHECK (
    (success = TRUE AND failure_reason IS NULL) OR
    (success = FALSE AND failure_reason IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_recovery_history_user_id ON auth_schema.recovery_history(user_id);
CREATE INDEX idx_recovery_history_attempted_at ON auth_schema.recovery_history(attempted_at DESC);
CREATE INDEX idx_recovery_history_success ON auth_schema.recovery_history(success);
CREATE INDEX idx_recovery_history_user_attempt_type ON auth_schema.recovery_history(user_id, attempt_type, attempted_at DESC);

-- Comments
COMMENT ON TABLE auth_schema.recovery_history IS 'Audit trail for account recovery attempts';
COMMENT ON COLUMN auth_schema.recovery_history.user_id IS 'User ID (references auth.users)';
COMMENT ON COLUMN auth_schema.recovery_history.recovery_method IS 'Recovery method used (primary_email or recovery_email)';
COMMENT ON COLUMN auth_schema.recovery_history.attempt_type IS 'Type of recovery attempt (request_reset, verify_token, reset_password)';
COMMENT ON COLUMN auth_schema.recovery_history.success IS 'Whether the attempt was successful';
COMMENT ON COLUMN auth_schema.recovery_history.failure_reason IS 'Reason for failure (if success = false)';
COMMENT ON COLUMN auth_schema.recovery_history.ip_address IS 'IP address of the request';
COMMENT ON COLUMN auth_schema.recovery_history.user_agent IS 'User agent string of the request';
COMMENT ON COLUMN auth_schema.recovery_history.attempted_at IS 'Timestamp of the attempt';

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE auth_schema.recovery_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.recovery_history ENABLE ROW LEVEL SECURITY;

-- Recovery Methods Policies
-- Service role can do everything
CREATE POLICY recovery_methods_service_role_all
  ON auth_schema.recovery_methods
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own recovery methods
CREATE POLICY recovery_methods_user_read_own
  ON auth_schema.recovery_methods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can update their own recovery methods
CREATE POLICY recovery_methods_user_update_own
  ON auth_schema.recovery_methods
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can insert their own recovery methods
CREATE POLICY recovery_methods_user_insert_own
  ON auth_schema.recovery_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Recovery History Policies
-- Service role can do everything
CREATE POLICY recovery_history_service_role_all
  ON auth_schema.recovery_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own recovery history
CREATE POLICY recovery_history_user_read_own
  ON auth_schema.recovery_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can insert recovery history (audit trail)
-- Users cannot modify their own history

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if recovery email is already used
CREATE OR REPLACE FUNCTION auth_schema.is_recovery_email_used(
  p_email TEXT,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth_schema.recovery_methods
    WHERE LOWER(recovery_email) = LOWER(p_email)
      AND (p_exclude_user_id IS NULL OR user_id != p_exclude_user_id)
  );
END;
$$;

COMMENT ON FUNCTION auth_schema.is_recovery_email_used IS 'Check if recovery email is already used by another user';

-- Function to find user by recovery email
CREATE OR REPLACE FUNCTION auth_schema.find_user_by_recovery_email(
  p_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM auth_schema.recovery_methods
  WHERE LOWER(recovery_email) = LOWER(p_email)
    AND recovery_email_verified = TRUE
  LIMIT 1;
  
  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION auth_schema.find_user_by_recovery_email IS 'Find user ID by verified recovery email';

-- Function to count recent recovery attempts (for rate limiting)
CREATE OR REPLACE FUNCTION auth_schema.count_recent_recovery_attempts(
  p_user_id UUID,
  p_attempt_type TEXT,
  p_since_timestamp TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM auth_schema.recovery_history
  WHERE user_id = p_user_id
    AND attempt_type = p_attempt_type
    AND attempted_at >= p_since_timestamp;
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION auth_schema.count_recent_recovery_attempts IS 'Count recent recovery attempts for rate limiting';

-- Function to cleanup old recovery history (data retention)
CREATE OR REPLACE FUNCTION auth_schema.cleanup_old_recovery_history(
  p_older_than_days INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM auth_schema.recovery_history
    WHERE attempted_at < NOW() - (p_older_than_days || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION auth_schema.cleanup_old_recovery_history IS 'Delete recovery history older than specified days (default 90)';

-- ============================================================================
-- 5. GRANTS
-- ============================================================================

-- Grant permissions to service_role
GRANT ALL ON auth_schema.recovery_methods TO service_role;
GRANT ALL ON auth_schema.recovery_history TO service_role;

-- Grant permissions to authenticated users (limited by RLS)
GRANT SELECT, INSERT, UPDATE ON auth_schema.recovery_methods TO authenticated;
GRANT SELECT ON auth_schema.recovery_history TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION auth_schema.is_recovery_email_used TO service_role;
GRANT EXECUTE ON FUNCTION auth_schema.find_user_by_recovery_email TO service_role;
GRANT EXECUTE ON FUNCTION auth_schema.count_recent_recovery_attempts TO service_role;
GRANT EXECUTE ON FUNCTION auth_schema.cleanup_old_recovery_history TO service_role;

-- ============================================================================
-- 6. VERIFICATION
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth_schema' AND table_name = 'recovery_methods') THEN
    RAISE EXCEPTION 'Table auth_schema.recovery_methods was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth_schema' AND table_name = 'recovery_history') THEN
    RAISE EXCEPTION 'Table auth_schema.recovery_history was not created';
  END IF;
  
  RAISE NOTICE 'Migration 007 completed successfully';
END $$;

