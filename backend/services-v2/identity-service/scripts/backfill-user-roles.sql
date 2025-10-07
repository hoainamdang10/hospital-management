-- Backfill Script: Migrate user_profiles.role_type to user_roles table
-- Purpose: Populate user_roles table from existing user_profiles.role_type
-- Date: 2025-01-06
-- Author: Hospital Management Team
-- 
-- This script:
-- 1. Validates existing data
-- 2. Creates user_roles entries from user_profiles.role_type
-- 3. Handles edge cases (missing roles, invalid role types)
-- 4. Provides detailed reporting
-- 
-- IMPORTANT: Run this after 004_create_pure_rbac_schema.sql
-- Estimated time: 1-2 minutes for 1000 users
-- Safe to run multiple times (idempotent)

-- =============================================================================
-- STEP 1: PRE-FLIGHT CHECKS
-- =============================================================================

DO $$
DECLARE
  user_count INT;
  role_count INT;
  existing_assignments INT;
BEGIN
  -- Check user_profiles table
  SELECT COUNT(*) INTO user_count FROM auth_schema.user_profiles;
  RAISE NOTICE 'Found % users in user_profiles', user_count;
  
  -- Check healthcare_roles table
  SELECT COUNT(*) INTO role_count FROM auth_schema.healthcare_roles;
  RAISE NOTICE 'Found % roles in healthcare_roles', role_count;
  
  -- Check existing user_roles assignments
  SELECT COUNT(*) INTO existing_assignments FROM auth_schema.user_roles;
  RAISE NOTICE 'Found % existing role assignments in user_roles', existing_assignments;
  
  -- Validate tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth_schema' AND table_name = 'user_roles') THEN
    RAISE EXCEPTION 'Table auth_schema.user_roles does not exist. Run migration 004_create_pure_rbac_schema.sql first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth_schema' AND table_name = 'healthcare_roles') THEN
    RAISE EXCEPTION 'Table auth_schema.healthcare_roles does not exist.';
  END IF;
END $$;

-- =============================================================================
-- STEP 2: VALIDATE ROLE TYPES
-- =============================================================================

-- Check for invalid role types
DO $$
DECLARE
  invalid_count INT;
  invalid_roles TEXT;
BEGIN
  SELECT 
    COUNT(*),
    string_agg(DISTINCT role_type, ', ')
  INTO invalid_count, invalid_roles
  FROM auth_schema.user_profiles up
  WHERE role_type IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM auth_schema.healthcare_roles hr 
      WHERE hr.role_name = up.role_type
    );
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'Found % users with invalid role types: %', invalid_count, invalid_roles;
    RAISE NOTICE 'These users will be skipped. Fix role_type or add missing roles to healthcare_roles.';
  END IF;
END $$;

-- =============================================================================
-- STEP 3: BACKFILL USER_ROLES
-- =============================================================================

-- Insert user role assignments from user_profiles.role_type
INSERT INTO auth_schema.user_roles (
  user_id,
  role_name,
  assigned_at,
  assigned_by
)
SELECT 
  up.id as user_id,
  up.role_type as role_name,
  up.created_at as assigned_at,
  'system_backfill' as assigned_by
FROM auth_schema.user_profiles up
INNER JOIN auth_schema.healthcare_roles hr ON hr.role_name = up.role_type
WHERE up.role_type IS NOT NULL
  -- Skip if already assigned
  AND NOT EXISTS (
    SELECT 1 FROM auth_schema.user_roles ur 
    WHERE ur.user_id = up.id AND ur.role_name = up.role_type
  )
ON CONFLICT (user_id, role_name) DO NOTHING;

-- =============================================================================
-- STEP 4: HANDLE USERS WITHOUT ROLES
-- =============================================================================

-- Assign default 'patient' role to users without any role
INSERT INTO auth_schema.user_roles (
  user_id,
  role_name,
  assigned_at,
  assigned_by
)
SELECT 
  up.id as user_id,
  'patient' as role_name,
  NOW() as assigned_at,
  'system_default' as assigned_by
FROM auth_schema.user_profiles up
WHERE (up.role_type IS NULL OR up.role_type = '')
  AND NOT EXISTS (
    SELECT 1 FROM auth_schema.user_roles ur WHERE ur.user_id = up.id
  )
  AND EXISTS (
    SELECT 1 FROM auth_schema.healthcare_roles WHERE role_name = 'patient'
  )
ON CONFLICT (user_id, role_name) DO NOTHING;

-- =============================================================================
-- STEP 5: VERIFICATION & REPORTING
-- =============================================================================

-- Generate detailed report
DO $$
DECLARE
  total_users INT;
  users_with_roles INT;
  users_without_roles INT;
  total_assignments INT;
  role_distribution TEXT;
BEGIN
  -- Count users
  SELECT COUNT(*) INTO total_users FROM auth_schema.user_profiles;
  
  -- Count users with role assignments
  SELECT COUNT(DISTINCT user_id) INTO users_with_roles FROM auth_schema.user_roles;
  
  -- Count users without role assignments
  users_without_roles := total_users - users_with_roles;
  
  -- Count total role assignments
  SELECT COUNT(*) INTO total_assignments FROM auth_schema.user_roles;
  
  -- Get role distribution
  SELECT string_agg(role_name || ': ' || user_count::TEXT, ', ' ORDER BY user_count DESC)
  INTO role_distribution
  FROM (
    SELECT role_name, COUNT(*) as user_count
    FROM auth_schema.user_roles
    GROUP BY role_name
  ) t;
  
  -- Print report
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'BACKFILL COMPLETE';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Users with roles: % (%.1f%%)', users_with_roles, (users_with_roles::FLOAT / NULLIF(total_users, 0) * 100);
  RAISE NOTICE 'Users without roles: %', users_without_roles;
  RAISE NOTICE 'Total role assignments: %', total_assignments;
  RAISE NOTICE '';
  RAISE NOTICE 'Role distribution: %', role_distribution;
  RAISE NOTICE '=============================================================================';
  
  -- Warnings
  IF users_without_roles > 0 THEN
    RAISE WARNING '% users still have no role assignments. Review manually.', users_without_roles;
  END IF;
END $$;

-- Detailed breakdown by role
SELECT 
  hr.role_name,
  hr.role_description,
  COUNT(ur.user_id) as user_count,
  ROUND(COUNT(ur.user_id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM auth_schema.user_profiles), 0) * 100, 1) as percentage
FROM auth_schema.healthcare_roles hr
LEFT JOIN auth_schema.user_roles ur ON hr.role_name = ur.role_name
GROUP BY hr.role_name, hr.role_description
ORDER BY user_count DESC;

-- Users with multiple roles (should be none after backfill, but check)
SELECT 
  up.email,
  up.full_name,
  array_agg(ur.role_name ORDER BY ur.assigned_at) as roles,
  COUNT(*) as role_count
FROM auth_schema.user_profiles up
INNER JOIN auth_schema.user_roles ur ON up.id = ur.user_id
GROUP BY up.id, up.email, up.full_name
HAVING COUNT(*) > 1
ORDER BY role_count DESC;

-- Users without any role assignment
SELECT 
  up.email,
  up.full_name,
  up.role_type as original_role_type,
  up.created_at
FROM auth_schema.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM auth_schema.user_roles ur WHERE ur.user_id = up.id
)
ORDER BY up.created_at DESC
LIMIT 10;

-- =============================================================================
-- STEP 6: AUDIT LOG
-- =============================================================================

-- Log backfill completion
INSERT INTO auth_schema.audit_logs (action, details, severity)
VALUES (
  'user_roles_backfill_complete',
  jsonb_build_object(
    'script', 'backfill-user-roles.sql',
    'timestamp', NOW(),
    'total_users', (SELECT COUNT(*) FROM auth_schema.user_profiles),
    'users_with_roles', (SELECT COUNT(DISTINCT user_id) FROM auth_schema.user_roles),
    'total_assignments', (SELECT COUNT(*) FROM auth_schema.user_roles),
    'role_distribution', (
      SELECT jsonb_object_agg(role_name, user_count)
      FROM (
        SELECT role_name, COUNT(*) as user_count
        FROM auth_schema.user_roles
        GROUP BY role_name
      ) t
    )
  ),
  'info'
);

-- =============================================================================
-- OPTIONAL: UPDATE USER_PROFILES VIEW
-- =============================================================================

-- Refresh materialized view if exists
-- REFRESH MATERIALIZED VIEW IF EXISTS auth_schema.user_profiles_with_roles;

-- =============================================================================
-- POST-BACKFILL RECOMMENDATIONS
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'POST-BACKFILL RECOMMENDATIONS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE '1. Review users without role assignments (query above)';
  RAISE NOTICE '2. Verify role distribution matches expectations';
  RAISE NOTICE '3. Test authentication with new RBAC system';
  RAISE NOTICE '4. Update application code to use user_roles table';
  RAISE NOTICE '5. Consider deprecating user_profiles.role_type column';
  RAISE NOTICE '=============================================================================';
END $$;

