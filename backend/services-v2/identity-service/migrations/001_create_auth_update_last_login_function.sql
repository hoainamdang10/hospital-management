-- Migration: Create auth_update_user_last_login function
-- Purpose: Update user's last login timestamp
-- Schema: auth_schema
-- Security: SECURITY DEFINER (runs with function owner's privileges)
-- 
-- This function is called by SupabaseAuthClient.updateLastLogin()
-- Location: src/infrastructure/auth/SupabaseAuthClient.ts:242-258

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS auth_update_user_last_login(UUID);

-- Create function
CREATE OR REPLACE FUNCTION auth_update_user_last_login(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_schema, public
AS $$
BEGIN
  -- Update last_login_at and updated_at timestamps
  UPDATE auth_schema.user_profiles
  SET 
    last_login_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Log if user not found (for debugging)
  IF NOT FOUND THEN
    RAISE WARNING 'User profile not found for user_id: %', user_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auth_update_user_last_login(UUID) TO authenticated;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION auth_update_user_last_login(UUID) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION auth_update_user_last_login(UUID) IS 
'Updates the last_login_at timestamp for a user profile. Called after successful authentication.';

-- Verification query (run manually to test)
-- SELECT auth_update_user_last_login('00000000-0000-0000-0000-000000000000');

