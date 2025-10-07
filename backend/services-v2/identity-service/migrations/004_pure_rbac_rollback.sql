-- Rollback: Pure RBAC Migration
-- Purpose: Safely rollback from Pure RBAC to Hybrid RBAC (JSONB permissions)
-- Date: 2025-01-06
-- Author: Hospital Management Team
-- 
-- This rollback script:
-- 1. Creates backup tables for all RBAC data
-- 2. Restores healthcare_roles.permissions (JSONB) from role_permissions
-- 3. Preserves user_permissions for manual restoration
-- 4. Drops relational RBAC tables (but keeps backups)
-- 5. Restores user_profiles.role_type if needed
-- 
-- IMPORTANT: Run this only if migration fails or needs to be reverted
-- Estimated time: 3-5 minutes
-- Data loss: NONE (all data backed up)

-- =============================================================================
-- STEP 1: CREATE BACKUP TABLES
-- =============================================================================

-- Backup permissions table
CREATE TABLE IF NOT EXISTS auth_schema.permissions_backup AS 
SELECT * FROM auth_schema.permissions;

COMMENT ON TABLE auth_schema.permissions_backup IS 
'Backup of permissions table before rollback. Created: ' || NOW()::TEXT;

-- Backup role_permissions table
CREATE TABLE IF NOT EXISTS auth_schema.role_permissions_backup AS 
SELECT * FROM auth_schema.role_permissions;

COMMENT ON TABLE auth_schema.role_permissions_backup IS 
'Backup of role_permissions table before rollback. Created: ' || NOW()::TEXT;

-- Backup user_permissions table
CREATE TABLE IF NOT EXISTS auth_schema.user_permissions_backup AS 
SELECT * FROM auth_schema.user_permissions;

COMMENT ON TABLE auth_schema.user_permissions_backup IS 
'Backup of user-specific permission overrides. IMPORTANT: Restore manually if needed. Created: ' || NOW()::TEXT;

-- Backup permission_inheritance table
CREATE TABLE IF NOT EXISTS auth_schema.permission_inheritance_backup AS 
SELECT * FROM auth_schema.permission_inheritance;

COMMENT ON TABLE auth_schema.permission_inheritance_backup IS 
'Backup of permission hierarchy rules. Created: ' || NOW()::TEXT;

-- Backup user_roles table
CREATE TABLE IF NOT EXISTS auth_schema.user_roles_backup AS 
SELECT * FROM auth_schema.user_roles;

COMMENT ON TABLE auth_schema.user_roles_backup IS 
'Backup of user role assignments. Created: ' || NOW()::TEXT;

-- =============================================================================
-- STEP 2: RESTORE JSONB PERMISSIONS COLUMN
-- =============================================================================

-- Add permissions column back if it was dropped
ALTER TABLE auth_schema.healthcare_roles 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- Migrate role_permissions back to JSONB
UPDATE auth_schema.healthcare_roles hr
SET permissions = (
  SELECT jsonb_agg(rp.permission_name ORDER BY rp.permission_name)
  FROM auth_schema.role_permissions rp
  WHERE rp.role_id = hr.id AND rp.is_active = true
)
WHERE EXISTS (
  SELECT 1 FROM auth_schema.role_permissions rp WHERE rp.role_id = hr.id
);

-- Set empty array for roles without permissions
UPDATE auth_schema.healthcare_roles
SET permissions = '[]'::jsonb
WHERE permissions IS NULL;

-- Remove deprecated comment
COMMENT ON COLUMN auth_schema.healthcare_roles.permissions IS 
'JSONB array of permissions for this role. Format: ["resource:action", ...]';

-- =============================================================================
-- STEP 3: RESTORE USER_PROFILES.ROLE_TYPE (IF NEEDED)
-- =============================================================================

-- Add role_type column back if it was dropped
ALTER TABLE auth_schema.user_profiles 
ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'patient';

-- Restore role_type from user_roles (take first role if multiple)
UPDATE auth_schema.user_profiles up
SET role_type = (
  SELECT ur.role_name 
  FROM auth_schema.user_roles ur 
  WHERE ur.user_id = up.id 
  ORDER BY ur.assigned_at ASC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM auth_schema.user_roles ur WHERE ur.user_id = up.id
);

-- Add constraint back
ALTER TABLE auth_schema.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_role_type_check;

ALTER TABLE auth_schema.user_profiles
ADD CONSTRAINT user_profiles_role_type_check 
CHECK (role_type IN ('admin', 'doctor', 'patient', 'receptionist', 'nurse', 'pharmacist', 'lab_technician', 'billing_staff'));

-- =============================================================================
-- STEP 4: DROP RELATIONAL RBAC TABLES
-- =============================================================================

-- Drop foreign key constraints first
ALTER TABLE auth_schema.role_permissions 
DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;

ALTER TABLE auth_schema.permission_inheritance 
DROP CONSTRAINT IF EXISTS fk_parent_permission;

ALTER TABLE auth_schema.permission_inheritance 
DROP CONSTRAINT IF EXISTS fk_child_permission;

-- Drop helper functions
DROP FUNCTION IF EXISTS auth_schema.expand_permissions(TEXT[]);

-- Drop tables (backups are preserved)
DROP TABLE IF EXISTS auth_schema.permission_inheritance;
DROP TABLE IF EXISTS auth_schema.role_permissions;
DROP TABLE IF EXISTS auth_schema.permissions;

-- Note: user_permissions and user_roles tables are kept for potential manual restoration
-- They can be dropped manually if not needed:
-- DROP TABLE IF EXISTS auth_schema.user_permissions;
-- DROP TABLE IF EXISTS auth_schema.user_roles;

-- =============================================================================
-- STEP 5: VERIFICATION QUERIES
-- =============================================================================

-- Verify healthcare_roles has JSONB permissions
SELECT 
  role_name,
  jsonb_array_length(permissions) as permission_count,
  permissions
FROM auth_schema.healthcare_roles
ORDER BY role_name;

-- Verify user_profiles has role_type
SELECT 
  role_type,
  COUNT(*) as user_count
FROM auth_schema.user_profiles
GROUP BY role_type
ORDER BY role_type;

-- Check backup tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'auth_schema' AND table_name = t.table_name) as column_count,
  pg_size_pretty(pg_total_relation_size('auth_schema.' || table_name)) as size
FROM information_schema.tables t
WHERE table_schema = 'auth_schema' 
  AND table_name LIKE '%_backup'
ORDER BY table_name;

-- =============================================================================
-- STEP 6: MANUAL RESTORATION GUIDE
-- =============================================================================

-- If you need to restore user_permissions (user-specific overrides):
-- 
-- 1. Review backed up data:
--    SELECT * FROM auth_schema.user_permissions_backup;
-- 
-- 2. Decide how to handle overrides:
--    Option A: Store in user_profiles as JSONB column
--    Option B: Keep in separate table
--    Option C: Manually grant via application
-- 
-- 3. Example: Add JSONB column to user_profiles
--    ALTER TABLE auth_schema.user_profiles 
--    ADD COLUMN permission_overrides JSONB DEFAULT '[]'::jsonb;
-- 
--    UPDATE auth_schema.user_profiles up
--    SET permission_overrides = (
--      SELECT jsonb_agg(permission_name)
--      FROM auth_schema.user_permissions_backup upb
--      WHERE upb.user_id = up.id
--    );

-- =============================================================================
-- STEP 7: CLEANUP INSTRUCTIONS
-- =============================================================================

-- After verifying rollback is successful, you can optionally:
-- 
-- 1. Drop backup tables (ONLY after verification):
--    DROP TABLE IF EXISTS auth_schema.permissions_backup;
--    DROP TABLE IF EXISTS auth_schema.role_permissions_backup;
--    DROP TABLE IF EXISTS auth_schema.user_permissions_backup;
--    DROP TABLE IF EXISTS auth_schema.permission_inheritance_backup;
--    DROP TABLE IF EXISTS auth_schema.user_roles_backup;
-- 
-- 2. Drop unused tables:
--    DROP TABLE IF EXISTS auth_schema.user_permissions;
--    DROP TABLE IF EXISTS auth_schema.user_roles;

-- =============================================================================
-- ROLLBACK COMPLETE
-- =============================================================================

-- Log rollback completion
INSERT INTO auth_schema.audit_logs (action, details, severity)
VALUES (
  'pure_rbac_rollback_complete',
  jsonb_build_object(
    'rollback', '004_pure_rbac_rollback',
    'timestamp', NOW(),
    'roles_with_permissions', (
      SELECT COUNT(*) 
      FROM auth_schema.healthcare_roles 
      WHERE jsonb_array_length(permissions) > 0
    ),
    'backup_tables_created', (
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_schema = 'auth_schema' AND table_name LIKE '%_backup'
    ),
    'warning', 'Review user_permissions_backup for manual restoration if needed'
  ),
  'warning'
);

-- Print success message
DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'ROLLBACK COMPLETE';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Healthcare roles restored to JSONB permissions: %', 
    (SELECT COUNT(*) FROM auth_schema.healthcare_roles WHERE jsonb_array_length(permissions) > 0);
  RAISE NOTICE 'Backup tables created: %', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'auth_schema' AND table_name LIKE '%_backup');
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Review user_permissions_backup for user-specific overrides';
  RAISE NOTICE 'See STEP 6 in this script for manual restoration guide';
  RAISE NOTICE '=============================================================================';
END $$;

