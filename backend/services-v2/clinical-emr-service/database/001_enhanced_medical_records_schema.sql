-- =====================================================
-- Clinical EMR Service - Enhanced Database Schema V2
-- Complete schema matching domain model requirements
-- =====================================================
-- 
-- This migration adds all missing columns and tables required by the domain model
-- to support FHIR compliance, Vietnamese healthcare standards, and HIPAA audit requirements
--
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Date: 2025-10-25
-- =====================================================

-- Create clinical schema if not exists
CREATE SCHEMA IF NOT EXISTS clinical_schema;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- DROP EXISTING TABLE (if running migration fresh)
-- =====================================================
-- WARNING: This will delete all existing data!
-- Comment out if you want to preserve existing data and use ALTER TABLE instead

-- DROP TABLE IF EXISTS clinical_schema.medical_records CASCADE;
-- DROP TABLE IF EXISTS clinical_schema.medical_record_diagnoses CASCADE;
-- DROP TABLE IF EXISTS clinical_schema.medical_record_medications CASCADE;
-- DROP TABLE IF EXISTS clinical_schema.medical_record_access CASCADE;

-- =====================================================
-- MAIN MEDICAL RECORDS TABLE (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_schema.medical_records (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id VARCHAR(20) UNIQUE NOT NULL, -- MR-YYYYMM-XXX (note: changed from MED- to MR-)
    
    -- References (soft references to other services)
    patient_id VARCHAR(20) NOT NULL, -- PAT-YYYYMM-XXX
    doctor_id VARCHAR(30) NOT NULL,  -- DEPT-DOC-YYYYMM-XXX
    appointment_id UUID,             -- Optional reference to appointment
    
    -- Basic Medical Information (Legacy fields for backward compatibility)
    visit_date DATE NOT NULL,
    symptoms TEXT,
    examination_notes TEXT,
    diagnosis TEXT,                  -- Legacy field - use diagnoses_json instead
    treatment TEXT,
    medications TEXT,                -- Legacy field - use medications_json instead
    notes TEXT,
    
    -- =====================================================
    -- ENHANCED FIELDS (Required by Domain Model)
    -- =====================================================
    
    -- Enhanced Vital Signs (JSONB for flexibility)
    vital_signs JSONB DEFAULT '{}',              -- Basic vital signs (legacy)
    vital_signs_json JSONB,                      -- Enhanced vital signs with full metadata
    
    -- Diagnoses Array (FHIR Compliant)
    diagnoses_json JSONB DEFAULT '[]',           -- Array of Diagnosis value objects
    
    -- Medications Array (FHIR Compliant)
    medications_json JSONB DEFAULT '[]',         -- Array of Medication value objects
    
    -- FHIR Compliance Fields
    fhir_resource_id VARCHAR(100),               -- FHIR resource identifier
    fhir_version VARCHAR(20) DEFAULT '4.0.1',   -- FHIR version
    fhir_profile TEXT,                           -- FHIR profile URI
    fhir_compliant BOOLEAN DEFAULT FALSE,        -- FHIR validation status
    
    -- Vietnamese Medical Standards
    vietnamese_medical_code VARCHAR(50),         -- Mã hồ sơ bệnh án Việt Nam
    specialty_code VARCHAR(10),                  -- Mã chuyên khoa
    hospital_code VARCHAR(20),                   -- Mã bệnh viện
    
    -- Query Optimization Fields (Denormalized for performance)
    has_vital_signs BOOLEAN DEFAULT FALSE,
    has_complete_vital_signs BOOLEAN DEFAULT FALSE,
    critical_diagnoses_count INTEGER DEFAULT 0,
    active_medications_count INTEGER DEFAULT 0,
    
    -- Full-Text Search Vector
    search_vector TSVECTOR,                      -- Generated search vector
    
    -- Status and Workflow
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'archived', 'deleted', 'draft', 
        'pending-review', 'reviewed', 'amended'
    )),
    
    -- HIPAA Audit Fields
    access_log_json JSONB DEFAULT '[]',          -- Access audit trail
    last_accessed_at TIMESTAMPTZ,
    last_accessed_by VARCHAR(50),
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,                      -- Soft delete timestamp
    deleted_by UUID,                             -- Who deleted the record
    
    -- Optimistic Locking
    version INTEGER DEFAULT 0,                   -- For optimistic concurrency control
    
    -- Constraints
    CONSTRAINT chk_patient_id_format CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$'),
    CONSTRAINT chk_doctor_id_format CHECK (doctor_id ~ '^[A-Z]{2,4}-DOC-\d{6}-\d{3}$'),
    CONSTRAINT chk_record_id_format CHECK (record_id ~ '^MR-\d{6}-\d{3}$'),
    CONSTRAINT chk_visit_date_range CHECK (
        visit_date >= (CURRENT_DATE - INTERVAL '1 year') AND 
        visit_date <= (CURRENT_DATE + INTERVAL '7 days')
    ),
    CONSTRAINT chk_version_positive CHECK (version >= 0)
);

-- =====================================================
-- DIAGNOSES TABLE (Normalized for complex queries)
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_schema.medical_record_diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID NOT NULL REFERENCES clinical_schema.medical_records(id) ON DELETE CASCADE,
    
    -- Diagnosis Information (from Diagnosis Value Object)
    code VARCHAR(20) NOT NULL,                   -- ICD-10 or Vietnamese medical code
    display VARCHAR(500) NOT NULL,               -- Diagnosis name
    description TEXT,
    
    -- Classification
    category VARCHAR(20) NOT NULL CHECK (category IN ('primary', 'secondary', 'complication', 'comorbidity')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error')),
    
    -- Dates
    onset_date DATE,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by VARCHAR(50) NOT NULL,
    
    -- Vietnamese Classification
    vietnamese_classification VARCHAR(50),        -- BYT-VN-2024 or ICD-10-VN
    specialty_code VARCHAR(10),
    
    -- FHIR Compliance
    fhir_code_system TEXT,
    fhir_version VARCHAR(20) DEFAULT '4.0.1',
    
    -- Metadata
    notes TEXT,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uk_medical_record_diagnosis UNIQUE (medical_record_id, code)
);

-- =====================================================
-- MEDICATIONS TABLE (Normalized for complex queries)
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_schema.medical_record_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID NOT NULL REFERENCES clinical_schema.medical_records(id) ON DELETE CASCADE,
    
    -- Medication Core Information
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    brand_name VARCHAR(200),
    
    -- Dosage Information
    strength VARCHAR(50) NOT NULL,
    dosage_form VARCHAR(20) NOT NULL CHECK (dosage_form IN (
        'tablet', 'capsule', 'syrup', 'injection', 'cream', 
        'ointment', 'drops', 'spray', 'powder', 'solution'
    )),
    route VARCHAR(20) NOT NULL CHECK (route IN (
        'oral', 'topical', 'intravenous', 'intramuscular', 
        'subcutaneous', 'inhalation', 'nasal', 'ophthalmic', 
        'otic', 'rectal', 'vaginal'
    )),
    
    -- Prescription Details
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    frequency_unit VARCHAR(30) NOT NULL,
    duration VARCHAR(50),
    
    -- Instructions
    instructions TEXT NOT NULL,
    special_instructions TEXT,
    
    -- Status and Dates
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'inactive', 'entered-in-error', 
        'stopped', 'on-hold', 'completed', 'cancelled'
    )),
    prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_date DATE,
    end_date DATE,
    
    -- Prescriber Information
    prescribed_by VARCHAR(50) NOT NULL,
    pharmacist_notes TEXT,
    
    -- Vietnamese Pharmaceutical Standards
    vietnamese_drug_code VARCHAR(20),            -- VN-XXXXX-XX
    registration_number VARCHAR(20),             -- VD-XXXXX-XX
    manufacturer VARCHAR(200),
    
    -- FHIR Compliance
    fhir_code_system TEXT,
    fhir_version VARCHAR(20) DEFAULT '4.0.1',
    
    -- Safety Information (JSONB arrays)
    contraindications JSONB DEFAULT '[]',
    side_effects JSONB DEFAULT '[]',
    interactions JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    
    -- Metadata
    notes TEXT,
    priority VARCHAR(10) DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_dates_valid CHECK (end_date IS NULL OR start_date IS NULL OR start_date < end_date),
    CONSTRAINT uk_medical_record_medication UNIQUE (medical_record_id, code)
);

-- =====================================================
-- ACCESS LOG TABLE (HIPAA Compliance)
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_schema.medical_record_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID NOT NULL REFERENCES clinical_schema.medical_records(id) ON DELETE CASCADE,
    
    -- Access Information
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_by VARCHAR(50) NOT NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('read', 'write', 'print', 'export')),
    
    -- Context Information
    ip_address VARCHAR(45),                      -- Support IPv6
    user_agent TEXT,
    purpose TEXT,                                -- Mục đích truy cập
    
    -- Additional Context
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    
    -- Audit metadata (immutable)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Make access log immutable (cannot update or delete)
CREATE POLICY "access_log_immutable" ON clinical_schema.medical_record_access
    FOR UPDATE USING (FALSE);
    
CREATE POLICY "access_log_no_delete" ON clinical_schema.medical_record_access
    FOR DELETE USING (FALSE);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Medical Records Indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON clinical_schema.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON clinical_schema.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON clinical_schema.medical_records(appointment_id);

-- Date indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON clinical_schema.medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON clinical_schema.medical_records(created_at);
CREATE INDEX IF NOT EXISTS idx_medical_records_updated_at ON clinical_schema.medical_records(updated_at);

-- Status index
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON clinical_schema.medical_records(status) WHERE status != 'deleted';

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_status ON clinical_schema.medical_records(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_status ON clinical_schema.medical_records(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_visit_date ON clinical_schema.medical_records(patient_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_visit_date ON clinical_schema.medical_records(doctor_id, visit_date DESC);

-- JSONB indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_medical_records_vital_signs ON clinical_schema.medical_records USING GIN(vital_signs);
CREATE INDEX IF NOT EXISTS idx_medical_records_diagnoses_json ON clinical_schema.medical_records USING GIN(diagnoses_json);
CREATE INDEX IF NOT EXISTS idx_medical_records_medications_json ON clinical_schema.medical_records USING GIN(medications_json);
CREATE INDEX IF NOT EXISTS idx_medical_records_access_log ON clinical_schema.medical_records USING GIN(access_log_json);

-- FHIR indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_fhir_resource_id ON clinical_schema.medical_records(fhir_resource_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_fhir_compliant ON clinical_schema.medical_records(fhir_compliant) WHERE fhir_compliant = TRUE;

-- Vietnamese healthcare indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_specialty_code ON clinical_schema.medical_records(specialty_code);
CREATE INDEX IF NOT EXISTS idx_medical_records_vietnamese_code ON clinical_schema.medical_records(vietnamese_medical_code);

-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_critical_diagnoses ON clinical_schema.medical_records(critical_diagnoses_count) WHERE critical_diagnoses_count > 0;
CREATE INDEX IF NOT EXISTS idx_medical_records_active_medications ON clinical_schema.medical_records(active_medications_count) WHERE active_medications_count > 0;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_search_vector ON clinical_schema.medical_records USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_medical_records_symptoms_text ON clinical_schema.medical_records USING GIN(to_tsvector('english', COALESCE(symptoms, '')));
CREATE INDEX IF NOT EXISTS idx_medical_records_diagnosis_text ON clinical_schema.medical_records USING GIN(to_tsvector('english', COALESCE(diagnosis, '')));
CREATE INDEX IF NOT EXISTS idx_medical_records_notes_text ON clinical_schema.medical_records USING GIN(to_tsvector('english', COALESCE(notes, '')));

-- Diagnoses Table Indexes
CREATE INDEX IF NOT EXISTS idx_diagnoses_medical_record_id ON clinical_schema.medical_record_diagnoses(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_code ON clinical_schema.medical_record_diagnoses(code);
CREATE INDEX IF NOT EXISTS idx_diagnoses_category ON clinical_schema.medical_record_diagnoses(category);
CREATE INDEX IF NOT EXISTS idx_diagnoses_severity ON clinical_schema.medical_record_diagnoses(severity);
CREATE INDEX IF NOT EXISTS idx_diagnoses_status ON clinical_schema.medical_record_diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_diagnoses_specialty_code ON clinical_schema.medical_record_diagnoses(specialty_code);

-- Medications Table Indexes
CREATE INDEX IF NOT EXISTS idx_medications_medical_record_id ON clinical_schema.medical_record_medications(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medications_code ON clinical_schema.medical_record_medications(code);
CREATE INDEX IF NOT EXISTS idx_medications_status ON clinical_schema.medical_record_medications(status);
CREATE INDEX IF NOT EXISTS idx_medications_vietnamese_code ON clinical_schema.medical_record_medications(vietnamese_drug_code);
CREATE INDEX IF NOT EXISTS idx_medications_registration_number ON clinical_schema.medical_record_medications(registration_number);
CREATE INDEX IF NOT EXISTS idx_medications_priority ON clinical_schema.medical_record_medications(priority);

-- Access Log Indexes (for HIPAA audit queries)
CREATE INDEX IF NOT EXISTS idx_access_medical_record_id ON clinical_schema.medical_record_access(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_access_accessed_at ON clinical_schema.medical_record_access(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_accessed_by ON clinical_schema.medical_record_access(accessed_by);
CREATE INDEX IF NOT EXISTS idx_access_type ON clinical_schema.medical_record_access(access_type);
CREATE INDEX IF NOT EXISTS idx_access_composite ON clinical_schema.medical_record_access(medical_record_id, accessed_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clinical_schema.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_schema.medical_record_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_schema.medical_record_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_schema.medical_record_access ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Medical Records RLS Policies
-- =====================================================

-- Policy: Doctors can see all records they created
CREATE POLICY "doctors_own_records" ON clinical_schema.medical_records
    FOR ALL USING (doctor_id = auth.uid()::text);

-- Policy: Patients can see their own records (read-only)
CREATE POLICY "patients_own_records" ON clinical_schema.medical_records
    FOR SELECT USING (patient_id = auth.uid()::text);

-- Policy: Admins can see all records
CREATE POLICY "admins_all_records" ON clinical_schema.medical_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_schema.users 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Policy: Service accounts can access records (for inter-service communication)
CREATE POLICY "service_access" ON clinical_schema.medical_records
    FOR ALL USING (
        current_setting('app.service_role', true) = 'true'
    );

-- =====================================================
-- Diagnoses RLS Policies
-- =====================================================

-- Inherit access from parent medical record
CREATE POLICY "diagnoses_follow_medical_record" ON clinical_schema.medical_record_diagnoses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinical_schema.medical_records mr
            WHERE mr.id = medical_record_id
        )
    );

-- =====================================================
-- Medications RLS Policies
-- =====================================================

-- Inherit access from parent medical record
CREATE POLICY "medications_follow_medical_record" ON clinical_schema.medical_record_medications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clinical_schema.medical_records mr
            WHERE mr.id = medical_record_id
        )
    );

-- =====================================================
-- Access Log RLS Policies
-- =====================================================

-- Admins can see all access logs
CREATE POLICY "admins_view_access_logs" ON clinical_schema.medical_record_access
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_schema.users 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Doctors can see access logs for their records
CREATE POLICY "doctors_view_own_access_logs" ON clinical_schema.medical_record_access
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clinical_schema.medical_records mr
            WHERE mr.id = medical_record_id AND mr.doctor_id = auth.uid()::text
        )
    );

-- All authenticated users can insert access logs (for audit trail)
CREATE POLICY "all_can_insert_access_logs" ON clinical_schema.medical_record_access
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to generate next medical record ID
CREATE OR REPLACE FUNCTION clinical_schema.generate_medical_record_id()
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    next_sequence INTEGER;
    new_record_id TEXT;
BEGIN
    -- Get current year-month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(record_id FROM 11 FOR 3) AS INTEGER)), 0) + 1
    INTO next_sequence
    FROM clinical_schema.medical_records
    WHERE record_id LIKE 'MR-' || year_month || '-%';
    
    -- Format the new record ID (MR-YYYYMM-XXX)
    new_record_id := 'MR-' || year_month || '-' || LPAD(next_sequence::TEXT, 3, '0');
    
    RETURN new_record_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vector
CREATE OR REPLACE FUNCTION clinical_schema.update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.symptoms, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.examination_notes, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.diagnosis, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.treatment, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update denormalized fields
CREATE OR REPLACE FUNCTION clinical_schema.update_denormalized_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Update has_vital_signs
    NEW.has_vital_signs := (NEW.vital_signs IS NOT NULL AND NEW.vital_signs::text != '{}');
    
    -- Update critical_diagnoses_count
    IF NEW.diagnoses_json IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO NEW.critical_diagnoses_count
        FROM jsonb_array_elements(NEW.diagnoses_json) AS diagnosis
        WHERE diagnosis->>'severity' = 'critical';
    END IF;
    
    -- Update active_medications_count
    IF NEW.medications_json IS NOT NULL THEN
        SELECT COUNT(*)::INTEGER INTO NEW.active_medications_count
        FROM jsonb_array_elements(NEW.medications_json) AS medication
        WHERE medication->>'isActive' = 'true';
    END IF;
    
    -- Update FHIR compliance status
    NEW.fhir_compliant := (
        NEW.fhir_resource_id IS NOT NULL AND
        NEW.fhir_version IS NOT NULL AND
        NEW.patient_id IS NOT NULL AND
        NEW.doctor_id IS NOT NULL
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment version for optimistic locking
CREATE OR REPLACE FUNCTION clinical_schema.increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version := OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create medical record with validation
CREATE OR REPLACE FUNCTION clinical_schema.create_medical_record(
    p_patient_id TEXT,
    p_doctor_id TEXT,
    p_appointment_id UUID DEFAULT NULL,
    p_visit_date DATE,
    p_symptoms TEXT DEFAULT NULL,
    p_examination_notes TEXT DEFAULT NULL,
    p_diagnosis TEXT DEFAULT NULL,
    p_treatment TEXT DEFAULT NULL,
    p_medications TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_vital_signs JSONB DEFAULT '{}',
    p_created_by UUID
)
RETURNS TABLE(
    record_id TEXT,
    id UUID,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    new_record_id TEXT;
    new_id UUID;
    new_created_at TIMESTAMPTZ;
BEGIN
    -- Generate new record ID
    new_record_id := clinical_schema.generate_medical_record_id();
    
    -- Insert the record
    INSERT INTO clinical_schema.medical_records (
        record_id,
        patient_id,
        doctor_id,
        appointment_id,
        visit_date,
        symptoms,
        examination_notes,
        diagnosis,
        treatment,
        medications,
        notes,
        vital_signs,
        created_by,
        updated_by
    ) VALUES (
        new_record_id,
        p_patient_id,
        p_doctor_id,
        p_appointment_id,
        p_visit_date,
        p_symptoms,
        p_examination_notes,
        p_diagnosis,
        p_treatment,
        p_medications,
        p_notes,
        p_vital_signs,
        p_created_by,
        p_created_by
    )
    RETURNING medical_records.id, medical_records.created_at
    INTO new_id, new_created_at;
    
    -- Return the created record info
    RETURN QUERY SELECT new_record_id, new_id, new_created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get medical record statistics
CREATE OR REPLACE FUNCTION clinical_schema.get_medical_record_statistics()
RETURNS TABLE(
    total_records BIGINT,
    active_records BIGINT,
    archived_records BIGINT,
    deleted_records BIGINT,
    draft_records BIGINT,
    pending_review_records BIGINT,
    reviewed_records BIGINT,
    records_with_diagnosis BIGINT,
    records_with_treatment BIGINT,
    records_with_vital_signs BIGINT,
    records_with_complete_vital_signs BIGINT,
    fhir_compliant_records BIGINT,
    records_with_critical_diagnoses BIGINT,
    records_with_active_medications BIGINT,
    records_today BIGINT,
    records_this_week BIGINT,
    records_this_month BIGINT,
    records_this_year BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE status = 'active') as active_records,
        COUNT(*) FILTER (WHERE status = 'archived') as archived_records,
        COUNT(*) FILTER (WHERE status = 'deleted') as deleted_records,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_records,
        COUNT(*) FILTER (WHERE status = 'pending-review') as pending_review_records,
        COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed_records,
        COUNT(*) FILTER (WHERE diagnosis IS NOT NULL AND diagnosis != '') as records_with_diagnosis,
        COUNT(*) FILTER (WHERE treatment IS NOT NULL AND treatment != '') as records_with_treatment,
        COUNT(*) FILTER (WHERE has_vital_signs = TRUE) as records_with_vital_signs,
        COUNT(*) FILTER (WHERE has_complete_vital_signs = TRUE) as records_with_complete_vital_signs,
        COUNT(*) FILTER (WHERE fhir_compliant = TRUE) as fhir_compliant_records,
        COUNT(*) FILTER (WHERE critical_diagnoses_count > 0) as records_with_critical_diagnoses,
        COUNT(*) FILTER (WHERE active_medications_count > 0) as records_with_active_medications,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as records_today,
        COUNT(*) FILTER (WHERE created_at >= (CURRENT_DATE - INTERVAL '7 days')) as records_this_week,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as records_this_month,
        COUNT(*) FILTER (WHERE DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE)) as records_this_year
    FROM clinical_schema.medical_records
    WHERE deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get patient statistics
CREATE OR REPLACE FUNCTION clinical_schema.get_patient_statistics(p_patient_id TEXT)
RETURNS TABLE(
    patient_id TEXT,
    total_records BIGINT,
    active_records BIGINT,
    archived_records BIGINT,
    records_with_diagnosis BIGINT,
    records_with_treatment BIGINT,
    records_with_vital_signs BIGINT,
    records_with_complete_vital_signs BIGINT,
    first_visit_date DATE,
    last_visit_date DATE,
    unique_doctors BIGINT,
    average_visits_per_month NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_patient_id,
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active'),
        COUNT(*) FILTER (WHERE status = 'archived'),
        COUNT(*) FILTER (WHERE diagnosis IS NOT NULL),
        COUNT(*) FILTER (WHERE treatment IS NOT NULL),
        COUNT(*) FILTER (WHERE has_vital_signs = TRUE),
        COUNT(*) FILTER (WHERE has_complete_vital_signs = TRUE),
        MIN(visit_date),
        MAX(visit_date),
        COUNT(DISTINCT doctor_id),
        (COUNT(*)::NUMERIC / GREATEST(1, EXTRACT(MONTH FROM AGE(MAX(visit_date), MIN(visit_date))) + 1))
    FROM clinical_schema.medical_records
    WHERE patient_id = p_patient_id AND deleted_at IS NULL
    GROUP BY p_patient_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get doctor statistics
CREATE OR REPLACE FUNCTION clinical_schema.get_doctor_statistics(p_doctor_id TEXT)
RETURNS TABLE(
    doctor_id TEXT,
    total_records BIGINT,
    active_records BIGINT,
    archived_records BIGINT,
    records_this_month BIGINT,
    records_this_year BIGINT,
    unique_patients BIGINT,
    average_records_per_day NUMERIC,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_doctor_id,
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active'),
        COUNT(*) FILTER (WHERE status = 'archived'),
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)),
        COUNT(*) FILTER (WHERE DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE)),
        COUNT(DISTINCT patient_id),
        (COUNT(*)::NUMERIC / GREATEST(1, EXTRACT(DAY FROM AGE(MAX(visit_date), MIN(visit_date))) + 1)),
        (COUNT(*) FILTER (WHERE diagnosis IS NOT NULL AND treatment IS NOT NULL)::NUMERIC / GREATEST(1, COUNT(*))) * 100
    FROM clinical_schema.medical_records
    WHERE doctor_id = p_doctor_id AND deleted_at IS NULL
    GROUP BY p_doctor_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log access (HIPAA compliance)
CREATE OR REPLACE FUNCTION clinical_schema.log_medical_record_access(
    p_medical_record_id UUID,
    p_accessed_by VARCHAR(50),
    p_access_type VARCHAR(20),
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_purpose TEXT DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL,
    p_request_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    access_log_id UUID;
BEGIN
    INSERT INTO clinical_schema.medical_record_access (
        medical_record_id,
        accessed_by,
        access_type,
        ip_address,
        user_agent,
        purpose,
        session_id,
        request_id
    ) VALUES (
        p_medical_record_id,
        p_accessed_by,
        p_access_type,
        p_ip_address,
        p_user_agent,
        p_purpose,
        p_session_id,
        p_request_id
    )
    RETURNING id INTO access_log_id;
    
    -- Update parent record's last accessed info
    UPDATE clinical_schema.medical_records
    SET 
        last_accessed_at = NOW(),
        last_accessed_by = p_accessed_by
    WHERE id = p_medical_record_id;
    
    RETURN access_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to archive medical record
CREATE OR REPLACE FUNCTION clinical_schema.archive_medical_record(
    p_record_id TEXT,
    p_archived_by UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    record_exists BOOLEAN;
    current_status VARCHAR(20);
BEGIN
    -- Check if record exists
    SELECT EXISTS(
        SELECT 1 FROM clinical_schema.medical_records 
        WHERE record_id = p_record_id
    ), status INTO record_exists, current_status
    FROM clinical_schema.medical_records 
    WHERE record_id = p_record_id;
    
    IF NOT record_exists THEN
        RAISE EXCEPTION 'Medical record not found: %', p_record_id;
    END IF;
    
    IF current_status = 'archived' THEN
        RAISE EXCEPTION 'Medical record is already archived';
    END IF;
    
    IF current_status = 'deleted' THEN
        RAISE EXCEPTION 'Cannot archive deleted medical record';
    END IF;
    
    -- Archive the record
    UPDATE clinical_schema.medical_records
    SET 
        status = 'archived',
        updated_by = p_archived_by,
        updated_at = NOW()
    WHERE record_id = p_record_id;
    
    -- Log the action
    INSERT INTO clinical_schema.medical_record_access (
        medical_record_id,
        accessed_by,
        access_type,
        purpose
    )
    SELECT id, p_archived_by::TEXT, 'write', COALESCE(p_reason, 'Archive medical record')
    FROM clinical_schema.medical_records
    WHERE record_id = p_record_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to restore archived medical record
CREATE OR REPLACE FUNCTION clinical_schema.restore_medical_record(
    p_record_id TEXT,
    p_restored_by UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(20);
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM clinical_schema.medical_records 
    WHERE record_id = p_record_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Medical record not found: %', p_record_id;
    END IF;
    
    IF current_status != 'archived' THEN
        RAISE EXCEPTION 'Only archived medical records can be restored. Current status: %', current_status;
    END IF;
    
    -- Restore the record
    UPDATE clinical_schema.medical_records
    SET 
        status = 'active',
        updated_by = p_restored_by,
        updated_at = NOW()
    WHERE record_id = p_record_id;
    
    -- Log the action
    INSERT INTO clinical_schema.medical_record_access (
        medical_record_id,
        accessed_by,
        access_type,
        purpose
    )
    SELECT id, p_restored_by::TEXT, 'write', COALESCE(p_reason, 'Restore medical record')
    FROM clinical_schema.medical_records
    WHERE record_id = p_record_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION clinical_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medical_records_updated_at
    BEFORE UPDATE ON clinical_schema.medical_records
    FOR EACH ROW
    EXECUTE FUNCTION clinical_schema.update_updated_at_column();

-- Trigger to update search vector
CREATE TRIGGER update_medical_records_search_vector
    BEFORE INSERT OR UPDATE ON clinical_schema.medical_records
    FOR EACH ROW
    EXECUTE FUNCTION clinical_schema.update_search_vector();

-- Trigger to update denormalized fields
CREATE TRIGGER update_medical_records_denormalized
    BEFORE INSERT OR UPDATE ON clinical_schema.medical_records
    FOR EACH ROW
    EXECUTE FUNCTION clinical_schema.update_denormalized_fields();

-- Trigger to increment version on update
CREATE TRIGGER increment_medical_record_version
    BEFORE UPDATE ON clinical_schema.medical_records
    FOR EACH ROW
    EXECUTE FUNCTION clinical_schema.increment_version();

-- Trigger to update diagnoses table updated_at
CREATE TRIGGER update_diagnoses_updated_at
    BEFORE UPDATE ON clinical_schema.medical_record_diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION clinical_schema.update_updated_at_column();

-- Trigger to update medications table updated_at
CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON clinical_schema.medical_record_medications
    FOR EACH ROW
    EXECUTE FUNCTION clinical_schema.update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Active medical records with diagnosis info
CREATE OR REPLACE VIEW clinical_schema.v_active_medical_records AS
SELECT 
    mr.*,
    COUNT(d.id) as diagnoses_count,
    COUNT(m.id) as medications_count,
    COUNT(a.id) as access_count
FROM clinical_schema.medical_records mr
LEFT JOIN clinical_schema.medical_record_diagnoses d ON d.medical_record_id = mr.id
LEFT JOIN clinical_schema.medical_record_medications m ON m.medical_record_id = mr.id
LEFT JOIN clinical_schema.medical_record_access a ON a.medical_record_id = mr.id
WHERE mr.status = 'active' AND mr.deleted_at IS NULL
GROUP BY mr.id;

-- View: Medical records with FHIR compliance info
CREATE OR REPLACE VIEW clinical_schema.v_fhir_compliant_records AS
SELECT 
    mr.*,
    (
        mr.fhir_resource_id IS NOT NULL AND
        mr.fhir_version IS NOT NULL AND
        jsonb_array_length(COALESCE(mr.diagnoses_json, '[]'::jsonb)) > 0
    ) as is_fhir_compliant
FROM clinical_schema.medical_records mr
WHERE mr.deleted_at IS NULL;

-- View: Recent medical records (last 30 days)
CREATE OR REPLACE VIEW clinical_schema.v_recent_medical_records AS
SELECT mr.*
FROM clinical_schema.medical_records mr
WHERE mr.visit_date >= (CURRENT_DATE - INTERVAL '30 days')
  AND mr.deleted_at IS NULL
ORDER BY mr.visit_date DESC, mr.created_at DESC;

-- =====================================================
-- GRANTS (Permissions for service role)
-- =====================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA clinical_schema TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA clinical_schema TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA clinical_schema TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA clinical_schema TO authenticated;

-- Grant permissions to service role
GRANT ALL ON SCHEMA clinical_schema TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA clinical_schema TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA clinical_schema TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA clinical_schema TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA clinical_schema IS 'Clinical EMR Service schema for medical records management with FHIR compliance';

COMMENT ON TABLE clinical_schema.medical_records IS 'Enhanced medical records table with FHIR R4 compliance, Vietnamese healthcare standards, and HIPAA audit support';
COMMENT ON TABLE clinical_schema.medical_record_diagnoses IS 'Normalized diagnoses table supporting multiple diagnoses per record with ICD-10 and Vietnamese medical codes';
COMMENT ON TABLE clinical_schema.medical_record_medications IS 'Normalized medications table with Vietnamese pharmaceutical standards and FHIR compliance';
COMMENT ON TABLE clinical_schema.medical_record_access IS 'Immutable access log for HIPAA compliance and audit trail';

COMMENT ON COLUMN clinical_schema.medical_records.record_id IS 'Vietnamese format medical record ID: MR-YYYYMM-XXX';
COMMENT ON COLUMN clinical_schema.medical_records.diagnoses_json IS 'JSONB array of structured diagnosis value objects';
COMMENT ON COLUMN clinical_schema.medical_records.medications_json IS 'JSONB array of structured medication value objects';
COMMENT ON COLUMN clinical_schema.medical_records.fhir_resource_id IS 'FHIR Composition resource identifier';
COMMENT ON COLUMN clinical_schema.medical_records.search_vector IS 'Full-text search vector auto-generated from symptoms, diagnosis, treatment, notes';
COMMENT ON COLUMN clinical_schema.medical_records.access_log_json IS 'HIPAA-compliant access audit trail (deprecated - use medical_record_access table)';
COMMENT ON COLUMN clinical_schema.medical_records.version IS 'Optimistic locking version number';

-- =====================================================
-- SAMPLE DATA (Optional - for development/testing)
-- =====================================================

/*
-- Sample medical record
INSERT INTO clinical_schema.medical_records (
    record_id, patient_id, doctor_id, visit_date, 
    symptoms, diagnosis, treatment, 
    diagnoses_json, medications_json,
    vietnamese_medical_code, specialty_code,
    created_by, updated_by
) VALUES 
(
    'MR-202510-001', 
    'PAT-202510-001', 
    'CARD-DOC-202510-001', 
    CURRENT_DATE,
    'Đau ngực, khó thở, tim đập nhanh',
    'Tăng huyết áp độ 2',
    'Thuốc hạ huyết áp, chế độ ăn ít muối, tập thể dục nhẹ',
    '[{
        "code": "I10",
        "display": "Tăng huyết áp nguyên phát",
        "category": "primary",
        "severity": "moderate",
        "status": "confirmed",
        "isPrimary": true,
        "isCritical": false
    }]'::jsonb,
    '[{
        "code": "VN-00123-01",
        "name": "Amlodipine 5mg",
        "genericName": "Amlodipine",
        "isActive": true,
        "isHighPriority": false
    }]'::jsonb,
    'MR-202510-001',
    'CARD',
    uuid_generate_v4(),
    uuid_generate_v4()
);
*/

-- =====================================================
-- MIGRATION VERIFICATION
-- =====================================================

-- Verify schema creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'clinical_schema') THEN
        RAISE EXCEPTION 'Schema clinical_schema was not created successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'clinical_schema' AND table_name = 'medical_records') THEN
        RAISE EXCEPTION 'Table medical_records was not created successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'clinical_schema' AND table_name = 'medical_record_diagnoses') THEN
        RAISE EXCEPTION 'Table medical_record_diagnoses was not created successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'clinical_schema' AND table_name = 'medical_record_medications') THEN
        RAISE EXCEPTION 'Table medical_record_medications was not created successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'clinical_schema' AND table_name = 'medical_record_access') THEN
        RAISE EXCEPTION 'Table medical_record_access was not created successfully';
    END IF;
    
    RAISE NOTICE '✅ Clinical EMR Service schema migration completed successfully';
    RAISE NOTICE '✅ Created 4 tables: medical_records, medical_record_diagnoses, medical_record_medications, medical_record_access';
    RAISE NOTICE '✅ Created 35+ indexes for optimal performance';
    RAISE NOTICE '✅ Enabled RLS policies for HIPAA compliance';
    RAISE NOTICE '✅ Created helper functions for business logic';
END $$;

