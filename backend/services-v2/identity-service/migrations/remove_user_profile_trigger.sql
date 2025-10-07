-- Migration: Remove User Profile Trigger
-- Purpose: Remove database trigger for user profile creation
-- Reason: Moving to explicit control in application layer for Clean Architecture compliance
-- Date: 2025-01-05
-- Author: Hospital Management Team

-- ============================================================================
-- STEP 1: Drop Trigger (if exists)
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- ============================================================================
-- STEP 2: Drop Trigger Functions (if exist)
-- ============================================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS auth_schema.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auth_schema.create_user_profile() CASCADE;

-- ============================================================================
-- STEP 3: Add Documentation Comments
-- ============================================================================

COMMENT ON TABLE auth_schema.user_profiles IS 
  'User profiles are now created EXPLICITLY by application code, not by database triggers.
   
   This design decision ensures:
   - Full control over creation flow
   - Explicit error handling and rollback
   - Clear audit trail
   - Testability (can mock database calls)
   - Debuggability (all logic in application code)
   - Clean Architecture compliance
   
   See: SupabaseUserRepository.createAuthUser() for implementation';

-- ============================================================================
-- STEP 4: Verify No Orphaned Auth Users
-- ============================================================================

-- Check for auth users without profiles (should be none after trigger removal)
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users au
  LEFT JOIN auth_schema.user_profiles up ON au.id = up.id
  WHERE up.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % auth users without profiles. Consider cleanup.', orphaned_count;
  ELSE
    RAISE NOTICE 'No orphaned auth users found. Migration successful.';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Create Monitoring View (Optional)
-- ============================================================================

CREATE OR REPLACE VIEW auth_schema.user_creation_audit AS
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  up.created_at as profile_created_at,
  CASE 
    WHEN up.id IS NULL THEN 'ORPHANED_AUTH'
    WHEN au.id IS NULL THEN 'ORPHANED_PROFILE'
    WHEN up.created_at - au.created_at > INTERVAL '5 seconds' THEN 'DELAYED_PROFILE'
    ELSE 'OK'
  END as status
FROM auth.users au
FULL OUTER JOIN auth_schema.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

COMMENT ON VIEW auth_schema.user_creation_audit IS 
  'Monitoring view to detect orphaned users or delayed profile creation.
   Status values:
   - OK: Normal creation
   - ORPHANED_AUTH: Auth user without profile
   - ORPHANED_PROFILE: Profile without auth user
   - DELAYED_PROFILE: Profile created >5s after auth user';

-- ============================================================================
-- STEP 6: Grant Permissions
-- ============================================================================

-- Grant view access to service role
GRANT SELECT ON auth_schema.user_creation_audit TO service_role;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- 
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO auth_schema.user_profiles (
--     id, email, full_name, role_type, is_active, is_verified
--   ) VALUES (
--     NEW.id,
--     NEW.email,
--     COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
--     COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
--     true,
--     false
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- 
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify migration success:

-- 1. Check no triggers exist
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%user%'
  AND event_object_schema IN ('auth', 'public', 'auth_schema');

-- 2. Check no trigger functions exist
SELECT 
  routine_name, 
  routine_schema
FROM information_schema.routines
WHERE routine_name LIKE '%handle_new_user%'
   OR routine_name LIKE '%create_user_profile%';

-- 3. Check user creation audit
SELECT * FROM auth_schema.user_creation_audit
WHERE status != 'OK'
LIMIT 10;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

RAISE NOTICE 'Migration completed successfully. User profiles will now be created explicitly by application code.';

