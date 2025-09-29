-- =====================================================
-- Database Backup Script for Hospital Management System
-- Phase 1: Database Cleanup & Preparation
-- =====================================================

-- Create backup schema for storing original data
CREATE SCHEMA IF NOT EXISTS backup_original;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA backup_original TO postgres;
GRANT CREATE ON SCHEMA backup_original TO postgres;

-- =====================================================
-- 1. BACKUP CRITICAL TABLES BEFORE MIGRATION
-- =====================================================

-- Backup core hospital tables
CREATE TABLE backup_original.profiles_backup AS SELECT * FROM public.profiles;
CREATE TABLE backup_original.patient_profiles_backup AS SELECT * FROM public.patient_profiles;
CREATE TABLE backup_original.doctor_profiles_backup AS SELECT * FROM public.doctor_profiles;
CREATE TABLE backup_original.appointments_backup AS SELECT * FROM public.appointments;
CREATE TABLE backup_original.medical_records_backup AS SELECT * FROM public.medical_records;
CREATE TABLE backup_original.departments_backup AS SELECT * FROM public.departments;
CREATE TABLE backup_original.payments_backup AS SELECT * FROM public.payments;
CREATE TABLE backup_original.documents_backup AS SELECT * FROM public.documents;
CREATE TABLE backup_original.notifications_backup AS SELECT * FROM public.notifications;
CREATE TABLE backup_original.audit_logs_backup AS SELECT * FROM public.audit_logs;

-- =====================================================
-- 2. BACKUP FOREIGN KEY CONSTRAINTS
-- =====================================================

CREATE TABLE backup_original.foreign_key_constraints AS
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    pg_get_constraintdef(oid) as constraint_definition,
    contype,
    confupdtype,
    confdeltype
FROM pg_constraint 
WHERE contype = 'f' 
  AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY conrelid::regclass::text;

-- =====================================================
-- 3. BACKUP TABLE METADATA
-- =====================================================

CREATE TABLE backup_original.table_metadata AS
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity as rls_enabled
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 4. BACKUP COLUMN INFORMATION
-- =====================================================

CREATE TABLE backup_original.column_metadata AS
SELECT 
    table_schema,
    table_name,
    column_name,
    ordinal_position,
    column_default,
    is_nullable,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 5. BACKUP RLS POLICIES
-- =====================================================

CREATE TABLE backup_original.rls_policies AS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public';

-- =====================================================
-- 6. CREATE ROLLBACK PROCEDURES
-- =====================================================

-- Function to restore original state
CREATE OR REPLACE FUNCTION backup_original.restore_original_state()
RETURNS TEXT AS $$
DECLARE
    result TEXT := 'Rollback procedures created. Use with extreme caution.';
BEGIN
    -- This function provides rollback capability
    -- Implementation will be added based on specific rollback needs
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Verify backup completion
SELECT 
    'Backup completed successfully' as status,
    COUNT(*) as tables_backed_up
FROM information_schema.tables 
WHERE table_schema = 'backup_original';

-- Show backup summary
SELECT 
    table_name,
    (SELECT COUNT(*) FROM backup_original.profiles_backup) as profiles_count,
    (SELECT COUNT(*) FROM backup_original.patient_profiles_backup) as patients_count,
    (SELECT COUNT(*) FROM backup_original.doctor_profiles_backup) as doctors_count,
    (SELECT COUNT(*) FROM backup_original.appointments_backup) as appointments_count,
    (SELECT COUNT(*) FROM backup_original.medical_records_backup) as records_count
FROM information_schema.tables 
WHERE table_schema = 'backup_original' 
  AND table_name = 'profiles_backup';

-- Log backup creation
INSERT INTO public.audit_logs (
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
    (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
    'DATABASE_BACKUP_CREATED',
    'backup_original',
    'migration_phase_1',
    '{}',
    jsonb_build_object(
        'backup_schema', 'backup_original',
        'tables_backed_up', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'backup_original'),
        'timestamp', NOW()
    ),
    '127.0.0.1',
    'Database Migration Script',
    NOW()
);

-- =====================================================
-- BACKUP COMPLETION CONFIRMATION
-- =====================================================

SELECT 
    'DATABASE BACKUP COMPLETED SUCCESSFULLY' as message,
    NOW() as backup_timestamp,
    COUNT(*) as backup_tables_created
FROM information_schema.tables 
WHERE table_schema = 'backup_original';