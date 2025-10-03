-- Patient Registry Service V2 - Database Schema
-- Clean Architecture + DDD + FHIR-Aligned
-- Author: Hospital Management Team
-- Version: 2.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create patient_schema if not exists
CREATE SCHEMA IF NOT EXISTS patient_schema;

-- =====================================================
-- 1. PATIENTS TABLE (Main aggregate root)
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_schema.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) UNIQUE NOT NULL,  -- PAT-YYYYMM-XXX
  user_id UUID NOT NULL,  -- Reference to auth_schema.users(id)
  
  -- Personal Info (JSONB for flexibility)
  personal_info JSONB NOT NULL,
  -- {
  --   "fullName": "Nguyễn Văn A",
  --   "dateOfBirth": "1990-01-01",
  --   "gender": "male",
  --   "nationalId": "123456789",
  --   "nationality": "Vietnamese",
  --   "ethnicity": "Kinh",
  --   "occupation": "Engineer",
  --   "maritalStatus": "married"
  -- }
  
  -- Contact Info (JSONB for flexibility)
  contact_info JSONB NOT NULL,
  -- {
  --   "primaryPhone": "0901234567",
  --   "secondaryPhone": "0987654321",
  --   "email": "nguyenvana@example.com",
  --   "preferredContactMethod": "phone",
  --   "address": {
  --     "street": "123 Đường ABC",
  --     "ward": "Phường XYZ",
  --     "district": "Quận 1",
  --     "city": "Hà Nội",
  --     "postalCode": "100000",
  --     "country": "Vietnam"
  --   }
  -- }
  
  -- Basic Medical Info (JSONB for flexibility)
  basic_medical_info JSONB NOT NULL,
  -- {
  --   "bloodType": "A+",
  --   "knownAllergies": ["Penicillin", "Peanuts"],
  --   "emergencyMedicalInfo": "Diabetic, requires insulin"
  -- }
  
  -- Status (FHIR-aligned)
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, inactive, deceased, merged
  merged_into VARCHAR(20),  -- Reference to master patient_id (if merged)
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  
  -- Constraints
  CONSTRAINT fk_merged_into FOREIGN KEY (merged_into) REFERENCES patient_schema.patients(patient_id) ON DELETE SET NULL,
  CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'deceased', 'merged'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patient_schema.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patient_schema.patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patient_schema.patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patient_schema.patients((personal_info->>'nationalId'));
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patient_schema.patients((personal_info->>'fullName'));
CREATE INDEX IF NOT EXISTS idx_patients_primary_phone ON patient_schema.patients((contact_info->>'primaryPhone'));
CREATE INDEX IF NOT EXISTS idx_patients_email ON patient_schema.patients((contact_info->>'email'));

-- =====================================================
-- 2. INSURANCE INFO TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_schema.insurance_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  group_number VARCHAR(100),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  coverage_type VARCHAR(50) NOT NULL,  -- BHYT, BHTN, private, self_pay
  is_vietnamese_insurance BOOLEAN NOT NULL DEFAULT false,
  bhyt_number VARCHAR(50),  -- Vietnamese social health insurance number
  is_primary BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_insurance_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT chk_coverage_type CHECK (coverage_type IN ('BHYT', 'BHTN', 'private', 'self_pay'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insurance_patient_id ON patient_schema.insurance_info(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_bhyt_number ON patient_schema.insurance_info(bhyt_number);
CREATE INDEX IF NOT EXISTS idx_insurance_policy_number ON patient_schema.insurance_info(policy_number);

-- =====================================================
-- 3. EMERGENCY CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_schema.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  primary_phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_emergency_contact_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patients(patient_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient_id ON patient_schema.emergency_contacts(patient_id);

-- =====================================================
-- 4. PATIENT CONSENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_schema.patient_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_consent_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patients(patient_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient_id ON patient_schema.patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_type ON patient_schema.patient_consents(consent_type);

-- =====================================================
-- 5. PATIENT LINKS TABLE (FHIR-style linking)
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_schema.patient_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,
  other_patient_id VARCHAR(20) NOT NULL,
  link_type VARCHAR(20) NOT NULL,  -- replaced-by, replaces, refer, seealso
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  
  -- Constraints
  CONSTRAINT fk_link_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT fk_link_other_patient FOREIGN KEY (other_patient_id) REFERENCES patient_schema.patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT chk_link_type CHECK (link_type IN ('replaced-by', 'replaces', 'refer', 'seealso')),
  CONSTRAINT chk_no_self_link CHECK (patient_id != other_patient_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_links_patient_id ON patient_schema.patient_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_links_other_patient_id ON patient_schema.patient_links(other_patient_id);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE patient_schema.patients IS 'Patient Master Data (FHIR-aligned)';
COMMENT ON TABLE patient_schema.insurance_info IS 'Patient Insurance Information (BHYT, BHTN, Private)';
COMMENT ON TABLE patient_schema.emergency_contacts IS 'Patient Emergency Contacts';
COMMENT ON TABLE patient_schema.patient_consents IS 'Patient Consents (HIPAA compliance)';
COMMENT ON TABLE patient_schema.patient_links IS 'Patient Links (FHIR R5 specification)';

