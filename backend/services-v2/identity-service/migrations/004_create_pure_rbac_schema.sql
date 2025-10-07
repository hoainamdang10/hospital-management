-- Migration: Create Pure RBAC Schema
-- Purpose: Transform from Hybrid RBAC (JSONB permissions) to Pure RBAC (relational)
-- Date: 2025-01-06
-- Author: Hospital Management Team
-- 
-- This migration:
-- 1. Creates permissions master table
-- 2. Creates permission_inheritance table for hierarchy
-- 3. Migrates healthcare_roles.permissions (JSONB) to role_permissions (relational)
-- 4. Adds missing roles (nurse, pharmacist, lab_technician, billing_staff)
-- 5. Creates helper functions for permission expansion
-- 
-- IMPORTANT: Run this migration during maintenance window
-- Estimated time: 5-10 minutes
-- Rollback: See 004_pure_rbac_rollback.sql

-- =============================================================================
-- STEP 1: CREATE PERMISSIONS MASTER TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS auth_schema.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name TEXT UNIQUE NOT NULL,
  resource_type TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation: permission_name must match pattern resource:action
  CONSTRAINT permission_name_format CHECK (
    permission_name = '*' OR 
    permission_name ~ '^[a-z0-9_:-]+:[a-z0-9_:-]+$'
  )
);

-- Indexes for performance
CREATE INDEX idx_permissions_resource_type ON auth_schema.permissions(resource_type);
CREATE INDEX idx_permissions_action ON auth_schema.permissions(action);
CREATE INDEX idx_permissions_is_active ON auth_schema.permissions(is_active);

COMMENT ON TABLE auth_schema.permissions IS 
'Master table of all permissions in the system. Format: resource:action (e.g., patients:read, lab-results:write)';

-- =============================================================================
-- STEP 2: CREATE PERMISSION INHERITANCE TABLE (HIERARCHY)
-- =============================================================================

CREATE TABLE IF NOT EXISTS auth_schema.permission_inheritance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_permission TEXT NOT NULL,
  child_permission TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(parent_permission, child_permission),
  
  -- Foreign keys to permissions table
  CONSTRAINT fk_parent_permission 
    FOREIGN KEY (parent_permission) 
    REFERENCES auth_schema.permissions(permission_name) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_child_permission 
    FOREIGN KEY (child_permission) 
    REFERENCES auth_schema.permissions(permission_name) 
    ON DELETE CASCADE
);

-- Index for hierarchy queries
CREATE INDEX idx_permission_inheritance_parent ON auth_schema.permission_inheritance(parent_permission);
CREATE INDEX idx_permission_inheritance_child ON auth_schema.permission_inheritance(child_permission);

COMMENT ON TABLE auth_schema.permission_inheritance IS 
'Defines permission hierarchy. Parent permission implies child permission (e.g., write:patients implies read:patients)';

-- =============================================================================
-- STEP 3: EXTRACT PERMISSIONS FROM EXISTING JSONB
-- =============================================================================

-- Insert unique permissions from healthcare_roles.permissions (JSONB)
INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
SELECT DISTINCT
  perm::text,
  CASE 
    WHEN perm::text = '*' THEN '*'
    ELSE split_part(perm::text, ':', 1)
  END as resource_type,
  CASE 
    WHEN perm::text = '*' THEN '*'
    ELSE split_part(perm::text, ':', 2)
  END as action,
  'Migrated from healthcare_roles.permissions' as description
FROM auth_schema.healthcare_roles,
     jsonb_array_elements_text(permissions) as perm
WHERE permissions IS NOT NULL
ON CONFLICT (permission_name) DO NOTHING;

-- =============================================================================
-- STEP 4: POPULATE ROLE_PERMISSIONS FROM JSONB
-- =============================================================================

-- Clear existing data (if any)
TRUNCATE TABLE auth_schema.role_permissions;

-- Migrate from JSONB to relational
INSERT INTO auth_schema.role_permissions (
  role_id, 
  permission_name, 
  resource_type, 
  actions,
  is_active
)
SELECT 
  hr.id as role_id,
  perm::text as permission_name,
  CASE 
    WHEN perm::text = '*' THEN '*'
    ELSE split_part(perm::text, ':', 1)
  END as resource_type,
  CASE 
    WHEN perm::text = '*' THEN ARRAY['*']
    ELSE ARRAY[split_part(perm::text, ':', 2)]
  END as actions,
  true as is_active
FROM auth_schema.healthcare_roles hr,
     jsonb_array_elements_text(hr.permissions) as perm
WHERE hr.permissions IS NOT NULL;

-- =============================================================================
-- STEP 5: ADD MISSING ROLES
-- =============================================================================

-- Add 4 missing roles with default permissions
INSERT INTO auth_schema.healthcare_roles (role_name, role_description, is_active)
VALUES
  ('nurse', 'Registered Nurse', true),
  ('pharmacist', 'Licensed Pharmacist', true),
  ('lab_technician', 'Laboratory Technician', true),
  ('billing_staff', 'Billing and Payment Staff', true)
ON CONFLICT (role_name) DO NOTHING;

-- Add permissions for new roles
DO $$
DECLARE
  nurse_role_id UUID;
  pharmacist_role_id UUID;
  lab_tech_role_id UUID;
  billing_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO nurse_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'nurse';
  SELECT id INTO pharmacist_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'pharmacist';
  SELECT id INTO lab_tech_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'lab_technician';
  SELECT id INTO billing_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'billing_staff';

  -- Nurse permissions
  INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
  VALUES
    ('patients:read', 'patients', 'read', 'View patient information'),
    ('patients:update', 'patients', 'update', 'Update patient information'),
    ('medical-records:read', 'medical-records', 'read', 'View medical records'),
    ('medical-records:update', 'medical-records', 'update', 'Update medical records'),
    ('appointments:read', 'appointments', 'read', 'View appointments'),
    ('vital-signs:create', 'vital-signs', 'create', 'Record vital signs'),
    ('vital-signs:read', 'vital-signs', 'read', 'View vital signs')
  ON CONFLICT (permission_name) DO NOTHING;

  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (nurse_role_id, 'patients:read', 'patients', ARRAY['read']),
    (nurse_role_id, 'patients:update', 'patients', ARRAY['update']),
    (nurse_role_id, 'medical-records:read', 'medical-records', ARRAY['read']),
    (nurse_role_id, 'medical-records:update', 'medical-records', ARRAY['update']),
    (nurse_role_id, 'appointments:read', 'appointments', ARRAY['read']),
    (nurse_role_id, 'vital-signs:create', 'vital-signs', ARRAY['create']),
    (nurse_role_id, 'vital-signs:read', 'vital-signs', ARRAY['read']);

  -- Pharmacist permissions
  INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
  VALUES
    ('prescriptions:read', 'prescriptions', 'read', 'View prescriptions'),
    ('prescriptions:update', 'prescriptions', 'update', 'Update prescription status'),
    ('medications:read', 'medications', 'read', 'View medication inventory'),
    ('medications:update', 'medications', 'update', 'Update medication inventory')
  ON CONFLICT (permission_name) DO NOTHING;

  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (pharmacist_role_id, 'prescriptions:read', 'prescriptions', ARRAY['read']),
    (pharmacist_role_id, 'prescriptions:update', 'prescriptions', ARRAY['update']),
    (pharmacist_role_id, 'medications:read', 'medications', ARRAY['read']),
    (pharmacist_role_id, 'medications:update', 'medications', ARRAY['update']);

  -- Lab Technician permissions
  INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
  VALUES
    ('lab-results:create', 'lab-results', 'create', 'Create lab results'),
    ('lab-results:read', 'lab-results', 'read', 'View lab results'),
    ('lab-results:update', 'lab-results', 'update', 'Update lab results'),
    ('lab-orders:read', 'lab-orders', 'read', 'View lab orders')
  ON CONFLICT (permission_name) DO NOTHING;

  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (lab_tech_role_id, 'lab-results:create', 'lab-results', ARRAY['create']),
    (lab_tech_role_id, 'lab-results:read', 'lab-results', ARRAY['read']),
    (lab_tech_role_id, 'lab-results:update', 'lab-results', ARRAY['update']),
    (lab_tech_role_id, 'lab-orders:read', 'lab-orders', ARRAY['read']);

  -- Billing Staff permissions
  INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
  VALUES
    ('billing:create', 'billing', 'create', 'Create billing records'),
    ('billing:read', 'billing', 'read', 'View billing records'),
    ('billing:update', 'billing', 'update', 'Update billing records'),
    ('payments:create', 'payments', 'create', 'Process payments'),
    ('payments:read', 'payments', 'read', 'View payment records'),
    ('invoices:create', 'invoices', 'create', 'Create invoices'),
    ('invoices:read', 'invoices', 'read', 'View invoices')
  ON CONFLICT (permission_name) DO NOTHING;

  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (billing_role_id, 'billing:create', 'billing', ARRAY['create']),
    (billing_role_id, 'billing:read', 'billing', ARRAY['read']),
    (billing_role_id, 'billing:update', 'billing', ARRAY['update']),
    (billing_role_id, 'payments:create', 'payments', ARRAY['create']),
    (billing_role_id, 'payments:read', 'payments', ARRAY['read']),
    (billing_role_id, 'invoices:create', 'invoices', ARRAY['create']),
    (billing_role_id, 'invoices:read', 'invoices', ARRAY['read']);
END $$;

-- =============================================================================
-- STEP 6: SEED PERMISSION HIERARCHY
-- =============================================================================

-- Insert permission hierarchy rules
INSERT INTO auth_schema.permission_inheritance (parent_permission, child_permission, description)
VALUES
  -- Write implies read
  ('patients:update', 'patients:read', 'Update permission implies read permission'),
  ('medical-records:update', 'medical-records:read', 'Update permission implies read permission'),
  ('appointments:update', 'appointments:read', 'Update permission implies read permission'),
  ('prescriptions:update', 'prescriptions:read', 'Update permission implies read permission'),
  ('lab-results:update', 'lab-results:read', 'Update permission implies read permission'),
  ('billing:update', 'billing:read', 'Update permission implies read permission'),
  
  -- Delete implies write and read
  ('patients:delete', 'patients:update', 'Delete permission implies update permission'),
  ('patients:delete', 'patients:read', 'Delete permission implies read permission'),
  ('medical-records:delete', 'medical-records:update', 'Delete permission implies update permission'),
  ('medical-records:delete', 'medical-records:read', 'Delete permission implies read permission')
ON CONFLICT (parent_permission, child_permission) DO NOTHING;

-- =============================================================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to expand permissions with hierarchy
CREATE OR REPLACE FUNCTION auth_schema.expand_permissions(
  input_permissions TEXT[]
) RETURNS TEXT[] AS $$
DECLARE
  expanded TEXT[];
  perm TEXT;
  child TEXT;
  iteration INT := 0;
  max_iterations INT := 10;  -- Prevent infinite loops
BEGIN
  expanded := input_permissions;
  
  -- Expand permissions recursively
  LOOP
    iteration := iteration + 1;
    EXIT WHEN iteration > max_iterations;
    
    DECLARE
      new_permissions TEXT[] := expanded;
    BEGIN
      -- For each permission, add its children
      FOREACH perm IN ARRAY expanded LOOP
        FOR child IN 
          SELECT child_permission 
          FROM auth_schema.permission_inheritance 
          WHERE parent_permission = perm
        LOOP
          IF NOT (child = ANY(new_permissions)) THEN
            new_permissions := array_append(new_permissions, child);
          END IF;
        END LOOP;
      END LOOP;
      
      -- Exit if no new permissions added
      EXIT WHEN array_length(new_permissions, 1) = array_length(expanded, 1);
      
      expanded := new_permissions;
    END;
  END LOOP;
  
  RETURN expanded;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION auth_schema.expand_permissions(TEXT[]) IS 
'Expands permissions by including all child permissions from hierarchy. Example: write:patients → [write:patients, read:patients]';

-- =============================================================================
-- STEP 8: DROP JSONB PERMISSIONS COLUMN (AFTER VERIFICATION)
-- =============================================================================

-- IMPORTANT: Only run this after verifying migration is successful
-- Uncomment the line below after verification:
-- ALTER TABLE auth_schema.healthcare_roles DROP COLUMN IF EXISTS permissions;

-- For now, keep the column for rollback safety
COMMENT ON COLUMN auth_schema.healthcare_roles.permissions IS 
'DEPRECATED: Permissions migrated to role_permissions table. Will be dropped after verification.';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify permissions table
SELECT COUNT(*) as total_permissions FROM auth_schema.permissions;

-- Verify role_permissions
SELECT 
  hr.role_name,
  COUNT(rp.id) as permission_count
FROM auth_schema.healthcare_roles hr
LEFT JOIN auth_schema.role_permissions rp ON hr.id = rp.role_id
GROUP BY hr.role_name
ORDER BY hr.role_name;

-- Verify permission hierarchy
SELECT COUNT(*) as hierarchy_rules FROM auth_schema.permission_inheritance;

-- Test permission expansion
SELECT auth_schema.expand_permissions(ARRAY['patients:update']);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log migration completion
INSERT INTO auth_schema.audit_logs (action, details, severity)
VALUES (
  'pure_rbac_migration_complete',
  jsonb_build_object(
    'migration', '004_create_pure_rbac_schema',
    'timestamp', NOW(),
    'permissions_count', (SELECT COUNT(*) FROM auth_schema.permissions),
    'roles_count', (SELECT COUNT(*) FROM auth_schema.healthcare_roles),
    'hierarchy_rules', (SELECT COUNT(*) FROM auth_schema.permission_inheritance)
  ),
  'info'
);

