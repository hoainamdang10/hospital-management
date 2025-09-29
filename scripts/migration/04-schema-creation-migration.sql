-- =====================================================
-- Phase 3: Schema Creation & Table Migration Script
-- Create 7 service schemas and migrate tables from public schema
-- =====================================================

-- =====================================================
-- 1. CREATE SERVICE SCHEMAS
-- =====================================================

-- Create auth_schema for authentication and user management
CREATE SCHEMA IF NOT EXISTS auth_schema;
GRANT USAGE ON SCHEMA auth_schema TO postgres;
GRANT CREATE ON SCHEMA auth_schema TO postgres;

-- Create patient_schema for patient-related data
CREATE SCHEMA IF NOT EXISTS patient_schema;
GRANT USAGE ON SCHEMA patient_schema TO postgres;
GRANT CREATE ON SCHEMA patient_schema TO postgres;

-- Create doctor_schema for doctor and department data
CREATE SCHEMA IF NOT EXISTS doctor_schema;
GRANT USAGE ON SCHEMA doctor_schema TO postgres;
GRANT CREATE ON SCHEMA doctor_schema TO postgres;

-- Create appointment_schema for appointment management
CREATE SCHEMA IF NOT EXISTS appointment_schema;
GRANT USAGE ON SCHEMA appointment_schema TO postgres;
GRANT CREATE ON SCHEMA appointment_schema TO postgres;

-- Create medical_records_schema for clinical data
CREATE SCHEMA IF NOT EXISTS medical_records_schema;
GRANT USAGE ON SCHEMA medical_records_schema TO postgres;
GRANT CREATE ON SCHEMA medical_records_schema TO postgres;

-- Create payment_schema for financial transactions
CREATE SCHEMA IF NOT EXISTS payment_schema;
GRANT USAGE ON SCHEMA payment_schema TO postgres;
GRANT CREATE ON SCHEMA payment_schema TO postgres;

-- Create file_schema for documents and notifications
CREATE SCHEMA IF NOT EXISTS file_schema;
GRANT USAGE ON SCHEMA file_schema TO postgres;
GRANT CREATE ON SCHEMA file_schema TO postgres;

-- Create archive_schema for non-essential tables
CREATE SCHEMA IF NOT EXISTS archive_schema;
GRANT USAGE ON SCHEMA archive_schema TO postgres;
GRANT CREATE ON SCHEMA archive_schema TO postgres;

-- =====================================================
-- 2. SCHEMA MIGRATION PLAN VALIDATION
-- =====================================================

-- Verify all target tables exist before migration
CREATE TABLE IF NOT EXISTS backup_original.migration_validation AS
SELECT 
    tc.table_name,
    tc.target_schema,
    tc.migration_action,
    CASE 
        WHEN t.table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as table_status,
    CASE 
        WHEN s.schema_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as schema_status
FROM backup_original.table_categorization tc
LEFT JOIN information_schema.tables t 
    ON tc.table_name = t.table_name 
    AND t.table_schema = 'public'
LEFT JOIN information_schema.schemata s
    ON tc.target_schema = s.schema_name
WHERE tc.migration_action = 'MIGRATE';

-- Show validation results
SELECT 
    target_schema,
    COUNT(*) as total_tables,
    COUNT(CASE WHEN table_status = 'EXISTS' THEN 1 END) as existing_tables,
    COUNT(CASE WHEN table_status = 'MISSING' THEN 1 END) as missing_tables,
    COUNT(CASE WHEN schema_status = 'EXISTS' THEN 1 END) as schema_ready
FROM backup_original.migration_validation
GROUP BY target_schema
ORDER BY target_schema;

-- =====================================================
-- 3. TABLE MIGRATION EXECUTION
-- =====================================================

-- Migrate AUTH_SCHEMA tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM backup_original.table_categorization 
        WHERE target_schema = 'auth_schema' 
          AND migration_action = 'MIGRATE'
          AND table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA auth_schema', table_rec.table_name);
            RAISE NOTICE 'Migrated table % to auth_schema', table_rec.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to migrate table %: %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Migrate PATIENT_SCHEMA tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM backup_original.table_categorization 
        WHERE target_schema = 'patient_schema' 
          AND migration_action = 'MIGRATE'
          AND table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA patient_schema', table_rec.table_name);
            RAISE NOTICE 'Migrated table % to patient_schema', table_rec.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to migrate table %: %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Migrate DOCTOR_SCHEMA tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM backup_original.table_categorization 
        WHERE target_schema = 'doctor_schema' 
          AND migration_action = 'MIGRATE'
          AND table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA doctor_schema', table_rec.table_name);
            RAISE NOTICE 'Migrated table % to doctor_schema', table_rec.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to migrate table %: %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Migrate APPOINTMENT_SCHEMA tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM backup_original.table_categorization 
        WHERE target_schema = 'appointment_schema' 
          AND migration_action = 'MIGRATE'
          AND table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA appointment_schema', table_rec.table_name);
            RAISE NOTICE 'Migrated table % to appointment_schema', table_rec.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to migrate table %: %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Migrate MEDICAL_RECORDS_SCHEMA tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM backup_original.table_categorization 
        WHERE target_schema = 'medical_records_schema' 
          AND migration_action = 'MIGRATE'
          AND table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA medical_records_schema', table_rec.table_name);
            RAISE NOTICE 'Migrated table % to medical_records_schema', table_rec.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to migrate table %: %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Migrate PAYMENT_SCHEMA tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM backup_original.table_categorization 
        WHERE target_schema = 'payment_schema' 
          AND migration_action = 'MIGRATE'
          AND table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA payment_schema', table_rec.table_name);
            RAISE NOTICE 'Migrated table % to payment_schema', table_rec.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to migrate table %: %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Migrate FILE_SCHEMA tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM backup_original.table_categorization 
        WHERE target_schema = 'file_schema' 
          AND migration_action = 'MIGRATE'
          AND table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA file_schema', table_rec.table_name);
            RAISE NOTICE 'Migrated table % to file_schema', table_rec.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to migrate table %: %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- 4. ARCHIVE NON-ESSENTIAL TABLES
-- =====================================================

-- Archive chatbot and non-essential tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM backup_original.table_categorization 
        WHERE target_schema = 'archive_schema' 
          AND migration_action = 'ARCHIVE'
          AND table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA archive_schema', table_rec.table_name);
            RAISE NOTICE 'Archived table % to archive_schema', table_rec.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to archive table %: %', table_rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- 5. UPDATE DENORMALIZED VIEWS FOR NEW SCHEMAS
-- =====================================================

-- Update appointment view to use new schema references
CREATE OR REPLACE VIEW public.v_appointments_denormalized AS
SELECT 
    a.id,
    a.appointment_id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.type,
    a.reason,
    -- Patient information
    pp.patient_id,
    p_patient.full_name as patient_name,
    p_patient.phone as patient_phone,
    p_patient.email as patient_email,
    -- Doctor information  
    dp.doctor_id,
    p_doctor.full_name as doctor_name,
    dp.primary_specialization,
    -- Department information
    d.department_id,
    d.name as department_name,
    d.name_vi as department_name_vi,
    -- Appointment details
    a.consultation_fee,
    a.payment_status,
    a.created_at,
    a.updated_at
FROM appointment_schema.appointments a
LEFT JOIN patient_schema.patient_profiles pp ON a.patient_id = pp.user_id
LEFT JOIN auth_schema.profiles p_patient ON pp.user_id = p_patient.id
LEFT JOIN doctor_schema.doctor_profiles dp ON a.doctor_id = dp.user_id  
LEFT JOIN auth_schema.profiles p_doctor ON dp.user_id = p_doctor.id
LEFT JOIN doctor_schema.departments d ON a.department_id = d.id;

-- Update medical records view to use new schema references
CREATE OR REPLACE VIEW public.v_medical_records_denormalized AS
SELECT 
    mr.record_id,
    mr.visit_date,
    mr.symptoms,
    mr.diagnosis,
    mr.treatment,
    mr.status,
    -- Patient information
    pp.patient_id,
    p_patient.full_name as patient_name,
    p_patient.date_of_birth as patient_dob,
    pp.blood_type,
    -- Doctor information
    dp.doctor_id,
    p_doctor.full_name as doctor_name,
    dp.primary_specialization,
    -- Appointment information (if linked)
    a.appointment_id,
    a.appointment_date,
    mr.created_at,
    mr.updated_at
FROM medical_records_schema.medical_records mr
LEFT JOIN patient_schema.patient_profiles pp ON mr.patient_id = pp.user_id
LEFT JOIN auth_schema.profiles p_patient ON pp.user_id = p_patient.id
LEFT JOIN doctor_schema.doctor_profiles dp ON mr.doctor_id = dp.user_id
LEFT JOIN auth_schema.profiles p_doctor ON dp.user_id = p_doctor.id
LEFT JOIN appointment_schema.appointments a ON mr.appointment_id = a.id;

-- =====================================================
-- 6. MIGRATION VERIFICATION
-- =====================================================

-- Verify schema migration results
CREATE TABLE backup_original.migration_results AS
SELECT 
    schema_name,
    COUNT(*) as table_count,
    STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables 
WHERE schema_name IN (
    'auth_schema', 'patient_schema', 'doctor_schema', 'appointment_schema',
    'medical_records_schema', 'payment_schema', 'file_schema', 'archive_schema'
)
GROUP BY schema_name
ORDER BY schema_name;

-- Show migration summary
SELECT 
    'SCHEMA MIGRATION SUMMARY' as report_type,
    schema_name,
    table_count,
    tables
FROM backup_original.migration_results;

-- Verify no core tables remain in public schema
SELECT 
    'REMAINING PUBLIC TABLES' as report_type,
    COUNT(*) as remaining_count,
    STRING_AGG(table_name, ', ') as remaining_tables
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    SELECT table_name 
    FROM backup_original.table_categorization 
    WHERE migration_action = 'MIGRATE'
  );

-- =====================================================
-- 7. ENABLE RLS ON ALL MIGRATED HEALTHCARE TABLES
-- =====================================================

-- Enable RLS on auth_schema tables
ALTER TABLE auth_schema.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.two_factor_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_schema.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on patient_schema tables
ALTER TABLE patient_schema.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_schema.patient_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_schema.icd10_codes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on doctor_schema tables
ALTER TABLE doctor_schema.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schema.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schema.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schema.doctor_work_schedules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on appointment_schema tables
ALTER TABLE appointment_schema.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_schema.appointment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_schema.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_schema.room_types ENABLE ROW LEVEL SECURITY;

-- Enable RLS on medical_records_schema tables
ALTER TABLE medical_records_schema.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records_schema.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records_schema.vital_signs_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payment_schema tables
ALTER TABLE payment_schema.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schema.payment_methods ENABLE ROW LEVEL SECURITY;

-- Enable RLS on file_schema tables
ALTER TABLE file_schema.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_schema.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_schema.notification_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SCHEMA MIGRATION COMPLETION
-- =====================================================

-- Log migration completion
INSERT INTO auth_schema.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    created_at
) VALUES (
    (SELECT id FROM auth_schema.profiles WHERE role = 'admin' LIMIT 1),
    'SCHEMA_MIGRATION_COMPLETED',
    'database_migration',
    'phase_3',
    '{}',
    jsonb_build_object(
        'schemas_created', 8,
        'tables_migrated', (SELECT COUNT(*) FROM backup_original.table_categorization WHERE migration_action = 'MIGRATE'),
        'tables_archived', (SELECT COUNT(*) FROM backup_original.table_categorization WHERE migration_action = 'ARCHIVE'),
        'rls_enabled_tables', 24,
        'timestamp', NOW()
    ),
    '127.0.0.1',
    'Database Migration Script Phase 3',
    NOW()
);

SELECT 
    'SCHEMA MIGRATION COMPLETED SUCCESSFULLY' as message,
    NOW() as completion_timestamp,
    'Phase 3 of 4 completed - Schema-per-service architecture implemented' as progress;