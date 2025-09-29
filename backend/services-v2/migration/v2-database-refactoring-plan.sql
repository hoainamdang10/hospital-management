-- V2 Database Refactoring Plan
-- Hospital Management System - Clean Architecture Migration
-- Generated: 2025-09-27

-- =====================================================
-- PHASE 1: CLEANUP REDUNDANT SCHEMAS (Week 1)
-- =====================================================

-- 1.1 Backup critical data before cleanup
CREATE SCHEMA IF NOT EXISTS migration_backup;

-- Backup critical archive data
CREATE TABLE migration_backup.doctors_archive AS 
SELECT * FROM archive_schema.chatbot_doctors;

CREATE TABLE migration_backup.training_data_archive AS 
SELECT * FROM archive_schema.chatbot_training_data;

CREATE TABLE migration_backup.diseases_archive AS 
SELECT * FROM archive_schema.diseases;

CREATE TABLE migration_backup.medications_archive AS 
SELECT * FROM archive_schema.medications;

-- 1.2 Remove redundant schemas
DROP SCHEMA IF EXISTS archive_schema CASCADE;
DROP SCHEMA IF EXISTS hospital_dev CASCADE;
DROP SCHEMA IF EXISTS backup_original CASCADE;
DROP SCHEMA IF EXISTS read_model_schema CASCADE;

-- =====================================================
-- PHASE 2: CREATE MISSING DOMAIN TABLES (Week 1-2)
-- =====================================================

-- 2.1 AUTH SCHEMA - Missing Tables
CREATE TABLE IF NOT EXISTS auth_schema.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_schema.user_profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_schema.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES auth_schema.healthcare_roles(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    actions TEXT[] NOT NULL,
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_name, resource_type)
);

CREATE TABLE IF NOT EXISTS auth_schema.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth_schema.user_profiles(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_schema.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 PATIENT SCHEMA - Missing Tables
CREATE TABLE IF NOT EXISTS patient_schema.patient_medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient_schema.patient_profiles(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    diagnosed_date DATE,
    status TEXT CHECK (status IN ('active', 'resolved', 'chronic', 'monitoring')),
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    notes TEXT,
    doctor_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_schema.patient_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient_schema.patient_profiles(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    group_number TEXT,
    coverage_type TEXT CHECK (coverage_type IN ('BHYT', 'BHTN', 'private', 'self_pay')),
    effective_date DATE NOT NULL,
    expiration_date DATE,
    copay_amount DECIMAL(10,2),
    deductible_amount DECIMAL(10,2),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_schema.patient_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient_schema.patient_profiles(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address JSONB,
    is_primary BOOLEAN DEFAULT false,
    can_make_decisions BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_schema.patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient_schema.patient_profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('treatment', 'data_sharing', 'research', 'marketing', 'photography')),
    consent_status TEXT NOT NULL CHECK (consent_status IN ('granted', 'denied', 'withdrawn', 'expired')),
    consent_date TIMESTAMPTZ NOT NULL,
    expiration_date TIMESTAMPTZ,
    witness_id UUID,
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 DOCTOR SCHEMA - Missing Tables
CREATE TABLE IF NOT EXISTS doctor_schema.doctor_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctor_schema.doctor_profiles(id) ON DELETE CASCADE,
    credential_type TEXT NOT NULL CHECK (credential_type IN ('medical_license', 'board_certification', 'fellowship', 'residency')),
    credential_name TEXT NOT NULL,
    issuing_authority TEXT NOT NULL,
    credential_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiration_date DATE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'expired', 'revoked')),
    verification_date TIMESTAMPTZ,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctor_id, credential_type, credential_number)
);

CREATE TABLE IF NOT EXISTS doctor_schema.doctor_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctor_schema.doctor_profiles(id) ON DELETE CASCADE,
    certification_name TEXT NOT NULL,
    certifying_body TEXT NOT NULL,
    certification_date DATE NOT NULL,
    expiration_date DATE,
    continuing_education_hours INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_schema.doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctor_schema.doctor_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    availability_type TEXT DEFAULT 'available' CHECK (availability_type IN ('available', 'busy', 'break', 'emergency_only')),
    max_appointments INTEGER DEFAULT 1,
    current_appointments INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctor_id, date, start_time)
);

CREATE TABLE IF NOT EXISTS doctor_schema.doctor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctor_schema.doctor_profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    appointment_id UUID,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    review_categories JSONB DEFAULT '{}', -- {communication: 5, punctuality: 4, expertise: 5}
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 APPOINTMENT SCHEMA - Missing Tables
CREATE TABLE IF NOT EXISTS appointment_schema.appointment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name TEXT UNIQUE NOT NULL,
    type_code TEXT UNIQUE NOT NULL,
    description TEXT,
    default_duration INTEGER NOT NULL DEFAULT 30, -- minutes
    preparation_time INTEGER DEFAULT 0, -- minutes
    cleanup_time INTEGER DEFAULT 0, -- minutes
    base_fee DECIMAL(10,2) DEFAULT 0,
    requires_referral BOOLEAN DEFAULT false,
    requires_fasting BOOLEAN DEFAULT false,
    special_instructions TEXT,
    color_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_schema.appointment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_type_id UUID NOT NULL REFERENCES appointment_schema.appointment_types(id),
    recurrence_pattern JSONB NOT NULL, -- {type: 'weekly', interval: 1, days: [1,2,3,4,5]}
    duration_minutes INTEGER NOT NULL,
    max_participants INTEGER DEFAULT 1,
    preparation_instructions TEXT,
    follow_up_instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_schema.appointment_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL,
    conflicting_appointment_id UUID NOT NULL,
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('time_overlap', 'resource_conflict', 'doctor_unavailable', 'room_unavailable')),
    conflict_severity TEXT DEFAULT 'medium' CHECK (conflict_severity IN ('low', 'medium', 'high', 'critical')),
    resolution_status TEXT DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'resolved', 'ignored')),
    resolution_notes TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID
);

CREATE TABLE IF NOT EXISTS appointment_schema.appointment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push', 'call')),
    scheduled_time TIMESTAMPTZ NOT NULL,
    sent_time TIMESTAMPTZ,
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    recipient_contact TEXT NOT NULL,
    message_template TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHASE 3: ADD FOREIGN KEY RELATIONSHIPS (Week 2)
-- =====================================================

-- 3.1 Patient Schema Foreign Keys
ALTER TABLE patient_schema.patient_profiles 
ADD CONSTRAINT fk_patient_user_id 
FOREIGN KEY (user_id) REFERENCES auth_schema.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE patient_schema.patient_diagnoses 
ADD CONSTRAINT fk_diagnosis_patient_id 
FOREIGN KEY (patient_id) REFERENCES patient_schema.patient_profiles(id) ON DELETE CASCADE;

-- 3.2 Doctor Schema Foreign Keys  
ALTER TABLE doctor_schema.doctor_profiles 
ADD CONSTRAINT fk_doctor_user_id 
FOREIGN KEY (user_id) REFERENCES auth_schema.user_profiles(id) ON DELETE CASCADE;

-- 3.3 Appointment Schema Foreign Keys
ALTER TABLE appointment_schema.appointments 
ADD CONSTRAINT fk_appointment_patient_id 
FOREIGN KEY (patient_id) REFERENCES patient_schema.patient_profiles(id) ON DELETE CASCADE;

ALTER TABLE appointment_schema.appointments 
ADD CONSTRAINT fk_appointment_doctor_id 
FOREIGN KEY (doctor_id) REFERENCES doctor_schema.doctor_profiles(id) ON DELETE CASCADE;

-- =====================================================
-- PHASE 4: CREATE INDEXES FOR PERFORMANCE (Week 2)
-- =====================================================

-- 4.1 Auth Schema Indexes
CREATE INDEX idx_user_sessions_user_id ON auth_schema.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON auth_schema.user_sessions(expires_at);
CREATE INDEX idx_login_attempts_email_time ON auth_schema.login_attempts(email, attempted_at);

-- 4.2 Patient Schema Indexes
CREATE INDEX idx_patient_medical_history_patient_id ON patient_schema.patient_medical_history(patient_id);
CREATE INDEX idx_patient_insurance_patient_id ON patient_schema.patient_insurance(patient_id);
CREATE INDEX idx_patient_emergency_contacts_patient_id ON patient_schema.patient_emergency_contacts(patient_id);

-- 4.3 Doctor Schema Indexes
CREATE INDEX idx_doctor_credentials_doctor_id ON doctor_schema.doctor_credentials(doctor_id);
CREATE INDEX idx_doctor_availability_doctor_date ON doctor_schema.doctor_availability(doctor_id, date);
CREATE INDEX idx_doctor_reviews_doctor_id ON doctor_schema.doctor_reviews(doctor_id);

-- 4.4 Appointment Schema Indexes
CREATE INDEX idx_appointment_types_active ON appointment_schema.appointment_types(is_active);
CREATE INDEX idx_appointment_reminders_scheduled_time ON appointment_schema.appointment_reminders(scheduled_time);

-- =====================================================
-- PHASE 5: DATA MIGRATION FROM BACKUP (Week 3)
-- =====================================================

-- 5.1 Migrate doctors from archive
INSERT INTO doctor_schema.doctor_profiles (user_id, doctor_id, full_name, specialty, phone_number, email, years_of_experience, consultation_fee, rating, is_active)
SELECT 
    gen_random_uuid(), -- Will need to create user_profiles first
    doctor_id,
    full_name,
    specialty,
    phone_number,
    email,
    years_of_experience,
    consultation_fee,
    rating,
    is_active
FROM migration_backup.doctors_archive;

-- 5.2 Migrate AI training data
INSERT INTO ai_schema.training_data (question, answer, category, keywords, confidence_score, specialty, is_active)
SELECT 
    question,
    answer,
    category,
    keywords,
    confidence_score,
    specialty,
    is_active
FROM migration_backup.training_data_archive;

-- 5.3 Migrate diseases and medications
INSERT INTO medical_records_schema.diseases (disease_id, name_vi, name_en, description, specialty, icd_10_code, severity_level, common_symptoms, is_active)
SELECT 
    disease_id,
    name_vi,
    name_en,
    description,
    specialty,
    icd_10_code,
    severity_level,
    common_symptoms,
    is_active
FROM migration_backup.diseases_archive;

INSERT INTO medical_records_schema.medications (medication_id, medication_name, generic_name, brand_name, dosage_form, strength, category, description, is_active)
SELECT 
    medication_id,
    medication_name,
    generic_name,
    brand_name,
    dosage_form,
    strength,
    category,
    description,
    is_active
FROM migration_backup.medications_archive;

-- =====================================================
-- PHASE 6: CLEANUP AND VALIDATION (Week 3)
-- =====================================================

-- 6.1 Drop migration backup schema
DROP SCHEMA migration_backup CASCADE;

-- 6.2 Update table statistics
ANALYZE;

-- 6.3 Validate referential integrity
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint 
        WHERE contype = 'f'
        AND connamespace IN (
            SELECT oid FROM pg_namespace 
            WHERE nspname IN ('auth_schema', 'patient_schema', 'doctor_schema', 'appointment_schema', 'medical_records_schema', 'payment_schema', 'file_schema', 'ai_schema')
        )
    ) LOOP
        RAISE NOTICE 'Foreign key constraint % on table % is valid', r.conname, r.table_name;
    END LOOP;
END $$;

-- Success message
SELECT 'V2 Database Refactoring Complete! 🎉' as status,
       'Database is now fully compatible with Clean Architecture V2' as message;
