-- =====================================================
-- Migration: 004_create_read_model.sql
-- Description: Create optimized read model for CQRS pattern
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Date: 2025-01-20
-- Pattern: CQRS Read Model
-- =====================================================

-- =====================================================
-- READ MODEL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_schema.staff_read_model (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  
  -- Denormalized fields for fast queries
  full_name VARCHAR(255) NOT NULL,
  staff_type VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  specialization VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  employment_type VARCHAR(20) NOT NULL,
  
  -- Contact information (denormalized)
  email VARCHAR(255),
  phone_number VARCHAR(20),
  
  -- Professional summary
  title VARCHAR(100),
  years_of_experience INTEGER DEFAULT 0,
  license_number VARCHAR(100) NOT NULL,
  
  -- Availability summary
  is_available_today BOOLEAN DEFAULT true,
  next_available_date DATE,
  
  -- Department summary
  primary_department_id VARCHAR(50),
  primary_department_name VARCHAR(100),
  
  -- Timestamps
  last_synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Full data reference (for complex queries)
  full_data JSONB NOT NULL,
  
  -- Search vector for full-text search
  search_vector tsvector
);

-- =====================================================
-- INDEXES FOR READ MODEL
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_staff_read_model_staff_id 
ON provider_schema.staff_read_model(staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_read_model_user_id 
ON provider_schema.staff_read_model(user_id);

-- Filter indexes
CREATE INDEX IF NOT EXISTS idx_staff_read_model_staff_type 
ON provider_schema.staff_read_model(staff_type);

CREATE INDEX IF NOT EXISTS idx_staff_read_model_department 
ON provider_schema.staff_read_model(department);

CREATE INDEX IF NOT EXISTS idx_staff_read_model_status 
ON provider_schema.staff_read_model(status);

CREATE INDEX IF NOT EXISTS idx_staff_read_model_is_active 
ON provider_schema.staff_read_model(is_active);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_staff_read_model_active_type 
ON provider_schema.staff_read_model(is_active, staff_type) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_staff_read_model_active_department 
ON provider_schema.staff_read_model(is_active, department) 
WHERE is_active = true;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_staff_read_model_search_vector 
ON provider_schema.staff_read_model USING gin(search_vector);

-- JSONB index for complex queries
CREATE INDEX IF NOT EXISTS idx_staff_read_model_full_data 
ON provider_schema.staff_read_model USING gin(full_data);

-- =====================================================
-- SYNC FUNCTION (Write Model → Read Model)
-- =====================================================
CREATE OR REPLACE FUNCTION provider_schema.sync_staff_read_model()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update read model
  INSERT INTO provider_schema.staff_read_model (
    staff_id,
    user_id,
    full_name,
    staff_type,
    department,
    specialization,
    status,
    is_active,
    employment_type,
    email,
    phone_number,
    title,
    years_of_experience,
    license_number,
    is_available_today,
    primary_department_id,
    primary_department_name,
    full_data,
    search_vector,
    last_synced_at
  ) VALUES (
    NEW.staff_id,
    NEW.user_id,
    NEW.personal_info->>'fullName',
    NEW.staff_type,
    NEW.professional_info->>'department',
    COALESCE(NEW.specializations->0->>'name', ''),
    NEW.status,
    NEW.is_active,
    NEW.employment_type,
    NEW.personal_info->>'email',
    NEW.personal_info->>'phoneNumber',
    NEW.professional_info->>'title',
    NEW.years_of_experience,
    NEW.license_number,
    true, -- Default to available
    NEW.department_assignments->0->>'departmentId',
    NEW.department_assignments->0->>'departmentName',
    to_jsonb(NEW),
    to_tsvector('english', 
      COALESCE(NEW.personal_info->>'fullName', '') || ' ' ||
      COALESCE(NEW.professional_info->>'department', '') || ' ' ||
      COALESCE(NEW.professional_info->>'title', '') || ' ' ||
      COALESCE(NEW.staff_type, '')
    ),
    NOW()
  )
  ON CONFLICT (staff_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = EXCLUDED.full_name,
    staff_type = EXCLUDED.staff_type,
    department = EXCLUDED.department,
    specialization = EXCLUDED.specialization,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    employment_type = EXCLUDED.employment_type,
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    title = EXCLUDED.title,
    years_of_experience = EXCLUDED.years_of_experience,
    license_number = EXCLUDED.license_number,
    primary_department_id = EXCLUDED.primary_department_id,
    primary_department_name = EXCLUDED.primary_department_name,
    full_data = EXCLUDED.full_data,
    search_vector = EXCLUDED.search_vector,
    last_synced_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_staff_read_model_trigger ON provider_schema.staff_profiles;
CREATE TRIGGER sync_staff_read_model_trigger
AFTER INSERT OR UPDATE ON provider_schema.staff_profiles
FOR EACH ROW
EXECUTE FUNCTION provider_schema.sync_staff_read_model();

-- =====================================================
-- INITIAL SYNC (Populate read model from existing data)
-- =====================================================
INSERT INTO provider_schema.staff_read_model (
  staff_id,
  user_id,
  full_name,
  staff_type,
  department,
  specialization,
  status,
  is_active,
  employment_type,
  email,
  phone_number,
  title,
  years_of_experience,
  license_number,
  primary_department_id,
  primary_department_name,
  full_data,
  search_vector,
  last_synced_at
)
SELECT 
  staff_id,
  user_id,
  personal_info->>'fullName',
  staff_type,
  professional_info->>'department',
  COALESCE(specializations->0->>'name', ''),
  status,
  is_active,
  employment_type,
  personal_info->>'email',
  personal_info->>'phoneNumber',
  professional_info->>'title',
  years_of_experience,
  license_number,
  department_assignments->0->>'departmentId',
  department_assignments->0->>'departmentName',
  to_jsonb(staff_profiles.*),
  to_tsvector('english', 
    COALESCE(personal_info->>'fullName', '') || ' ' ||
    COALESCE(professional_info->>'department', '') || ' ' ||
    COALESCE(professional_info->>'title', '') || ' ' ||
    COALESCE(staff_type, '')
  ),
  NOW()
FROM provider_schema.staff_profiles
ON CONFLICT (staff_id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE provider_schema.staff_read_model 
IS 'CQRS read model - Denormalized data from multiple sources for query optimization. Auto-synced from staff_profiles via trigger.';

COMMENT ON COLUMN provider_schema.staff_read_model.search_vector 
IS 'Full-text search vector for staff search';

COMMENT ON COLUMN provider_schema.staff_read_model.full_data 
IS 'Complete staff data from write model (staff_profiles) - Snapshot for complex queries';

COMMENT ON COLUMN provider_schema.staff_read_model.last_synced_at 
IS 'Timestamp of last synchronization from write model - For monitoring sync lag';

-- =====================================================
-- ROLLBACK
-- =====================================================
-- To rollback this migration:
-- DROP TRIGGER IF EXISTS sync_staff_read_model_trigger ON provider_schema.staff_profiles;
-- DROP FUNCTION IF EXISTS provider_schema.sync_staff_read_model();
-- DROP TABLE IF EXISTS provider_schema.staff_read_model CASCADE;
