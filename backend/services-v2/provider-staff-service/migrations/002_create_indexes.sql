-- =====================================================
-- Migration: 002_create_indexes.sql
-- Description: Create performance indexes for staff_profiles table
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Date: 2025-01-20
-- =====================================================

-- =====================================================
-- PRIMARY INDEXES (Already created with table)
-- =====================================================
-- staff_profiles_pkey (id)
-- staff_profiles_staff_id_key (staff_id)
-- staff_profiles_license_number_key (license_number)

-- =====================================================
-- BTREE INDEXES (for exact match & range queries)
-- =====================================================

-- User ID lookup (for authentication integration)
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id 
ON provider_schema.staff_profiles(user_id);

-- Staff ID lookup (frequently used in queries)
CREATE INDEX IF NOT EXISTS idx_staff_profiles_staff_id 
ON provider_schema.staff_profiles(staff_id);

-- License number lookup
CREATE INDEX IF NOT EXISTS idx_staff_profiles_license_number 
ON provider_schema.staff_profiles(license_number);

-- Staff type filtering
CREATE INDEX IF NOT EXISTS idx_staff_profiles_staff_type 
ON provider_schema.staff_profiles(staff_type);

-- Status filtering (active/inactive/suspended)
CREATE INDEX IF NOT EXISTS idx_staff_profiles_status 
ON provider_schema.staff_profiles(status);

-- Active status filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_staff_profiles_is_active 
ON provider_schema.staff_profiles(is_active);

-- Employment type filtering
CREATE INDEX IF NOT EXISTS idx_staff_profiles_employment_type 
ON provider_schema.staff_profiles(employment_type);

-- =====================================================
-- JSONB INDEXES (for JSONB field queries)
-- =====================================================

-- Full name search (personal_info->>'fullName')
CREATE INDEX IF NOT EXISTS idx_staff_profiles_full_name 
ON provider_schema.staff_profiles((personal_info->>'fullName'));

-- National ID search (personal_info->>'nationalId')
CREATE INDEX IF NOT EXISTS idx_staff_profiles_national_id 
ON provider_schema.staff_profiles((personal_info->>'nationalId'));

-- Department search (professional_info->>'department')
CREATE INDEX IF NOT EXISTS idx_staff_profiles_department 
ON provider_schema.staff_profiles((professional_info->>'department'));

-- =====================================================
-- GIN INDEXES (for JSONB array queries)
-- =====================================================

-- Specializations search (contains queries)
CREATE INDEX IF NOT EXISTS idx_staff_profiles_specializations_gin 
ON provider_schema.staff_profiles USING gin(specializations);

-- Credentials search (contains queries)
CREATE INDEX IF NOT EXISTS idx_staff_profiles_credentials_gin 
ON provider_schema.staff_profiles USING gin(credentials);

-- Certifications search (contains queries)
CREATE INDEX IF NOT EXISTS idx_staff_profiles_certifications_gin 
ON provider_schema.staff_profiles USING gin(certifications);

-- Department assignments search (contains queries)
CREATE INDEX IF NOT EXISTS idx_staff_department_assignments 
ON provider_schema.staff_profiles USING gin(department_assignments);

-- =====================================================
-- COMPOSITE INDEXES (for common query patterns)
-- =====================================================

-- Active staff by type (most common query)
CREATE INDEX IF NOT EXISTS idx_staff_profiles_active_type 
ON provider_schema.staff_profiles(is_active, staff_type) 
WHERE is_active = true;

-- Active staff by department
CREATE INDEX IF NOT EXISTS idx_staff_profiles_active_department 
ON provider_schema.staff_profiles(is_active, (professional_info->>'department')) 
WHERE is_active = true;

-- Staff by status and type
CREATE INDEX IF NOT EXISTS idx_staff_profiles_status_type 
ON provider_schema.staff_profiles(status, staff_type);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON INDEX provider_schema.idx_staff_profiles_user_id IS 'Fast lookup by user_id for authentication integration';
COMMENT ON INDEX provider_schema.idx_staff_profiles_full_name IS 'Fast search by staff full name';
COMMENT ON INDEX provider_schema.idx_staff_profiles_specializations_gin IS 'GIN index for specializations array queries';
COMMENT ON INDEX provider_schema.idx_staff_department_assignments IS 'GIN index for department assignments queries';

-- =====================================================
-- ROLLBACK
-- =====================================================
-- To rollback this migration:
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_user_id;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_staff_id;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_license_number;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_staff_type;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_status;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_is_active;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_employment_type;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_full_name;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_national_id;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_department;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_specializations_gin;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_credentials_gin;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_certifications_gin;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_department_assignments;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_active_type;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_active_department;
-- DROP INDEX IF EXISTS provider_schema.idx_staff_profiles_status_type;
