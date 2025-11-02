-- Fix user_profiles_role_type_check constraint to include 'nurse'
-- Issue: Constraint missing 'nurse' role causing test failures
-- Date: 2025-10-26
-- Author: Hospital Management Team
--
-- Problem: 
-- - healthcare_roles table has 5 active roles (admin, doctor, nurse, patient, receptionist)
-- - user_roles.role_name_check allows 5 roles
-- - user_profiles.role_type_check only allowed 4 roles (missing 'nurse')
-- - This caused test failures when creating staff users with 'nurse' role
--
-- Solution:
-- - Update user_profiles_role_type_check to include 'nurse'

BEGIN;

-- Drop old constraint
ALTER TABLE auth_schema.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_role_type_check;

-- Add new constraint with all 5 core roles
ALTER TABLE auth_schema.user_profiles
ADD CONSTRAINT user_profiles_role_type_check
CHECK (role_type IN ('admin', 'doctor', 'nurse', 'patient', 'receptionist'));

-- Add comment
COMMENT ON CONSTRAINT user_profiles_role_type_check ON auth_schema.user_profiles IS
'Only allows 5 core roles: admin, doctor, nurse, patient, receptionist (lowercase)';

COMMIT;

-- Verification
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'user_profiles_role_type_check';

