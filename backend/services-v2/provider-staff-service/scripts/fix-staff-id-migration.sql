-- ==========================================
-- STAFF ID CONSISTENCY FIX MIGRATION
-- ==========================================
-- Purpose: Fix DOC-GEN-* staff IDs to INTE-DOC-*
--          and update department assignments

-- Step 1: Backup existing problematic records
CREATE TABLE IF NOT EXISTS provider_schema.staff_profiles_backup_20251114 AS 
SELECT * FROM provider_schema.staff_profiles 
WHERE staff_id LIKE 'DOC-GEN-%';

-- Step 2: Fix staff_id format from DOC-GEN to INTE-DOC
UPDATE provider_schema.staff_profiles 
SET staff_id = REPLACE(staff_id, 'DOC-GEN', 'INTE-DOC')
WHERE staff_id LIKE 'DOC-GEN-%';

-- Step 3: Update department assignments for fixed records
UPDATE provider_schema.staff_profiles 
SET department_assignments = 
  jsonb_set(
    department_assignments, 
    '{0,departmentCode}', 
    '"INTE"'
  )
WHERE staff_id LIKE 'INTE-DOC-%' 
AND department_assignments = '[]'::jsonb;

-- Step 4: Create proper department assignment for records with empty assignments
UPDATE provider_schema.staff_profiles 
SET department_assignments = jsonb_build_object(
  'departmentId', (SELECT id FROM departments_schema.departments WHERE department_code = 'INTE' LIMIT 1),
  'departmentCode', 'INTE',
  'departmentNameEn', 'Internal Medicine',
  'departmentNameVi', 'Nội tổng quát',
  'role', 'General Practitioner',
  'isHead', false,
  'startDate', to_char(created_at, 'YYYY-MM-DD'),
  'endDate', null,
  'isActive', true,
  'isPrimary', true
)
WHERE staff_id LIKE 'INTE-DOC-%' 
AND department_assignments = '[]'::jsonb;

-- Step 5: Verification queries
SELECT 'Migration Summary' as status;

SELECT 
  'Fixed Staff IDs' as description,
  COUNT(*) as count
FROM provider_schema.staff_profiles 
WHERE staff_id LIKE 'INTE-DOC-%';

SELECT 
  'Remaining DOC-GEN IDs' as description,
  COUNT(*) as count
FROM provider_schema.staff_profiles 
WHERE staff_id LIKE 'DOC-GEN-%';

SELECT 
  'Staff with empty department assignments' as description,
  COUNT(*) as count
FROM provider_schema.staff_profiles 
WHERE department_assignments = '[]'::jsonb;

-- Step 6: Sample of fixed records
SELECT 
  staff_id,
  staff_type,
  personal_info->>'fullName' as full_name,
  department_assignments->0->>'departmentCode' as dept_code,
  department_assignments->0->>'departmentNameEn' as dept_name
FROM provider_schema.staff_profiles 
WHERE staff_id LIKE 'INTE-DOC-%'
LIMIT 5;
