-- =====================================================
-- Clinical EMR Service - Add Missing Columns Migration
-- This migration adds missing columns to existing medical_records table
-- USE THIS if you already have data in the old schema
-- =====================================================
--
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Date: 2025-10-25
--
-- NOTE: Run this INSTEAD of 001_enhanced_medical_records_schema.sql 
--       if you want to preserve existing data
-- =====================================================

-- =====================================================
-- ADD MISSING COLUMNS TO medical_records TABLE
-- =====================================================

-- Enhanced Vital Signs
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS vital_signs_json JSONB;

-- Diagnoses and Medications Arrays
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS diagnoses_json JSONB DEFAULT '[]';

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS medications_json JSONB DEFAULT '[]';

-- FHIR Compliance Fields
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS fhir_resource_id VARCHAR(100);

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS fhir_version VARCHAR(20) DEFAULT '4.0.1';

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS fhir_profile TEXT;

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS fhir_compliant BOOLEAN DEFAULT FALSE;

-- Vietnamese Medical Standards
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS vietnamese_medical_code VARCHAR(50);

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS specialty_code VARCHAR(10);

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS hospital_code VARCHAR(20);

-- Query Optimization Fields
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS has_vital_signs BOOLEAN DEFAULT FALSE;

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS has_complete_vital_signs BOOLEAN DEFAULT FALSE;

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS critical_diagnoses_count INTEGER DEFAULT 0;

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS active_medications_count INTEGER DEFAULT 0;

-- Full-Text Search
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- HIPAA Audit Fields
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS access_log_json JSONB DEFAULT '[]';

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS last_accessed_by VARCHAR(50);

-- Soft Delete Fields
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Optimistic Locking
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;

-- Examination Notes (if not exists)
ALTER TABLE clinical_schema.medical_records 
ADD COLUMN IF NOT EXISTS examination_notes TEXT;

-- =====================================================
-- UPDATE STATUS CONSTRAINT TO INCLUDE NEW STATUSES
-- =====================================================

-- Drop old constraint
ALTER TABLE clinical_schema.medical_records 
DROP CONSTRAINT IF EXISTS chk_status;

-- Add new constraint with all statuses
ALTER TABLE clinical_schema.medical_records 
ADD CONSTRAINT chk_status CHECK (status IN (
    'active', 'archived', 'deleted', 'draft', 
    'pending-review', 'reviewed', 'amended'
));

-- =====================================================
-- UPDATE RECORD ID FORMAT CONSTRAINT
-- =====================================================

-- Drop old constraint (MED- format)
ALTER TABLE clinical_schema.medical_records 
DROP CONSTRAINT IF EXISTS chk_record_id_format;

-- Add new constraint (MR- format to match RecordId value object)
ALTER TABLE clinical_schema.medical_records 
ADD CONSTRAINT chk_record_id_format CHECK (record_id ~ '^MR-\d{6}-\d{3}$');

-- =====================================================
-- ADD VERSION CONSTRAINT
-- =====================================================

ALTER TABLE clinical_schema.medical_records 
ADD CONSTRAINT IF NOT EXISTS chk_version_positive CHECK (version >= 0);

-- =====================================================
-- CREATE NEW INDEXES FOR ENHANCED FIELDS
-- =====================================================

-- JSONB indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_diagnoses_json 
ON clinical_schema.medical_records USING GIN(diagnoses_json);

CREATE INDEX IF NOT EXISTS idx_medical_records_medications_json 
ON clinical_schema.medical_records USING GIN(medications_json);

CREATE INDEX IF NOT EXISTS idx_medical_records_access_log 
ON clinical_schema.medical_records USING GIN(access_log_json);

CREATE INDEX IF NOT EXISTS idx_medical_records_vital_signs_json 
ON clinical_schema.medical_records USING GIN(vital_signs_json);

-- FHIR indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_fhir_resource_id 
ON clinical_schema.medical_records(fhir_resource_id);

CREATE INDEX IF NOT EXISTS idx_medical_records_fhir_compliant 
ON clinical_schema.medical_records(fhir_compliant) WHERE fhir_compliant = TRUE;

-- Vietnamese healthcare indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_specialty_code 
ON clinical_schema.medical_records(specialty_code);

CREATE INDEX IF NOT EXISTS idx_medical_records_vietnamese_code 
ON clinical_schema.medical_records(vietnamese_medical_code);

-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_critical_diagnoses 
ON clinical_schema.medical_records(critical_diagnoses_count) 
WHERE critical_diagnoses_count > 0;

CREATE INDEX IF NOT EXISTS idx_medical_records_active_medications 
ON clinical_schema.medical_records(active_medications_count) 
WHERE active_medications_count > 0;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_medical_records_search_vector 
ON clinical_schema.medical_records USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_medical_records_notes_text 
ON clinical_schema.medical_records USING GIN(to_tsvector('english', COALESCE(notes, '')));

CREATE INDEX IF NOT EXISTS idx_medical_records_examination_notes_text 
ON clinical_schema.medical_records USING GIN(to_tsvector('english', COALESCE(examination_notes, '')));

-- Soft delete index
CREATE INDEX IF NOT EXISTS idx_medical_records_deleted_at 
ON clinical_schema.medical_records(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- CREATE RELATED TABLES
-- =====================================================

-- Diagnoses Table
CREATE TABLE IF NOT EXISTS clinical_schema.medical_record_diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID NOT NULL REFERENCES clinical_schema.medical_records(id) ON DELETE CASCADE,
    
    -- Diagnosis Information
    code VARCHAR(20) NOT NULL,
    display VARCHAR(500) NOT NULL,
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
    vietnamese_classification VARCHAR(50),
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
    
    CONSTRAINT uk_medical_record_diagnosis UNIQUE (medical_record_id, code)
);

-- Medications Table
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
    dosage_form VARCHAR(20) NOT NULL,
    route VARCHAR(20) NOT NULL,
    
    -- Prescription Details
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    frequency_unit VARCHAR(30) NOT NULL,
    duration VARCHAR(50),
    
    -- Instructions
    instructions TEXT NOT NULL,
    special_instructions TEXT,
    
    -- Status and Dates
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_date DATE,
    end_date DATE,
    
    -- Prescriber Information
    prescribed_by VARCHAR(50) NOT NULL,
    pharmacist_notes TEXT,
    
    -- Vietnamese Pharmaceutical Standards
    vietnamese_drug_code VARCHAR(20),
    registration_number VARCHAR(20),
    manufacturer VARCHAR(200),
    
    -- FHIR Compliance
    fhir_code_system TEXT,
    fhir_version VARCHAR(20) DEFAULT '4.0.1',
    
    -- Safety Information
    contraindications JSONB DEFAULT '[]',
    side_effects JSONB DEFAULT '[]',
    interactions JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    
    -- Metadata
    notes TEXT,
    priority VARCHAR(10) DEFAULT 'routine',
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uk_medical_record_medication UNIQUE (medical_record_id, code)
);

-- Access Log Table
CREATE TABLE IF NOT EXISTS clinical_schema.medical_record_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID NOT NULL REFERENCES clinical_schema.medical_records(id) ON DELETE CASCADE,
    
    -- Access Information
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_by VARCHAR(50) NOT NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('read', 'write', 'print', 'export')),
    
    -- Context Information
    ip_address VARCHAR(45),
    user_agent TEXT,
    purpose TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    
    -- Immutable
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BACKFILL EXISTING DATA
-- =====================================================

-- Update fhir_resource_id for existing records
UPDATE clinical_schema.medical_records
SET fhir_resource_id = 'MedicalRecord/' || record_id
WHERE fhir_resource_id IS NULL;

-- Update vietnamese_medical_code for existing records
UPDATE clinical_schema.medical_records
SET vietnamese_medical_code = record_id
WHERE vietnamese_medical_code IS NULL;

-- Update has_vital_signs flag
UPDATE clinical_schema.medical_records
SET has_vital_signs = (vital_signs IS NOT NULL AND vital_signs::text != '{}')
WHERE has_vital_signs = FALSE;

-- Initialize search vector for existing records
UPDATE clinical_schema.medical_records
SET search_vector = 
    setweight(to_tsvector('english', COALESCE(symptoms, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(examination_notes, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(diagnosis, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(treatment, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(notes, '')), 'C')
WHERE search_vector IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count missing columns
DO $$
DECLARE
    missing_columns INTEGER;
    total_new_columns INTEGER := 20; -- Expected number of new columns
BEGIN
    SELECT COUNT(*)
    INTO missing_columns
    FROM information_schema.columns
    WHERE table_schema = 'clinical_schema' 
    AND table_name = 'medical_records'
    AND column_name IN (
        'diagnoses_json', 'medications_json', 'vital_signs_json',
        'fhir_resource_id', 'fhir_version', 'fhir_profile', 'fhir_compliant',
        'vietnamese_medical_code', 'specialty_code', 'hospital_code',
        'has_vital_signs', 'has_complete_vital_signs',
        'critical_diagnoses_count', 'active_medications_count',
        'search_vector', 'access_log_json',
        'last_accessed_at', 'last_accessed_by',
        'deleted_at', 'deleted_by', 'version'
    );
    
    RAISE NOTICE '✅ Added % out of % expected new columns', missing_columns, total_new_columns;
    
    IF missing_columns < total_new_columns THEN
        RAISE WARNING '⚠️  Some columns may not have been added. Please check manually.';
    END IF;
END $$;

-- Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'clinical_schema' 
AND table_name = 'medical_records'
ORDER BY ordinal_position;

