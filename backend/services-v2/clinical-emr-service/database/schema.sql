-- =====================================================
-- Clinical EMR Service - Database Schema
-- Simplified medical records schema for student thesis
-- =====================================================

-- Create clinical schema if not exists
CREATE SCHEMA IF NOT EXISTS clinical_schema;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MEDICAL RECORDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_schema.medical_records (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id VARCHAR(20) UNIQUE NOT NULL, -- MED-YYYYMM-XXX
    
    -- References (soft references to other services)
    patient_id VARCHAR(20) NOT NULL, -- PAT-YYYYMM-XXX
    doctor_id VARCHAR(30) NOT NULL,  -- DEPT-DOC-YYYYMM-XXX
    appointment_id UUID,             -- Optional reference to appointment
    
    -- Basic Medical Information (Simplified)
    visit_date DATE NOT NULL,
    symptoms TEXT,
    examination_notes TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medications TEXT,
    notes TEXT,
    
    -- Basic Vital Signs (JSONB for flexibility)
    vital_signs JSONB DEFAULT '{}',
    
    -- Status and Audit
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT chk_patient_id_format CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$'),
    CONSTRAINT chk_doctor_id_format CHECK (doctor_id ~ '^[A-Z]{2,4}-DOC-\d{6}-\d{3}$'),
    CONSTRAINT chk_record_id_format CHECK (record_id ~ '^MED-\d{6}-\d{3}$'),
    CONSTRAINT chk_visit_date_range CHECK (
        visit_date >= (CURRENT_DATE - INTERVAL '1 year') AND 
        visit_date <= (CURRENT_DATE + INTERVAL '7 days')
    )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON clinical_schema.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON clinical_schema.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON clinical_schema.medical_records(appointment_id);

-- Date indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON clinical_schema.medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON clinical_schema.medical_records(created_at);
CREATE INDEX IF NOT EXISTS idx_medical_records_updated_at ON clinical_schema.medical_records(updated_at);

-- Status index
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON clinical_schema.medical_records(status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_status ON clinical_schema.medical_records(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_status ON clinical_schema.medical_records(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_visit_date ON clinical_schema.medical_records(patient_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_visit_date ON clinical_schema.medical_records(doctor_id, visit_date DESC);

-- JSONB indexes for vital signs
CREATE INDEX IF NOT EXISTS idx_medical_records_vital_signs ON clinical_schema.medical_records USING GIN(vital_signs);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_symptoms_text ON clinical_schema.medical_records USING GIN(to_tsvector('english', COALESCE(symptoms, '')));
CREATE INDEX IF NOT EXISTS idx_medical_records_diagnosis_text ON clinical_schema.medical_records USING GIN(to_tsvector('english', COALESCE(diagnosis, '')));

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE clinical_schema.medical_records ENABLE ROW LEVEL SECURITY;

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
            SELECT 1 FROM auth_schema.user_profiles 
            WHERE id = auth.uid() AND role_type = 'admin'
        )
    );

-- Policy: System users can access records (for service-to-service communication)
CREATE POLICY "system_access" ON clinical_schema.medical_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_schema.user_profiles 
            WHERE id = auth.uid() AND role_type = 'system'
        )
    );

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
    SELECT COALESCE(MAX(CAST(SUBSTRING(record_id FROM 12 FOR 3) AS INTEGER)), 0) + 1
    INTO next_sequence
    FROM clinical_schema.medical_records
    WHERE record_id LIKE 'MED-' || year_month || '-%';
    
    -- Format the new record ID
    new_record_id := 'MED-' || year_month || '-' || LPAD(next_sequence::TEXT, 3, '0');
    
    RETURN new_record_id;
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

-- Function to update medical record
CREATE OR REPLACE FUNCTION clinical_schema.update_medical_record(
    p_record_id TEXT,
    p_symptoms TEXT DEFAULT NULL,
    p_examination_notes TEXT DEFAULT NULL,
    p_diagnosis TEXT DEFAULT NULL,
    p_treatment TEXT DEFAULT NULL,
    p_medications TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_vital_signs JSONB DEFAULT NULL,
    p_updated_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    record_exists BOOLEAN;
BEGIN
    -- Check if record exists and is not deleted
    SELECT EXISTS(
        SELECT 1 FROM clinical_schema.medical_records 
        WHERE record_id = p_record_id AND status != 'deleted'
    ) INTO record_exists;
    
    IF NOT record_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Update the record
    UPDATE clinical_schema.medical_records
    SET 
        symptoms = COALESCE(p_symptoms, symptoms),
        examination_notes = COALESCE(p_examination_notes, examination_notes),
        diagnosis = COALESCE(p_diagnosis, diagnosis),
        treatment = COALESCE(p_treatment, treatment),
        medications = COALESCE(p_medications, medications),
        notes = COALESCE(p_notes, notes),
        vital_signs = COALESCE(p_vital_signs, vital_signs),
        updated_by = p_updated_by,
        updated_at = NOW()
    WHERE record_id = p_record_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get medical record statistics
CREATE OR REPLACE FUNCTION clinical_schema.get_medical_record_statistics()
RETURNS TABLE(
    total_records BIGINT,
    active_records BIGINT,
    archived_records BIGINT,
    deleted_records BIGINT,
    records_with_diagnosis BIGINT,
    records_with_treatment BIGINT,
    records_with_vital_signs BIGINT,
    records_today BIGINT,
    records_this_month BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE status = 'active') as active_records,
        COUNT(*) FILTER (WHERE status = 'archived') as archived_records,
        COUNT(*) FILTER (WHERE status = 'deleted') as deleted_records,
        COUNT(*) FILTER (WHERE diagnosis IS NOT NULL AND diagnosis != '') as records_with_diagnosis,
        COUNT(*) FILTER (WHERE treatment IS NOT NULL AND treatment != '') as records_with_treatment,
        COUNT(*) FILTER (WHERE vital_signs != '{}') as records_with_vital_signs,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as records_today,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as records_this_month
    FROM clinical_schema.medical_records;
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

-- =====================================================
-- INITIAL DATA / SEED DATA (Optional)
-- =====================================================

-- Insert some sample data for testing (can be removed in production)
-- This is commented out by default
/*
INSERT INTO clinical_schema.medical_records (
    record_id, patient_id, doctor_id, visit_date, 
    symptoms, diagnosis, treatment, created_by, updated_by
) VALUES 
(
    'MED-202501-001', 
    'PAT-202501-001', 
    'CARD-DOC-202501-001', 
    CURRENT_DATE,
    'Đau ngực, khó thở',
    'Tăng huyết áp',
    'Thuốc hạ huyết áp, chế độ ăn ít muối',
    uuid_generate_v4(),
    uuid_generate_v4()
);
*/

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA clinical_schema IS 'Clinical EMR Service schema for medical records management';
COMMENT ON TABLE clinical_schema.medical_records IS 'Simplified medical records table for student thesis project';
COMMENT ON COLUMN clinical_schema.medical_records.record_id IS 'Vietnamese format medical record ID: MED-YYYYMM-XXX';
COMMENT ON COLUMN clinical_schema.medical_records.patient_id IS 'Reference to patient in patient service: PAT-YYYYMM-XXX';
COMMENT ON COLUMN clinical_schema.medical_records.doctor_id IS 'Reference to doctor in provider service: DEPT-DOC-YYYYMM-XXX';
COMMENT ON COLUMN clinical_schema.medical_records.vital_signs IS 'JSONB field for flexible vital signs storage';
COMMENT ON FUNCTION clinical_schema.generate_medical_record_id() IS 'Generates next sequential medical record ID for current month';
COMMENT ON FUNCTION clinical_schema.create_medical_record IS 'Creates new medical record with validation and ID generation';
COMMENT ON FUNCTION clinical_schema.update_medical_record IS 'Updates existing medical record with validation';
COMMENT ON FUNCTION clinical_schema.get_medical_record_statistics() IS 'Returns comprehensive statistics about medical records';
