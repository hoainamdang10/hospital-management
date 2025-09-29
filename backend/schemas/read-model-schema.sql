-- =====================================================
-- Read Model Schema for Hospital Management System
-- Optimized views for CQRS pattern with <200ms performance
-- =====================================================
-- @author Hospital Management Team
-- @version 1.0.0
-- @compliance HIPAA, CQRS, Performance Optimization

-- Create read model schema
CREATE SCHEMA IF NOT EXISTS read_model_schema;

-- Set search path for this schema
SET search_path TO read_model_schema, public;

-- =====================================================
-- PATIENT HEALTHCARE VIEW
-- Optimized read model for patient healthcare queries
-- =====================================================
CREATE TABLE IF NOT EXISTS read_model_schema.patient_healthcare_view (
    -- Primary identification
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL UNIQUE,
    
    -- Patient basic info (denormalized from auth_schema.profiles)
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    
    -- Medical information
    blood_type VARCHAR(10),
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications JSONB DEFAULT '{}',
    medical_history TEXT,
    
    -- Healthcare metrics
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    total_medical_records INTEGER DEFAULT 0,
    last_appointment_date TIMESTAMPTZ,
    last_medical_record_date TIMESTAMPTZ,
    
    -- FHIR compliance
    fhir_compliance_score INTEGER DEFAULT 0,
    fhir_last_validated TIMESTAMPTZ,
    
    -- Emergency contact (denormalized)
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    
    -- Insurance info (denormalized)
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    insurance_group_number VARCHAR(100),
    
    -- Status and audit
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CHECK (status IN ('active', 'inactive', 'suspended')),
    CHECK (fhir_compliance_score >= 0 AND fhir_compliance_score <= 100),
    CHECK (total_appointments >= 0),
    CHECK (completed_appointments >= 0),
    CHECK (cancelled_appointments >= 0)
);

-- Indexes for patient healthcare view
CREATE INDEX IF NOT EXISTS idx_patient_healthcare_patient_id ON read_model_schema.patient_healthcare_view(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_healthcare_full_name ON read_model_schema.patient_healthcare_view(full_name);
CREATE INDEX IF NOT EXISTS idx_patient_healthcare_status ON read_model_schema.patient_healthcare_view(status);
CREATE INDEX IF NOT EXISTS idx_patient_healthcare_blood_type ON read_model_schema.patient_healthcare_view(blood_type) WHERE blood_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_healthcare_last_appointment ON read_model_schema.patient_healthcare_view(last_appointment_date DESC) WHERE last_appointment_date IS NOT NULL;

-- =====================================================
-- DOCTOR AVAILABILITY VIEW
-- Optimized read model for doctor availability queries
-- =====================================================
CREATE TABLE IF NOT EXISTS read_model_schema.doctor_availability_view (
    -- Primary identification
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL UNIQUE,
    
    -- Doctor basic info (denormalized)
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    license_number VARCHAR(100),
    
    -- Professional information
    department_name VARCHAR(255),
    specialty_name VARCHAR(255),
    years_of_experience INTEGER DEFAULT 0,
    consultation_fee DECIMAL(10,2),
    
    -- Availability metrics
    total_slots_this_week INTEGER DEFAULT 0,
    available_slots_this_week INTEGER DEFAULT 0,
    booked_slots_this_week INTEGER DEFAULT 0,
    availability_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Schedule information
    working_days TEXT[], -- ['monday', 'tuesday', ...]
    working_hours_start TIME,
    working_hours_end TIME,
    break_time_start TIME,
    break_time_end TIME,
    
    -- Performance metrics
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    
    -- Next available slot
    next_available_slot TIMESTAMPTZ,
    next_available_date DATE,
    
    -- Status and audit
    status VARCHAR(50) DEFAULT 'active',
    is_available_today BOOLEAN DEFAULT FALSE,
    last_appointment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CHECK (status IN ('active', 'inactive', 'on_leave', 'suspended')),
    CHECK (years_of_experience >= 0),
    CHECK (consultation_fee >= 0),
    CHECK (availability_percentage >= 0 AND availability_percentage <= 100),
    CHECK (average_rating >= 0 AND average_rating <= 5),
    CHECK (total_reviews >= 0)
);

-- Indexes for doctor availability view
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON read_model_schema.doctor_availability_view(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_department ON read_model_schema.doctor_availability_view(department_name);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_specialty ON read_model_schema.doctor_availability_view(specialty_name);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_status ON read_model_schema.doctor_availability_view(status);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_today ON read_model_schema.doctor_availability_view(is_available_today) WHERE is_available_today = TRUE;
CREATE INDEX IF NOT EXISTS idx_doctor_availability_next_slot ON read_model_schema.doctor_availability_view(next_available_slot) WHERE next_available_slot IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_availability_rating ON read_model_schema.doctor_availability_view(average_rating DESC);

-- =====================================================
-- APPOINTMENT SUMMARY VIEW
-- Optimized read model for appointment queries
-- =====================================================
CREATE TABLE IF NOT EXISTS read_model_schema.appointment_summary_view (
    -- Primary identification
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL UNIQUE,
    
    -- Appointment basic info
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_datetime TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    
    -- Patient information (denormalized)
    patient_id UUID NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20),
    patient_email VARCHAR(255),
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    
    -- Doctor information (denormalized)
    doctor_id UUID NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    doctor_phone VARCHAR(20),
    doctor_specialty VARCHAR(255),
    doctor_department VARCHAR(255),
    
    -- Appointment details
    appointment_type VARCHAR(100) DEFAULT 'consultation',
    chief_complaint TEXT,
    appointment_notes TEXT,
    consultation_fee DECIMAL(10,2),
    
    -- Status and workflow
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    queue_number INTEGER,
    check_in_time TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    -- Payment information
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_amount DECIMAL(10,2),
    
    -- Medical records
    has_medical_record BOOLEAN DEFAULT FALSE,
    medical_record_id UUID,
    diagnosis_summary TEXT,
    prescription_summary TEXT,
    
    -- Room and location
    room_number VARCHAR(50),
    room_type VARCHAR(100),
    floor_number INTEGER,
    
    -- Audit and tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    CHECK (duration_minutes > 0),
    CHECK (consultation_fee >= 0),
    CHECK (payment_amount >= 0)
);

-- Indexes for appointment summary view
CREATE INDEX IF NOT EXISTS idx_appointment_summary_appointment_id ON read_model_schema.appointment_summary_view(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_summary_patient_id ON read_model_schema.appointment_summary_view(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_summary_doctor_id ON read_model_schema.appointment_summary_view(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_summary_date ON read_model_schema.appointment_summary_view(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_summary_datetime ON read_model_schema.appointment_summary_view(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointment_summary_status ON read_model_schema.appointment_summary_view(status);
CREATE INDEX IF NOT EXISTS idx_appointment_summary_payment_status ON read_model_schema.appointment_summary_view(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointment_summary_department ON read_model_schema.appointment_summary_view(doctor_department);

-- =====================================================
-- MEDICAL RECORDS SUMMARY VIEW
-- Optimized read model for medical records queries
-- =====================================================
CREATE TABLE IF NOT EXISTS read_model_schema.medical_records_summary_view (
    -- Primary identification
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID NOT NULL UNIQUE,
    
    -- Patient information (denormalized)
    patient_id UUID NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    
    -- Doctor information (denormalized)
    doctor_id UUID NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    doctor_specialty VARCHAR(255),
    
    -- Appointment context
    appointment_id UUID,
    appointment_date DATE,
    
    -- Medical record details
    record_date DATE NOT NULL,
    chief_complaint TEXT,
    diagnosis_summary TEXT,
    treatment_plan TEXT,
    
    -- Diagnoses (denormalized)
    primary_diagnosis_code VARCHAR(20),
    primary_diagnosis_description TEXT,
    secondary_diagnoses JSONB DEFAULT '[]',
    
    -- Medications
    prescribed_medications JSONB DEFAULT '[]',
    medication_count INTEGER DEFAULT 0,
    
    -- Lab results and vitals
    has_lab_results BOOLEAN DEFAULT FALSE,
    has_vitals BOOLEAN DEFAULT FALSE,
    vital_signs JSONB DEFAULT '{}',
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- FHIR compliance
    fhir_resource_id VARCHAR(255),
    fhir_compliance_score INTEGER DEFAULT 0,
    
    -- Status and audit
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CHECK (status IN ('active', 'archived', 'deleted')),
    CHECK (fhir_compliance_score >= 0 AND fhir_compliance_score <= 100),
    CHECK (medication_count >= 0)
);

-- Indexes for medical records summary view
CREATE INDEX IF NOT EXISTS idx_medical_records_summary_record_id ON read_model_schema.medical_records_summary_view(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_summary_patient_id ON read_model_schema.medical_records_summary_view(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_summary_doctor_id ON read_model_schema.medical_records_summary_view(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_summary_record_date ON read_model_schema.medical_records_summary_view(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_summary_diagnosis_code ON read_model_schema.medical_records_summary_view(primary_diagnosis_code) WHERE primary_diagnosis_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_records_summary_follow_up ON read_model_schema.medical_records_summary_view(follow_up_date) WHERE follow_up_required = TRUE;

-- =====================================================
-- HEALTHCARE ANALYTICS VIEW
-- Aggregated data for dashboard and reporting
-- =====================================================
CREATE TABLE IF NOT EXISTS read_model_schema.healthcare_analytics_view (
    -- Primary identification
    analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_period DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
    
    -- Patient metrics
    total_patients INTEGER DEFAULT 0,
    new_patients INTEGER DEFAULT 0,
    active_patients INTEGER DEFAULT 0,
    
    -- Doctor metrics
    total_doctors INTEGER DEFAULT 0,
    active_doctors INTEGER DEFAULT 0,
    doctors_on_duty INTEGER DEFAULT 0,
    
    -- Appointment metrics
    total_appointments INTEGER DEFAULT 0,
    scheduled_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    no_show_appointments INTEGER DEFAULT 0,
    
    -- Medical records metrics
    new_medical_records INTEGER DEFAULT 0,
    total_diagnoses INTEGER DEFAULT 0,
    fhir_compliant_records INTEGER DEFAULT 0,
    
    -- Financial metrics
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    consultation_revenue DECIMAL(12,2) DEFAULT 0.00,
    pending_payments DECIMAL(12,2) DEFAULT 0.00,
    
    -- Performance metrics
    average_wait_time_minutes INTEGER DEFAULT 0,
    average_consultation_time_minutes INTEGER DEFAULT 0,
    patient_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(date_period, period_type),
    CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    CHECK (total_patients >= 0),
    CHECK (total_appointments >= 0),
    CHECK (total_revenue >= 0),
    CHECK (patient_satisfaction_score >= 0 AND patient_satisfaction_score <= 5)
);

-- Indexes for analytics view
CREATE INDEX IF NOT EXISTS idx_healthcare_analytics_date_period ON read_model_schema.healthcare_analytics_view(date_period DESC);
CREATE INDEX IF NOT EXISTS idx_healthcare_analytics_period_type ON read_model_schema.healthcare_analytics_view(period_type);

-- =====================================================
-- RLS POLICIES FOR HIPAA COMPLIANCE
-- =====================================================

-- Enable RLS on all read model tables
ALTER TABLE read_model_schema.patient_healthcare_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_model_schema.doctor_availability_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_model_schema.appointment_summary_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_model_schema.medical_records_summary_view ENABLE ROW LEVEL SECURITY;

-- Patient healthcare view policies
CREATE POLICY "patient_healthcare_view_access" ON read_model_schema.patient_healthcare_view
    FOR SELECT USING (
        patient_id::text = current_setting('app.patient_id', true) OR
        current_setting('app.role', true) IN ('doctor', 'admin', 'receptionist')
    );

-- Doctor availability view policies (public for scheduling)
CREATE POLICY "doctor_availability_view_public" ON read_model_schema.doctor_availability_view
    FOR SELECT USING (status = 'active');

-- Appointment summary view policies
CREATE POLICY "appointment_summary_view_access" ON read_model_schema.appointment_summary_view
    FOR SELECT USING (
        patient_id::text = current_setting('app.patient_id', true) OR
        doctor_id::text = current_setting('app.doctor_id', true) OR
        current_setting('app.role', true) IN ('admin', 'receptionist')
    );

-- Medical records summary view policies
CREATE POLICY "medical_records_summary_view_access" ON read_model_schema.medical_records_summary_view
    FOR SELECT USING (
        patient_id::text = current_setting('app.patient_id', true) OR
        doctor_id::text = current_setting('app.doctor_id', true) OR
        current_setting('app.role', true) IN ('admin')
    );

-- Comments for documentation
COMMENT ON SCHEMA read_model_schema IS 'Read Model schema for CQRS pattern - optimized views for <200ms query performance';
COMMENT ON TABLE read_model_schema.patient_healthcare_view IS 'Denormalized patient data for fast healthcare queries';
COMMENT ON TABLE read_model_schema.doctor_availability_view IS 'Real-time doctor availability for appointment scheduling';
COMMENT ON TABLE read_model_schema.appointment_summary_view IS 'Complete appointment information for dashboard and reports';
COMMENT ON TABLE read_model_schema.medical_records_summary_view IS 'Medical records with denormalized patient/doctor data';
COMMENT ON TABLE read_model_schema.healthcare_analytics_view IS 'Aggregated healthcare metrics for analytics and reporting';
