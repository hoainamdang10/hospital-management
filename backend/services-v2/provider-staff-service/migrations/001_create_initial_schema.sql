-- =====================================================
-- Migration: 001_create_initial_schema.sql
-- Description: Create initial provider_schema and staff_profiles table
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Date: 2025-01-20
-- =====================================================

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS provider_schema;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MAIN TABLE: staff_profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_schema.staff_profiles (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  
  -- Staff Type & Status
  staff_type VARCHAR(50) NOT NULL CHECK (staff_type IN ('doctor', 'nurse', 'technician', 'pharmacist', 'therapist', 'admin', 'receptionist')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'on_leave', 'terminated')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Employment Information
  employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'volunteer')),
  hire_date DATE NOT NULL,
  contract_end_date DATE,
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  
  -- License Information
  license_number VARCHAR(100) NOT NULL UNIQUE,
  vietnamese_healthcare_license VARCHAR(100),
  moh_registration_number VARCHAR(100),
  
  -- JSONB Columns for Complex Data
  personal_info JSONB NOT NULL,
  professional_info JSONB NOT NULL,
  work_schedule JSONB NOT NULL,
  specializations JSONB DEFAULT '[]'::jsonb,
  credentials JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  availability JSONB DEFAULT '[]'::jsonb,
  department_assignments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  registration_date TIMESTAMP NOT NULL DEFAULT NOW(),
  last_active_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Audit Fields
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
  
  -- Constraints
  CONSTRAINT staff_profiles_staff_id_format CHECK (staff_id ~ '^[A-Z]{3}-[A-Z]{4}-[0-9]{6}-[0-9]{3}$'),
  CONSTRAINT staff_profiles_years_of_experience_check CHECK (years_of_experience >= 0)
);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE provider_schema.staff_profiles IS 'Main aggregate table for all healthcare staff (doctors, nurses, technicians, etc.)';
COMMENT ON COLUMN provider_schema.staff_profiles.staff_id IS 'Vietnamese Healthcare Staff ID format: {TYPE}-{DEPT}-YYYYMM-XXX';
COMMENT ON COLUMN provider_schema.staff_profiles.personal_info IS 'JSONB: fullName, dateOfBirth, gender, nationalId, phoneNumber, email, address';
COMMENT ON COLUMN provider_schema.staff_profiles.professional_info IS 'JSONB: title, department, education, languages';
COMMENT ON COLUMN provider_schema.staff_profiles.work_schedule IS 'JSONB: workingDays, workingHours, breakTime';
COMMENT ON COLUMN provider_schema.staff_profiles.specializations IS 'JSONB array: [{name, level, yearsOfExperience}]';
COMMENT ON COLUMN provider_schema.staff_profiles.credentials IS 'JSONB array: [{type, number, issuedBy, issuedDate, expiryDate, isVerified}]';
COMMENT ON COLUMN provider_schema.staff_profiles.certifications IS 'JSONB array: [{name, issuingOrganization, issueDate, expiryDate}]';
COMMENT ON COLUMN provider_schema.staff_profiles.availability IS 'JSONB array: [{date, isAvailable, reason}]';
COMMENT ON COLUMN provider_schema.staff_profiles.department_assignments IS 'JSONB array: [{departmentId, departmentName, role, startDate, endDate, isPrimary}]';

-- =====================================================
-- ROLLBACK
-- =====================================================
-- To rollback this migration:
-- DROP TABLE IF EXISTS provider_schema.staff_profiles CASCADE;
-- DROP SCHEMA IF EXISTS provider_schema CASCADE;
