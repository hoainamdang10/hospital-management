-- V2 Hospital Management System - Schema Design
-- Based on Archive Schema Analysis
-- Generated: 2025-09-27

-- =====================================================
-- PHASE 1: CREATE V2 SCHEMAS
-- =====================================================

-- Authentication & User Management
CREATE SCHEMA IF NOT EXISTS auth_schema;
COMMENT ON SCHEMA auth_schema IS 'V2 Authentication and user management';

-- Patient Management
CREATE SCHEMA IF NOT EXISTS patient_schema;
COMMENT ON SCHEMA patient_schema IS 'V2 Patient profiles and medical history';

-- Doctor & Staff Management
CREATE SCHEMA IF NOT EXISTS doctor_schema;
COMMENT ON SCHEMA doctor_schema IS 'V2 Doctor profiles, schedules, and specializations';

-- Appointment & Scheduling
CREATE SCHEMA IF NOT EXISTS appointment_schema;
COMMENT ON SCHEMA appointment_schema IS 'V2 Appointment booking and scheduling';

-- Medical Records & Clinical Data
CREATE SCHEMA IF NOT EXISTS medical_records_schema;
COMMENT ON SCHEMA medical_records_schema IS 'V2 Medical records, diagnoses, and treatments';

-- Payment & Billing
CREATE SCHEMA IF NOT EXISTS payment_schema;
COMMENT ON SCHEMA payment_schema IS 'V2 Payment processing and billing';

-- File Management
CREATE SCHEMA IF NOT EXISTS file_schema;
COMMENT ON SCHEMA file_schema IS 'V2 File uploads and document management';

-- AI & Analytics (New)
CREATE SCHEMA IF NOT EXISTS ai_schema;
COMMENT ON SCHEMA ai_schema IS 'V2 AI chatbot and analytics';

-- =====================================================
-- PHASE 2: CORE TABLES - AUTH SCHEMA
-- =====================================================

-- User Profiles (Enhanced from archive_schema.users)
CREATE TABLE IF NOT EXISTS auth_schema.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    phone_number VARCHAR(15),
    avatar_url TEXT,
    
    -- Role Management
    role_type TEXT NOT NULL CHECK (role_type IN ('admin', 'doctor', 'patient', 'receptionist')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Vietnamese Healthcare Specific
    citizen_id VARCHAR(12) UNIQUE, -- CCCD/CMND
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone VARCHAR(15),
    
    -- Subscription & Payment (from archive)
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'vip')),
    subscription_expires_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Healthcare Roles & Permissions
CREATE TABLE IF NOT EXISTS auth_schema.healthcare_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    role_description TEXT,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHASE 3: DOCTOR SCHEMA (Migrated from archive)
-- =====================================================

-- Doctor Profiles (Enhanced from archive_schema.chatbot_doctors)
CREATE TABLE IF NOT EXISTS doctor_schema.doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_schema.user_profiles(id),
    
    -- Basic Information (from archive)
    doctor_id VARCHAR(20) UNIQUE NOT NULL, -- DOC-001, DOC-002, etc.
    full_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    sub_specialties TEXT[],
    
    -- Professional Details
    medical_license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry_date DATE,
    years_of_experience INTEGER DEFAULT 0,
    education_background TEXT,
    certifications TEXT[],
    
    -- Practice Information (from archive)
    facility_name TEXT,
    facility_address TEXT,
    facility_phone VARCHAR(15),
    consultation_fee INTEGER DEFAULT 0, -- VND
    
    -- Rating & Reviews (from archive)
    rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    total_patients INTEGER DEFAULT 0,
    
    -- Availability
    is_accepting_patients BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    -- Vietnamese Healthcare Specific
    medical_council_registration TEXT,
    hospital_affiliations TEXT[],
    languages_spoken TEXT[] DEFAULT ARRAY['vi'],
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Doctor Schedules (Enhanced from archive scheduling tables)
CREATE TABLE IF NOT EXISTS doctor_schema.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES doctor_schema.doctor_profiles(id),
    
    -- Schedule Details
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Appointment Settings
    slot_duration_minutes INTEGER DEFAULT 30,
    max_appointments_per_slot INTEGER DEFAULT 1,
    break_periods JSONB DEFAULT '[]', -- [{start: "12:00", end: "13:00"}]
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHASE 4: MEDICAL RECORDS SCHEMA
-- =====================================================

-- Diseases (Migrated from archive_schema.diseases)
CREATE TABLE IF NOT EXISTS medical_records_schema.diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information (from archive)
    disease_id VARCHAR(20) UNIQUE NOT NULL, -- DIS-001, DIS-002, etc.
    name_vi TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    
    -- Medical Classification
    specialty TEXT NOT NULL,
    icd_10_code VARCHAR(10),
    severity_level INTEGER DEFAULT 3 CHECK (severity_level BETWEEN 1 AND 5),
    
    -- Clinical Information (from archive)
    common_symptoms TEXT[],
    risk_factors TEXT[],
    treatment_approach TEXT,
    prevention_tips TEXT[],
    when_to_see_doctor TEXT,
    emergency_signs TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications (Migrated from archive_schema.medications)
CREATE TABLE IF NOT EXISTS medical_records_schema.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information (from archive)
    medication_id VARCHAR(20) UNIQUE NOT NULL, -- MED-0001, MED-0002, etc.
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    brand_name TEXT,
    
    -- Drug Information
    dosage_form TEXT, -- tablet, capsule, syrup, injection
    strength TEXT, -- 500mg, 250mg/5ml
    unit TEXT, -- mg, ml, tablet
    category TEXT, -- antibiotic, analgesic, etc.
    drug_class TEXT,
    
    -- Manufacturing
    manufacturer TEXT,
    country_of_origin TEXT DEFAULT 'Vietnam',
    
    -- Clinical Information (from archive)
    description TEXT,
    indications TEXT,
    contraindications TEXT,
    side_effects TEXT,
    dosage_instructions TEXT,
    
    -- Regulatory
    registration_number TEXT,
    is_prescription_required BOOLEAN DEFAULT true,
    is_controlled_substance BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagnosis Codes (Migrated from archive_schema.diagnosis)
CREATE TABLE IF NOT EXISTS medical_records_schema.diagnosis_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information (from archive)
    diagnosis_id VARCHAR(20) UNIQUE NOT NULL, -- DIAG-001, DIAG-002, etc.
    diagnosis_code VARCHAR(20) UNIQUE NOT NULL, -- ICD-10 or local code
    diagnosis_name TEXT NOT NULL,
    
    -- Classification
    category TEXT,
    icd_10_code VARCHAR(10),
    specialty TEXT,
    
    -- Clinical Information
    description TEXT,
    severity_level INTEGER DEFAULT 3 CHECK (severity_level BETWEEN 1 AND 5),
    
    -- UI/UX
    color_code VARCHAR(7), -- #FF5733
    icon_name VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHASE 5: AI SCHEMA (New - for chatbot features)
-- =====================================================

-- AI Training Data (Migrated from archive_schema.chatbot_training_data)
CREATE TABLE IF NOT EXISTS ai_schema.training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Training Content (from archive)
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    keywords TEXT[],
    
    -- AI Metadata
    intent TEXT,
    entities JSONB DEFAULT '{}',
    confidence_score INTEGER DEFAULT 100 CHECK (confidence_score BETWEEN 0 AND 100),
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    
    -- Vietnamese Healthcare Specific
    specialty TEXT,
    urgency_level TEXT DEFAULT 'routine' CHECK (urgency_level IN ('routine', 'urgent', 'emergency')),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- =====================================================
-- PHASE 6: INDEXES FOR PERFORMANCE
-- =====================================================

-- Auth Schema Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON auth_schema.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON auth_schema.user_profiles(role_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON auth_schema.user_profiles(is_active);

-- Doctor Schema Indexes
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialty ON doctor_schema.doctor_profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_active ON doctor_schema.doctor_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_rating ON doctor_schema.doctor_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor ON doctor_schema.doctor_schedules(doctor_id);

-- Medical Records Indexes
CREATE INDEX IF NOT EXISTS idx_diseases_specialty ON medical_records_schema.diseases(specialty);
CREATE INDEX IF NOT EXISTS idx_medications_category ON medical_records_schema.medications(category);
CREATE INDEX IF NOT EXISTS idx_diagnosis_codes_category ON medical_records_schema.diagnosis_codes(category);

-- AI Schema Indexes
CREATE INDEX IF NOT EXISTS idx_training_data_category ON ai_schema.training_data(category);
CREATE INDEX IF NOT EXISTS idx_training_data_keywords ON ai_schema.training_data USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_training_data_active ON ai_schema.training_data(is_active);

-- =====================================================
-- PHASE 7: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE auth_schema.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schema.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schema.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records_schema.diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records_schema.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records_schema.diagnosis_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_schema.training_data ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (will be enhanced later)
CREATE POLICY "Users can view their own profile" ON auth_schema.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Doctors can view their own profile" ON doctor_schema.doctor_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Public read access for reference data
CREATE POLICY "Public read access to diseases" ON medical_records_schema.diseases
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access to medications" ON medical_records_schema.medications
    FOR SELECT USING (is_active = true);

-- =====================================================
-- PHASE 8: INITIAL DATA SEEDING
-- =====================================================

-- Insert default healthcare roles
INSERT INTO auth_schema.healthcare_roles (role_name, role_description, permissions) VALUES
('admin', 'System Administrator', '["all"]'),
('doctor', 'Medical Doctor', '["read_patients", "write_medical_records", "manage_appointments"]'),
('patient', 'Patient User', '["read_own_data", "book_appointments"]'),
('receptionist', 'Hospital Receptionist', '["manage_appointments", "read_patients"]')
ON CONFLICT (role_name) DO NOTHING;

-- Note: Actual data migration from archive_schema will be handled by migration scripts
