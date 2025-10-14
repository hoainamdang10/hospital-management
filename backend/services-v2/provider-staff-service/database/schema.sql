-- Provider Staff Service V2 - Database Schema
-- Clean Architecture + DDD + Vietnamese Healthcare Standards
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Compliance: HIPAA, Vietnamese Healthcare Regulations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create provider_schema if not exists
CREATE SCHEMA IF NOT EXISTS provider_schema;

-- =====================================================
-- 1. STAFF_PROFILES TABLE (Main aggregate root)
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_schema.staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(30) UNIQUE NOT NULL,  -- {TYPE}-{DEPT}-YYYYMM-XXX (e.g., DOC-CARD-202501-001)
  user_id UUID NOT NULL,  -- Reference to auth_schema.user_profiles(id)
  
  -- Staff Type (Multi-type support)
  staff_type VARCHAR(20) NOT NULL,  -- doctor, nurse, technician, pharmacist, therapist, admin, receptionist
  
  -- Personal Info (JSONB for flexibility and privacy)
  personal_info JSONB NOT NULL,
  -- {
  --   "fullName": "Nguyễn Văn A",
  --   "dateOfBirth": "1980-01-01",
  --   "gender": "male",
  --   "nationalId": "123456789",
  --   "nationality": "Vietnamese",
  --   "phoneNumber": "0901234567",
  --   "email": "doctor@hospital.com",
  --   "address": {
  --     "street": "123 Đường ABC",
  --     "ward": "Phường XYZ",
  --     "district": "Quận 1",
  --     "city": "Hà Nội",
  --     "province": "Hà Nội",
  --     "country": "Vietnam"
  --   }
  -- }
  
  -- Professional Info (JSONB for flexibility)
  professional_info JSONB NOT NULL,
  -- {
  --   "title": "Dr.",
  --   "department": "Cardiology",
  --   "position": "Senior Consultant",
  --   "education": ["MD - Hanoi Medical University", "PhD - Cardiology"],
  --   "languages": ["Vietnamese", "English"],
  --   "bio": "Experienced cardiologist with 15 years of practice"
  -- }
  
  -- Work Schedule (JSONB for flexibility)
  work_schedule JSONB NOT NULL,
  -- {
  --   "shifts": [
  --     {"day": "monday", "startTime": "08:00", "endTime": "17:00"},
  --     {"day": "tuesday", "startTime": "08:00", "endTime": "17:00"}
  --   ],
  --   "breakTime": {"start": "12:00", "end": "13:00"},
  --   "maxPatientsPerDay": 20
  -- }
  
  -- Specializations (JSONB array)
  specializations JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "code": "CARD",
  --     "name": "Cardiology",
  --     "isPrimary": true,
  --     "certificationDate": "2010-01-01"
  --   }
  -- ]
  
  -- Credentials (JSONB array)
  credentials JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "credentialNumber": "LIC123456",
  --     "credentialType": "license",
  --     "issuingAuthority": "Ministry of Health",
  --     "issueDate": "2010-01-01",
  --     "expiryDate": "2025-01-01",
  --     "isValid": true
  --   }
  -- ]
  
  -- Certifications (JSONB array)
  certifications JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "certificationName": "Board Certified Cardiologist",
  --     "issuingOrganization": "Vietnam Cardiology Association",
  --     "issueDate": "2012-01-01",
  --     "expiryDate": "2027-01-01",
  --     "isValid": true
  --   }
  -- ]
  
  -- Availability (JSONB array)
  availability JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "date": "2025-01-10",
  --     "timeSlots": [
  --       {"start": "08:00", "end": "09:00", "isAvailable": true},
  --       {"start": "09:00", "end": "10:00", "isAvailable": false}
  --     ]
  --   }
  -- ]
  
  -- REMOVED: reviews - Belongs to Review/Rating Service (bounded context violation)
  -- Migration: 20250110_remove_bounded_context_violations.sql

  -- Department Assignments (JSONB array)
  department_assignments JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "departmentId": "DEPT-CARD",
  --     "departmentName": "Cardiology",
  --     "isPrimary": true,
  --     "startDate": "2020-01-01",
  --     "endDate": null,
  --     "isActive": true
  --   }
  -- ]
  
  -- Professional Details
  license_number VARCHAR(100) UNIQUE NOT NULL,
  employment_type VARCHAR(20) NOT NULL,  -- full_time, part_time, contract, intern, volunteer
  hire_date DATE NOT NULL,
  contract_end_date DATE,
  consultation_fee NUMERIC(10, 2),  -- For doctors - TODO: Consider moving to Billing Service
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  -- REMOVED: rating - Belongs to Review/Rating Service (bounded context violation)
  -- REMOVED: total_patients - Belongs to Scheduling/Appointment Service (bounded context violation)
  -- REMOVED: is_accepting_new_patients - Belongs to Scheduling/Appointment Service (bounded context violation)
  -- Migration: 20250110_remove_bounded_context_violations.sql

  -- Status and Activity
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, inactive, suspended, on_leave, terminated
  is_active BOOLEAN NOT NULL DEFAULT true,
  registration_date TIMESTAMP NOT NULL DEFAULT NOW(),
  last_active_date TIMESTAMP,
  
  -- Vietnamese Healthcare Specific
  vietnamese_healthcare_license VARCHAR(100),  -- Chứng chỉ hành nghề Việt Nam
  moh_registration_number VARCHAR(100),  -- Số đăng ký Bộ Y tế
  
  -- Audit Fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
  
  -- Constraints
  CONSTRAINT chk_staff_type CHECK (staff_type IN ('doctor', 'nurse', 'technician', 'pharmacist', 'therapist', 'admin', 'receptionist')),
  CONSTRAINT chk_employment_type CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'volunteer')),
  CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'suspended', 'on_leave', 'terminated')),
  -- REMOVED: chk_rating - Column removed (bounded context violation)
  CONSTRAINT chk_years_of_experience CHECK (years_of_experience >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON provider_schema.staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_staff_id ON provider_schema.staff_profiles(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_license_number ON provider_schema.staff_profiles(license_number);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_staff_type ON provider_schema.staff_profiles(staff_type);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_status ON provider_schema.staff_profiles(status);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_is_active ON provider_schema.staff_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_employment_type ON provider_schema.staff_profiles(employment_type);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_full_name ON provider_schema.staff_profiles((personal_info->>'fullName'));
CREATE INDEX IF NOT EXISTS idx_staff_profiles_national_id ON provider_schema.staff_profiles((personal_info->>'nationalId'));
CREATE INDEX IF NOT EXISTS idx_staff_profiles_department ON provider_schema.staff_profiles((professional_info->>'department'));

-- JSONB GIN indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_staff_profiles_specializations_gin ON provider_schema.staff_profiles USING GIN (specializations);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_credentials_gin ON provider_schema.staff_profiles USING GIN (credentials);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_certifications_gin ON provider_schema.staff_profiles USING GIN (certifications);

-- =====================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE provider_schema.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY service_role_all_staff_profiles
  ON provider_schema.staff_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can view active staff
CREATE POLICY authenticated_view_active_staff
  ON provider_schema.staff_profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true AND status = 'active');

-- Policy: Staff can view and update their own profile
CREATE POLICY staff_own_profile
  ON provider_schema.staff_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION provider_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON provider_schema.staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION provider_schema.update_updated_at_column();

-- =====================================================
-- 4. GRANTS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA provider_schema TO service_role;
GRANT USAGE ON SCHEMA provider_schema TO authenticated;

-- Grant permissions on tables
GRANT ALL ON provider_schema.staff_profiles TO service_role;
GRANT SELECT ON provider_schema.staff_profiles TO authenticated;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA provider_schema TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA provider_schema TO authenticated;

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON SCHEMA provider_schema IS 'Provider Staff Service V2 - Clean Architecture + DDD';
COMMENT ON TABLE provider_schema.staff_profiles IS 'Main aggregate root for all healthcare provider staff (doctors, nurses, technicians, etc.)';
COMMENT ON COLUMN provider_schema.staff_profiles.staff_id IS 'Unique staff identifier: {TYPE}-{DEPT}-YYYYMM-XXX';
COMMENT ON COLUMN provider_schema.staff_profiles.staff_type IS 'Type of staff: doctor, nurse, technician, pharmacist, therapist, admin, receptionist';
COMMENT ON COLUMN provider_schema.staff_profiles.personal_info IS 'Personal information stored as JSONB for flexibility and privacy';
COMMENT ON COLUMN provider_schema.staff_profiles.professional_info IS 'Professional information including title, department, position, education';
COMMENT ON COLUMN provider_schema.staff_profiles.work_schedule IS 'Work schedule including shifts, break times, max patients per day';
COMMENT ON COLUMN provider_schema.staff_profiles.specializations IS 'Array of specializations with codes, names, certification dates';
COMMENT ON COLUMN provider_schema.staff_profiles.credentials IS 'Array of credentials including licenses, certificates, registrations';
COMMENT ON COLUMN provider_schema.staff_profiles.certifications IS 'Array of board certifications and professional certifications';
COMMENT ON COLUMN provider_schema.staff_profiles.vietnamese_healthcare_license IS 'Vietnamese healthcare practice license number';
COMMENT ON COLUMN provider_schema.staff_profiles.moh_registration_number IS 'Ministry of Health registration number';

