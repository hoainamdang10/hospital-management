-- =====================================================
-- Migration: Migrate Departments to Provider Schema
-- Version: 004
-- Date: 2025-01-16
-- Description: Move departments tables from departments_schema to provider_schema
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Create departments table in provider_schema
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_schema.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Identifier
  department_code TEXT NOT NULL UNIQUE,
  
  -- Department Names (Bilingual)
  department_name_en TEXT NOT NULL,
  department_name_vi TEXT NOT NULL,
  
  -- Contact Information
  description TEXT,
  phone TEXT,
  email TEXT,
  location TEXT,
  
  -- Department Head
  head_of_department_id TEXT,
  head_of_department_name TEXT,
  head_of_department_email TEXT,
  
  -- Statistics
  staff_count INTEGER DEFAULT 0,
  active_staff_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  
  -- Constraints
  CONSTRAINT chk_department_code_format CHECK (department_code ~ '^[A-Z0-9_-]+$'),
  CONSTRAINT chk_staff_counts CHECK (active_staff_count <= staff_count)
);

-- =====================================================
-- STEP 2: Create department_staff_assignments table
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_schema.department_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  department_id UUID NOT NULL REFERENCES provider_schema.departments(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL, -- Soft reference to staff_profiles
  
  -- Assignment Details
  staff_name TEXT,
  assignment_type TEXT DEFAULT 'MEMBER', -- PRIMARY, MEMBER, TEMPORARY
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit Fields
  assigned_by TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(department_id, staff_id)
);

-- =====================================================
-- STEP 3: Create indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_departments_code ON provider_schema.departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON provider_schema.departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_head ON provider_schema.departments(head_of_department_id);

CREATE INDEX IF NOT EXISTS idx_dept_assignments_dept ON provider_schema.department_staff_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_assignments_staff ON provider_schema.department_staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_dept_assignments_active ON provider_schema.department_staff_assignments(is_active);

-- =====================================================
-- STEP 4: Migrate data from departments_schema
-- =====================================================
-- Migrate departments
INSERT INTO provider_schema.departments (
  id, department_code, department_name_en, department_name_vi,
  description, phone, email, location,
  head_of_department_id, head_of_department_name, head_of_department_email,
  staff_count, active_staff_count, is_active,
  created_at, updated_at, created_by, updated_by
)
SELECT 
  id, department_code, department_name_en, department_name_vi,
  description, phone, email, location,
  head_of_department_id, head_of_department_name, head_of_department_email,
  staff_count, active_staff_count, is_active,
  created_at, updated_at, created_by, updated_by
FROM departments_schema.departments
ON CONFLICT (id) DO NOTHING;

-- Migrate department_staff_assignments
INSERT INTO provider_schema.department_staff_assignments (
  id, department_id, staff_id, staff_name, assignment_type,
  is_active, assigned_by, assigned_at, updated_at
)
SELECT 
  id, department_id, staff_id, staff_name, assignment_type,
  is_active, assigned_by, assigned_at, updated_at
FROM departments_schema.department_staff_assignments
ON CONFLICT (department_id, staff_id) DO NOTHING;

-- =====================================================
-- STEP 5: Verify migration
-- =====================================================
DO $$
DECLARE
  old_dept_count INTEGER;
  new_dept_count INTEGER;
  old_assign_count INTEGER;
  new_assign_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_dept_count FROM departments_schema.departments;
  SELECT COUNT(*) INTO new_dept_count FROM provider_schema.departments;
  SELECT COUNT(*) INTO old_assign_count FROM departments_schema.department_staff_assignments;
  SELECT COUNT(*) INTO new_assign_count FROM provider_schema.department_staff_assignments;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Departments: % -> %', old_dept_count, new_dept_count;
  RAISE NOTICE '  Assignments: % -> %', old_assign_count, new_assign_count;
  
  IF old_dept_count != new_dept_count THEN
    RAISE EXCEPTION 'Department count mismatch! Old: %, New: %', old_dept_count, new_dept_count;
  END IF;
  
  IF old_assign_count != new_assign_count THEN
    RAISE EXCEPTION 'Assignment count mismatch! Old: %, New: %', old_assign_count, new_assign_count;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004 completed successfully!';
  RAISE NOTICE '   - Departments migrated to provider_schema';
  RAISE NOTICE '   - Ready to drop departments_schema';
END $$;

