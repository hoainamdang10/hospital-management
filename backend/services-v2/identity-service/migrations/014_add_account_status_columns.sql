-- Migration: Add Account Status Columns
-- Purpose: Support permanent deactivation and account status tracking
-- Date: 2025-01-07
-- Author: Hospital Management Team
-- 
-- This migration:
-- 1. Adds account_status column (enum: active, locked, deactivated, suspended)
-- 2. Adds deactivation audit columns (reason, timestamp, actor)
-- 3. Migrates existing is_active data to account_status
-- 4. Keeps is_active for backward compatibility
-- 
-- IMPORTANT: Run during maintenance window
-- Estimated time: 2-5 minutes
-- Rollback: See 014_add_account_status_columns_rollback.sql

-- =============================================================================
-- STEP 1: ADD NEW COLUMNS
-- =============================================================================

-- Add account_status column (default to 'active')
ALTER TABLE auth_schema.user_profiles
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active'
CHECK (account_status IN ('active', 'locked', 'deactivated', 'suspended'));

-- Add deactivation audit columns
ALTER TABLE auth_schema.user_profiles
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivated_by VARCHAR(255);

-- Add index for account_status queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status 
ON auth_schema.user_profiles(account_status);

-- Add index for deactivated_at (for audit queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_deactivated_at 
ON auth_schema.user_profiles(deactivated_at) 
WHERE deactivated_at IS NOT NULL;

COMMENT ON COLUMN auth_schema.user_profiles.account_status IS 
'Account status: active (normal), locked (temporary, reversible), deactivated (permanent, irreversible), suspended (admin review)';

COMMENT ON COLUMN auth_schema.user_profiles.deactivation_reason IS 
'Reason for account deactivation/lock (for audit trail)';

COMMENT ON COLUMN auth_schema.user_profiles.deactivated_at IS 
'Timestamp when account was deactivated/locked';

COMMENT ON COLUMN auth_schema.user_profiles.deactivated_by IS 
'User ID who deactivated/locked the account';

-- =============================================================================
-- STEP 2: MIGRATE EXISTING DATA
-- =============================================================================

-- Migrate is_active to account_status
-- is_active = true  -> account_status = 'active'
-- is_active = false -> account_status = 'locked' (assume temporary lock)
UPDATE auth_schema.user_profiles
SET account_status = CASE 
  WHEN is_active = true THEN 'active'
  WHEN is_active = false THEN 'locked'
  ELSE 'active'
END
WHERE account_status = 'active'; -- Only update records that haven't been migrated

-- Set deactivated_at for locked accounts (use updated_at as fallback)
UPDATE auth_schema.user_profiles
SET deactivated_at = updated_at,
    deactivation_reason = 'Migrated from is_active=false'
WHERE account_status = 'locked' 
  AND deactivated_at IS NULL;

-- =============================================================================
-- STEP 3: CREATE COMPUTED COLUMN FUNCTION (BACKWARD COMPATIBILITY)
-- =============================================================================

-- Create function to compute is_active from account_status
CREATE OR REPLACE FUNCTION auth_schema.compute_is_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync is_active with account_status
  NEW.is_active := (NEW.account_status = 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update is_active when account_status changes
DROP TRIGGER IF EXISTS trigger_compute_is_active ON auth_schema.user_profiles;
CREATE TRIGGER trigger_compute_is_active
  BEFORE INSERT OR UPDATE OF account_status
  ON auth_schema.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth_schema.compute_is_active();

COMMENT ON FUNCTION auth_schema.compute_is_active() IS 
'Auto-sync is_active column with account_status for backward compatibility';

-- =============================================================================
-- STEP 4: VALIDATION
-- =============================================================================

-- Verify migration
DO $$
DECLARE
  total_users INTEGER;
  active_users INTEGER;
  locked_users INTEGER;
  deactivated_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth_schema.user_profiles;
  SELECT COUNT(*) INTO active_users FROM auth_schema.user_profiles WHERE account_status = 'active';
  SELECT COUNT(*) INTO locked_users FROM auth_schema.user_profiles WHERE account_status = 'locked';
  SELECT COUNT(*) INTO deactivated_users FROM auth_schema.user_profiles WHERE account_status = 'deactivated';
  
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '  Total users: %', total_users;
  RAISE NOTICE '  Active: %', active_users;
  RAISE NOTICE '  Locked: %', locked_users;
  RAISE NOTICE '  Deactivated: %', deactivated_users;
  
  -- Verify is_active sync
  IF EXISTS (
    SELECT 1 FROM auth_schema.user_profiles 
    WHERE (account_status = 'active' AND is_active = false)
       OR (account_status != 'active' AND is_active = true)
  ) THEN
    RAISE EXCEPTION 'Data inconsistency: is_active not synced with account_status';
  END IF;
  
  RAISE NOTICE 'Validation passed: is_active synced with account_status';
END $$;

-- =============================================================================
-- STEP 5: GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to service role
GRANT SELECT, INSERT, UPDATE ON auth_schema.user_profiles TO service_role;
GRANT USAGE ON SCHEMA auth_schema TO service_role;
