-- =====================================================
-- Table Categorization Analysis Script
-- Phase 1: Identify Core vs Non-Essential Tables
-- =====================================================

-- =====================================================
-- 1. CORE HOSPITAL MANAGEMENT TABLES (20 tables)
-- =====================================================

-- Create categorization results table
CREATE TABLE IF NOT EXISTS backup_original.table_categorization (
    table_name TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    target_schema TEXT,
    priority INTEGER,
    reason TEXT,
    row_count BIGINT,
    size_mb NUMERIC,
    has_data BOOLEAN,
    migration_action TEXT
);

-- Clear previous categorization
TRUNCATE backup_original.table_categorization;

-- =====================================================
-- CORE TABLES - Essential for Hospital Management
-- =====================================================

INSERT INTO backup_original.table_categorization VALUES
-- Auth Schema Tables
('profiles', 'CORE', 'auth_schema', 1, 'Central user management table', 0, 0, false, 'MIGRATE'),
('admins', 'CORE', 'auth_schema', 1, 'Admin user management', 0, 0, false, 'MIGRATE'),
('two_factor_auth', 'CORE', 'auth_schema', 2, 'Security authentication', 0, 0, false, 'MIGRATE'),
('two_factor_attempts', 'CORE', 'auth_schema', 2, 'Security audit trail', 0, 0, false, 'MIGRATE'),

-- Patient Schema Tables  
('patient_profiles', 'CORE', 'patient_schema', 1, 'Patient medical information', 0, 0, false, 'MIGRATE'),
('patient_diagnoses', 'CORE', 'patient_schema', 2, 'Patient diagnosis records', 0, 0, false, 'MIGRATE'),
('icd10_codes', 'CORE', 'patient_schema', 3, 'Medical diagnosis codes', 0, 0, false, 'MIGRATE'),

-- Doctor Schema Tables
('doctor_profiles', 'CORE', 'doctor_schema', 1, 'Doctor professional information', 0, 0, false, 'MIGRATE'),
('doctor_work_schedules', 'CORE', 'doctor_schema', 2, 'Doctor availability schedules', 0, 0, false, 'MIGRATE'),
('departments', 'CORE', 'doctor_schema', 1, 'Hospital departments', 0, 0, false, 'MIGRATE'),
('specialties', 'CORE', 'doctor_schema', 2, 'Medical specialties', 0, 0, false, 'MIGRATE'),

-- Appointment Schema Tables
('appointments', 'CORE', 'appointment_schema', 1, 'Core appointment booking', 0, 0, false, 'MIGRATE'),
('appointment_queue', 'CORE', 'appointment_schema', 2, 'Appointment queue management', 0, 0, false, 'MIGRATE'),
('rooms', 'CORE', 'appointment_schema', 2, 'Hospital room management', 0, 0, false, 'MIGRATE'),
('room_types', 'CORE', 'appointment_schema', 3, 'Room type definitions', 0, 0, false, 'MIGRATE'),

-- Medical Records Schema Tables
('medical_records', 'CORE', 'medical_records_schema', 1, 'Patient medical records', 0, 0, false, 'MIGRATE'),
('lab_results', 'CORE', 'medical_records_schema', 2, 'Laboratory test results', 0, 0, false, 'MIGRATE'),
('vital_signs_history', 'CORE', 'medical_records_schema', 2, 'Patient vital signs tracking', 0, 0, false, 'MIGRATE'),

-- Payment Schema Tables
('payments', 'CORE', 'payment_schema', 1, 'Payment transactions', 0, 0, false, 'MIGRATE'),
('payment_methods', 'CORE', 'payment_schema', 2, 'Available payment methods', 0, 0, false, 'MIGRATE'),

-- File Schema Tables
('documents', 'CORE', 'file_schema', 1, 'Document management', 0, 0, false, 'MIGRATE'),
('notifications', 'CORE', 'file_schema', 2, 'System notifications', 0, 0, false, 'MIGRATE'),
('notification_logs', 'CORE', 'file_schema', 2, 'Notification delivery logs', 0, 0, false, 'MIGRATE'),

-- Security & Audit Tables
('audit_logs', 'CORE', 'auth_schema', 2, 'System audit logging', 0, 0, false, 'MIGRATE');

-- =====================================================
-- NON-ESSENTIAL TABLES - To be archived/removed
-- =====================================================

-- Chatbot related tables (40+ tables)
INSERT INTO backup_original.table_categorization 
SELECT 
    table_name,
    'NON_ESSENTIAL',
    'archive_schema',
    9,
    'Chatbot functionality - not needed for graduation thesis',
    0,
    0,
    false,
    'ARCHIVE'
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ~ '^chatbot_';

-- Movie/Entertainment related tables
INSERT INTO backup_original.table_categorization VALUES
('users', 'NON_ESSENTIAL', 'archive_schema', 9, 'Movie app users - not hospital related', 0, 0, false, 'ARCHIVE'),
('comments', 'NON_ESSENTIAL', 'archive_schema', 9, 'Movie comments - not hospital related', 0, 0, false, 'ARCHIVE'),
('comment_reactions', 'NON_ESSENTIAL', 'archive_schema', 9, 'Movie reactions - not hospital related', 0, 0, false, 'ARCHIVE'),
('user_favorites', 'NON_ESSENTIAL', 'archive_schema', 9, 'Movie favorites - not hospital related', 0, 0, false, 'ARCHIVE'),
('payment_history', 'NON_ESSENTIAL', 'archive_schema', 9, 'Movie payment history - not hospital related', 0, 0, false, 'ARCHIVE');

-- Duplicate/Redundant tables
INSERT INTO backup_original.table_categorization VALUES
('doctor_work_schedules_enhanced', 'NON_ESSENTIAL', 'archive_schema', 8, 'Duplicate of doctor_work_schedules', 0, 0, false, 'ARCHIVE'),
('doctor_schedule_templates', 'NON_ESSENTIAL', 'archive_schema', 8, 'Redundant scheduling functionality', 0, 0, false, 'ARCHIVE'),
('doctor_schedule_exceptions', 'NON_ESSENTIAL', 'archive_schema', 8, 'Complex scheduling - simplify for thesis', 0, 0, false, 'ARCHIVE');

-- Over-engineered features for graduation thesis
INSERT INTO backup_original.table_categorization 
SELECT 
    table_name,
    'NON_ESSENTIAL',
    'archive_schema',
    7,
    'Over-engineered feature - simplify for graduation thesis',
    0,
    0,
    false,
    'ARCHIVE'
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'security_threat_rules',
    'security_alerts', 
    'security_test_results',
    'performance_metrics',
    'encryption_keys',
    'data_breach_incidents',
    'medical_record_templates',
    'medical_record_attachments',
    'medications',
    'diagnosis',
    'diseases',
    'symptoms'
  );

-- =====================================================
-- 2. UPDATE ROW COUNTS AND SIZES
-- =====================================================

-- Update row counts for existing tables
DO $$
DECLARE
    rec RECORD;
    row_count BIGINT;
    table_size NUMERIC;
BEGIN
    FOR rec IN 
        SELECT table_name 
        FROM backup_original.table_categorization 
        WHERE migration_action IN ('MIGRATE', 'ARCHIVE')
    LOOP
        BEGIN
            -- Get row count
            EXECUTE format('SELECT COUNT(*) FROM public.%I', rec.table_name) INTO row_count;
            
            -- Get table size in MB
            SELECT 
                ROUND(pg_total_relation_size(format('public.%I', rec.table_name)::regclass) / 1024.0 / 1024.0, 2)
            INTO table_size;
            
            -- Update categorization table
            UPDATE backup_original.table_categorization 
            SET 
                row_count = row_count,
                size_mb = table_size,
                has_data = (row_count > 0)
            WHERE table_name = rec.table_name;
            
        EXCEPTION WHEN OTHERS THEN
            -- Table doesn't exist, mark for cleanup
            UPDATE backup_original.table_categorization 
            SET migration_action = 'SKIP_NOT_EXISTS'
            WHERE table_name = rec.table_name;
        END;
    END LOOP;
END $$;

-- =====================================================
-- 3. CATEGORIZATION SUMMARY REPORT
-- =====================================================

-- Summary by category
SELECT 
    category,
    target_schema,
    COUNT(*) as table_count,
    SUM(row_count) as total_rows,
    ROUND(SUM(size_mb), 2) as total_size_mb,
    COUNT(CASE WHEN has_data THEN 1 END) as tables_with_data
FROM backup_original.table_categorization
GROUP BY category, target_schema
ORDER BY category, target_schema;

-- Core tables summary
SELECT 
    target_schema,
    COUNT(*) as core_tables,
    STRING_AGG(table_name, ', ' ORDER BY priority, table_name) as table_list
FROM backup_original.table_categorization
WHERE category = 'CORE'
GROUP BY target_schema
ORDER BY target_schema;

-- Non-essential tables summary  
SELECT 
    reason,
    COUNT(*) as table_count,
    ROUND(SUM(size_mb), 2) as total_size_mb
FROM backup_original.table_categorization
WHERE category = 'NON_ESSENTIAL'
GROUP BY reason
ORDER BY COUNT(*) DESC;

-- Tables with data that need careful migration
SELECT 
    table_name,
    category,
    target_schema,
    row_count,
    size_mb,
    reason
FROM backup_original.table_categorization
WHERE has_data = true
ORDER BY category, size_mb DESC;

-- =====================================================
-- 4. MIGRATION PRIORITY MATRIX
-- =====================================================

SELECT 
    priority,
    COUNT(*) as table_count,
    STRING_AGG(
        CASE WHEN LENGTH(table_name) > 30 
             THEN LEFT(table_name, 27) || '...'
             ELSE table_name 
        END, 
        ', ' 
        ORDER BY target_schema, table_name
    ) as tables
FROM backup_original.table_categorization
WHERE category = 'CORE'
GROUP BY priority
ORDER BY priority;

-- =====================================================
-- CATEGORIZATION COMPLETION CONFIRMATION
-- =====================================================

SELECT 
    'TABLE CATEGORIZATION COMPLETED' as message,
    COUNT(CASE WHEN category = 'CORE' THEN 1 END) as core_tables,
    COUNT(CASE WHEN category = 'NON_ESSENTIAL' THEN 1 END) as non_essential_tables,
    COUNT(*) as total_analyzed,
    ROUND(
        100.0 * COUNT(CASE WHEN category = 'CORE' THEN 1 END) / COUNT(*), 
        1
    ) as core_percentage
FROM backup_original.table_categorization;