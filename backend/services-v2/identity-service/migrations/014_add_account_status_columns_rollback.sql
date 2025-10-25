-- Rollback Migration: Remove Account Status Columns
-- Purpose: Rollback migration 014_add_account_status_columns.sql
-- Date: 2025-01-07
-- Author: Hospital Management Team

-- =============================================================================
-- STEP 1: DROP TRIGGER AND FUNCTION
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_compute_is_active ON auth_schema.user_profiles;
DROP FUNCTION IF EXISTS auth_schema.compute_is_active();

-- =============================================================================
-- STEP 2: DROP INDEXES
-- =============================================================================

DROP INDEX IF EXISTS auth_schema.idx_user_profiles_account_status;
DROP INDEX IF EXISTS auth_schema.idx_user_profiles_deactivated_at;

-- =============================================================================
-- STEP 3: RESTORE is_active FROM account_status (BEFORE DROPPING COLUMNS)
-- =============================================================================

-- Ensure is_active reflects account_status before dropping
UPDATE auth_schema.user_profiles
SET is_active = (account_status = 'active');

-- =============================================================================
-- STEP 4: DROP COLUMNS
-- =============================================================================

ALTER TABLE auth_schema.user_profiles
DROP COLUMN IF EXISTS account_status,
DROP COLUMN IF EXISTS deactivation_reason,
DROP COLUMN IF EXISTS deactivated_at,
DROP COLUMN IF EXISTS deactivated_by;

-- =============================================================================
-- STEP 5: VALIDATION
-- =============================================================================

DO $$
DECLARE
  total_users INTEGER;
  active_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth_schema.user_profiles;
  SELECT COUNT(*) INTO active_users FROM auth_schema.user_profiles WHERE is_active = true;
  
  RAISE NOTICE 'Rollback completed:';
  RAISE NOTICE '  Total users: %', total_users;
  RAISE NOTICE '  Active users (is_active=true): %', active_users;
  RAISE NOTICE '  Inactive users (is_active=false): %', total_users - active_users;
END $$;
