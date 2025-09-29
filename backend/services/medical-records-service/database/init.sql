-- Medical Records Service - Supabase Schema Extensions
-- Note: This extends the existing medical_records table in Supabase

-- Add columns to existing medical_records table if they don't exist
DO $$
BEGIN
    -- Add chief_complaint if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'chief_complaint') THEN
        ALTER TABLE medical_records ADD COLUMN chief_complaint TEXT;
    END IF;

    -- Add present_illness if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'present_illness') THEN
        ALTER TABLE medical_records ADD COLUMN present_illness TEXT;
    END IF;

    -- Add past_medical_history if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'past_medical_history') THEN
        ALTER TABLE medical_records ADD COLUMN past_medical_history TEXT;
    END IF;

    -- Add physical_examination if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'physical_examination') THEN
        ALTER TABLE medical_records ADD COLUMN physical_examination TEXT;
    END IF;

    -- Add vital_signs if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'vital_signs') THEN
        ALTER TABLE medical_records ADD COLUMN vital_signs JSONB;
    END IF;

    -- Add treatment_plan if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'treatment_plan') THEN
        ALTER TABLE medical_records ADD COLUMN treatment_plan TEXT;
    END IF;

    -- Add follow_up_instructions if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'follow_up_instructions') THEN
        ALTER TABLE medical_records ADD COLUMN follow_up_instructions TEXT;
    END IF;

    -- MERGED: Add prescriptions column for embedded prescription data (from Prescription Service)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'prescriptions') THEN
        ALTER TABLE medical_records ADD COLUMN prescriptions JSONB;
    END IF;

    -- Add simplified fields for the new structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'symptoms') THEN
        ALTER TABLE medical_records ADD COLUMN symptoms TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'examination_notes') THEN
        ALTER TABLE medical_records ADD COLUMN examination_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'treatment') THEN
        ALTER TABLE medical_records ADD COLUMN treatment TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'basic_vitals') THEN
        ALTER TABLE medical_records ADD COLUMN basic_vitals JSONB;
    END IF;

    -- Add status if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'status') THEN
        ALTER TABLE medical_records ADD COLUMN status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'archived', 'deleted'));
    END IF;

    -- Add created_by if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'created_by') THEN
        ALTER TABLE medical_records ADD COLUMN created_by VARCHAR(20);
    END IF;

    -- Add updated_by if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'medical_records' AND column_name = 'updated_by') THEN
        ALTER TABLE medical_records ADD COLUMN updated_by VARCHAR(20);
    END IF;
END $$;

-- Medical Record Attachments table
CREATE TABLE IF NOT EXISTS medical_record_attachments (
    attachment_id VARCHAR(20) PRIMARY KEY,
    record_id VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    uploaded_by VARCHAR(20) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES medical_records(record_id) ON DELETE CASCADE
);

-- Lab Results table
CREATE TABLE IF NOT EXISTS lab_results (
    result_id VARCHAR(20) PRIMARY KEY,
    record_id VARCHAR(20) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    result_value VARCHAR(255),
    reference_range VARCHAR(255),
    unit VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    test_date TIMESTAMP NOT NULL,
    result_date TIMESTAMP,
    lab_technician VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES medical_records(record_id) ON DELETE CASCADE
);

-- Vital Signs History table
CREATE TABLE IF NOT EXISTS vital_signs_history (
    vital_id VARCHAR(20) PRIMARY KEY,
    record_id VARCHAR(20) NOT NULL,
    temperature DECIMAL(4,1),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation DECIMAL(5,2),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,1),
    recorded_at TIMESTAMP NOT NULL,
    recorded_by VARCHAR(20) NOT NULL,
    notes TEXT,
    FOREIGN KEY (record_id) REFERENCES medical_records(record_id) ON DELETE CASCADE
);

-- Medical Record Templates table
CREATE TABLE IF NOT EXISTS medical_record_templates (
    template_id VARCHAR(20) PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100),
    template_content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);
CREATE INDEX IF NOT EXISTS idx_medical_record_attachments_record_id ON medical_record_attachments(record_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_record_id ON lab_results(record_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test_date ON lab_results(test_date);
CREATE INDEX IF NOT EXISTS idx_vital_signs_record_id ON vital_signs_history(record_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_at ON vital_signs_history(recorded_at);

-- Insert sample templates
INSERT INTO medical_record_templates (template_id, template_name, specialty, template_content, created_by) VALUES
('TPL000001', 'General Consultation', 'General Medicine', '{"sections": ["chief_complaint", "present_illness", "physical_examination", "diagnosis", "treatment_plan"]}', 'SYSTEM'),
('TPL000002', 'Cardiology Consultation', 'Cardiology', '{"sections": ["chief_complaint", "cardiac_history", "physical_examination", "ecg_findings", "diagnosis", "treatment_plan"]}', 'SYSTEM'),
('TPL000003', 'Pediatric Consultation', 'Pediatrics', '{"sections": ["chief_complaint", "growth_development", "immunization_history", "physical_examination", "diagnosis", "treatment_plan"]}', 'SYSTEM')
ON CONFLICT (template_id) DO NOTHING;
