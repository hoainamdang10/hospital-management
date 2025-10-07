-- Migration: Fix staff_invitations role constraint to allow uppercase
-- Purpose: Allow uppercase role values (ADMIN, DOCTOR, NURSE, RECEPTIONIST)
-- Schema: auth_schema
-- Date: 2025-01-06
--
-- Issue: Current constraint only allows lowercase ('doctor', 'admin', 'staff', 'receptionist')
-- But code uses uppercase ('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')
-- This causes constraint violation when provisioning staff

-- Drop existing constraint
ALTER TABLE auth_schema.staff_invitations
DROP CONSTRAINT IF EXISTS staff_invitations_role_check;

-- Add new constraint with uppercase values matching 5 core roles
ALTER TABLE auth_schema.staff_invitations
ADD CONSTRAINT staff_invitations_role_check
CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'));

-- Also fix status constraint to use uppercase for consistency
ALTER TABLE auth_schema.staff_invitations
DROP CONSTRAINT IF EXISTS staff_invitations_status_check;

ALTER TABLE auth_schema.staff_invitations
ADD CONSTRAINT staff_invitations_status_check
CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'));

-- Update existing records to uppercase (if any)
UPDATE auth_schema.staff_invitations
SET role = UPPER(role),
    status = UPPER(status)
WHERE role IS NOT NULL OR status IS NOT NULL;

-- Add comment
COMMENT ON CONSTRAINT staff_invitations_role_check ON auth_schema.staff_invitations IS
'Only allows 5 core staff roles: ADMIN, DOCTOR, NURSE, RECEPTIONIST (uppercase)';

COMMENT ON CONSTRAINT staff_invitations_status_check ON auth_schema.staff_invitations IS
'Only allows: PENDING, ACCEPTED, EXPIRED, CANCELLED (uppercase)';

