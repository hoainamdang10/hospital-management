-- =============================================================================
-- Migration 005: Simplify Roles to 5 Core Roles
-- =============================================================================
-- Purpose: Reduce from 8 roles to 5 core roles for graduation project
-- 
-- Changes:
-- - Remove: PHARMACIST, LAB_TECHNICIAN, BILLING_STAFF
-- - Keep: ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT
-- - Merge permissions:
--   * PHARMACIST → NURSE + DOCTOR (pharmacy permissions)
--   * LAB_TECHNICIAN → NURSE + DOCTOR (lab permissions)
--   * BILLING_STAFF → RECEPTIONIST + ADMIN (billing permissions)
--
-- Author: Hospital Management Team
-- Date: 2025-01-06
-- Version: 2.0.0
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: BACKUP EXISTING DATA
-- =============================================================================

-- Create backup table for role_permissions
CREATE TABLE IF NOT EXISTS auth_schema.role_permissions_backup_20250106 AS
SELECT * FROM auth_schema.role_permissions;

-- Create backup table for user_roles
CREATE TABLE IF NOT EXISTS auth_schema.user_roles_backup_20250106 AS
SELECT * FROM auth_schema.user_roles;

-- =============================================================================
-- STEP 2: MIGRATE USERS FROM DEPRECATED ROLES TO NEW ROLES
-- =============================================================================

-- Migrate PHARMACIST users to NURSE
UPDATE auth_schema.user_roles
SET role_name = 'nurse'
WHERE role_name = 'pharmacist';

-- Migrate LAB_TECHNICIAN users to NURSE
UPDATE auth_schema.user_roles
SET role_name = 'nurse'
WHERE role_name = 'lab_technician';

-- Migrate BILLING_STAFF users to RECEPTIONIST
UPDATE auth_schema.user_roles
SET role_name = 'receptionist'
WHERE role_name = 'billing_staff';

-- =============================================================================
-- STEP 3: ADD PHARMACY PERMISSIONS TO NURSE & DOCTOR
-- =============================================================================

DO $$
DECLARE
  nurse_role_id UUID;
  doctor_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO nurse_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'nurse';
  SELECT id INTO doctor_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'doctor';

  -- Add pharmacy permissions to NURSE (dispensing)
  INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
  VALUES
    ('prescriptions:dispense', 'prescriptions', 'dispense', 'Dispense medication'),
    ('medications:read', 'medications', 'read', 'View medication inventory'),
    ('medications:update', 'medications', 'update', 'Update medication inventory')
  ON CONFLICT (permission_name) DO NOTHING;

  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (nurse_role_id, 'prescriptions:dispense', 'prescriptions', ARRAY['dispense']),
    (nurse_role_id, 'medications:read', 'medications', ARRAY['read']),
    (nurse_role_id, 'medications:update', 'medications', ARRAY['update'])
  ON CONFLICT (role_id, permission_name) DO NOTHING;

  -- Add pharmacy permissions to DOCTOR (prescribing)
  INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
  VALUES
    ('prescriptions:create', 'prescriptions', 'create', 'Write prescription'),
    ('prescriptions:read', 'prescriptions', 'read', 'View prescription'),
    ('prescriptions:update', 'prescriptions', 'update', 'Modify prescription')
  ON CONFLICT (permission_name) DO NOTHING;

  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (doctor_role_id, 'prescriptions:create', 'prescriptions', ARRAY['create']),
    (doctor_role_id, 'prescriptions:read', 'prescriptions', ARRAY['read']),
    (doctor_role_id, 'prescriptions:update', 'prescriptions', ARRAY['update'])
  ON CONFLICT (role_id, permission_name) DO NOTHING;
END $$;

-- =============================================================================
-- STEP 4: ADD LAB PERMISSIONS TO NURSE & DOCTOR
-- =============================================================================

DO $$
DECLARE
  nurse_role_id UUID;
  doctor_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO nurse_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'nurse';
  SELECT id INTO doctor_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'doctor';

  -- Add lab permissions to NURSE (specimen collection)
  INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
  VALUES
    ('lab-orders:read', 'lab-orders', 'read', 'View lab order'),
    ('lab-orders:update', 'lab-orders', 'update', 'Update order status'),
    ('lab-specimens:create', 'lab-specimens', 'create', 'Collect specimen'),
    ('lab-specimens:read', 'lab-specimens', 'read', 'View specimen')
  ON CONFLICT (permission_name) DO NOTHING;

  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (nurse_role_id, 'lab-orders:read', 'lab-orders', ARRAY['read']),
    (nurse_role_id, 'lab-orders:update', 'lab-orders', ARRAY['update']),
    (nurse_role_id, 'lab-specimens:create', 'lab-specimens', ARRAY['create']),
    (nurse_role_id, 'lab-specimens:read', 'lab-specimens', ARRAY['read'])
  ON CONFLICT (role_id, permission_name) DO NOTHING;

  -- Add lab permissions to DOCTOR (ordering)
  INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
  VALUES
    ('lab-orders:create', 'lab-orders', 'create', 'Order lab test'),
    ('lab-results:read', 'lab-results', 'read', 'View lab results')
  ON CONFLICT (permission_name) DO NOTHING;

  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (doctor_role_id, 'lab-orders:create', 'lab-orders', ARRAY['create']),
    (doctor_role_id, 'lab-orders:read', 'lab-orders', ARRAY['read']),
    (doctor_role_id, 'lab-results:read', 'lab-results', ARRAY['read'])
  ON CONFLICT (role_id, permission_name) DO NOTHING;
END $$;

-- =============================================================================
-- STEP 5: ADD BILLING PERMISSIONS TO RECEPTIONIST & ADMIN
-- =============================================================================

DO $$
DECLARE
  receptionist_role_id UUID;
  admin_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO receptionist_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'receptionist';
  SELECT id INTO admin_role_id FROM auth_schema.healthcare_roles WHERE role_name = 'admin';

  -- Add billing permissions to RECEPTIONIST
  INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description)
  VALUES
    ('billing:create', 'billing', 'create', 'Create invoice'),
    ('billing:read', 'billing', 'read', 'View invoice'),
    ('billing:update', 'billing', 'update', 'Update invoice'),
    ('payments:create', 'payments', 'create', 'Process payment'),
    ('payments:read', 'payments', 'read', 'View payment')
  ON CONFLICT (permission_name) DO NOTHING;

  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (receptionist_role_id, 'billing:create', 'billing', ARRAY['create']),
    (receptionist_role_id, 'billing:read', 'billing', ARRAY['read']),
    (receptionist_role_id, 'billing:update', 'billing', ARRAY['update']),
    (receptionist_role_id, 'payments:create', 'payments', ARRAY['create']),
    (receptionist_role_id, 'payments:read', 'payments', ARRAY['read'])
  ON CONFLICT (role_id, permission_name) DO NOTHING;

  -- Add billing permissions to ADMIN (full access)
  INSERT INTO auth_schema.role_permissions (role_id, permission_name, resource_type, actions)
  VALUES
    (admin_role_id, 'billing:create', 'billing', ARRAY['create']),
    (admin_role_id, 'billing:read', 'billing', ARRAY['read']),
    (admin_role_id, 'billing:update', 'billing', ARRAY['update']),
    (admin_role_id, 'billing:delete', 'billing', ARRAY['delete']),
    (admin_role_id, 'payments:create', 'payments', ARRAY['create']),
    (admin_role_id, 'payments:read', 'payments', ARRAY['read']),
    (admin_role_id, 'payments:update', 'payments', ARRAY['update']),
    (admin_role_id, 'payments:delete', 'payments', ARRAY['delete'])
  ON CONFLICT (role_id, permission_name) DO NOTHING;
END $$;

-- =============================================================================
-- STEP 6: DELETE DEPRECATED ROLE PERMISSIONS
-- =============================================================================

-- Delete role_permissions for deprecated roles
DELETE FROM auth_schema.role_permissions
WHERE role_id IN (
  SELECT id FROM auth_schema.healthcare_roles
  WHERE role_name IN ('pharmacist', 'lab_technician', 'billing_staff')
);

-- =============================================================================
-- STEP 7: DEACTIVATE DEPRECATED ROLES
-- =============================================================================

-- Mark deprecated roles as inactive (don't delete for audit trail)
UPDATE auth_schema.healthcare_roles
SET is_active = false,
    role_description = role_description || ' [DEPRECATED - Merged into other roles]'
WHERE role_name IN ('pharmacist', 'lab_technician', 'billing_staff');

-- =============================================================================
-- STEP 8: UPDATE ROLE DESCRIPTIONS
-- =============================================================================

UPDATE auth_schema.healthcare_roles
SET role_description = 'System administrator with full access (includes billing management)'
WHERE role_name = 'admin';

UPDATE auth_schema.healthcare_roles
SET role_description = 'Medical doctor (includes pharmacy orders & lab orders)'
WHERE role_name = 'doctor';

UPDATE auth_schema.healthcare_roles
SET role_description = 'Registered nurse (includes pharmacy dispensing & lab specimen collection)'
WHERE role_name = 'nurse';

UPDATE auth_schema.healthcare_roles
SET role_description = 'Front desk receptionist (includes billing & payment processing)'
WHERE role_name = 'receptionist';

-- =============================================================================
-- STEP 9: VERIFICATION
-- =============================================================================

-- Verify 5 active roles
DO $$
DECLARE
  active_role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_role_count
  FROM auth_schema.healthcare_roles
  WHERE is_active = true;

  IF active_role_count != 5 THEN
    RAISE EXCEPTION 'Expected 5 active roles, found %', active_role_count;
  END IF;

  RAISE NOTICE 'Migration successful: 5 active roles confirmed';
END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================
-- To rollback this migration:
-- 1. Restore role_permissions from backup:
--    INSERT INTO auth_schema.role_permissions SELECT * FROM auth_schema.role_permissions_backup_20250106;
-- 2. Restore user_roles from backup:
--    INSERT INTO auth_schema.user_roles SELECT * FROM auth_schema.user_roles_backup_20250106;
-- 3. Reactivate deprecated roles:
--    UPDATE auth_schema.healthcare_roles SET is_active = true WHERE role_name IN ('pharmacist', 'lab_technician', 'billing_staff');
-- =============================================================================

