-- =====================================================
-- Phase 2: Soft Reference Migration Script
-- Replace FK constraints with soft references and validation functions
-- =====================================================

-- =====================================================
-- 1. CREATE VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate user exists in profiles table
CREATE OR REPLACE FUNCTION validate_user_exists(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid AND is_active = true);
END;
$$ LANGUAGE plpgsql;

-- Function to validate patient exists
CREATE OR REPLACE FUNCTION validate_patient_exists(patient_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.patient_profiles 
        WHERE user_id = patient_uuid 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate doctor exists
CREATE OR REPLACE FUNCTION validate_doctor_exists(doctor_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.doctor_profiles 
        WHERE user_id = doctor_uuid 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate department exists
CREATE OR REPLACE FUNCTION validate_department_exists(dept_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.departments 
        WHERE id = dept_uuid 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate appointment exists
CREATE OR REPLACE FUNCTION validate_appointment_exists(appointment_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE id = appointment_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. CREATE SOFT REFERENCE VALIDATION TRIGGERS
-- =====================================================

-- Trigger function for appointments table validation
CREATE OR REPLACE FUNCTION validate_appointment_references()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate patient exists
    IF NEW.patient_id IS NOT NULL AND NOT validate_patient_exists(NEW.patient_id) THEN
        RAISE EXCEPTION 'Invalid patient_id: Patient % does not exist or is inactive', NEW.patient_id;
    END IF;
    
    -- Validate doctor exists
    IF NEW.doctor_id IS NOT NULL AND NOT validate_doctor_exists(NEW.doctor_id) THEN
        RAISE EXCEPTION 'Invalid doctor_id: Doctor % does not exist or is inactive', NEW.doctor_id;
    END IF;
    
    -- Validate department exists
    IF NEW.department_id IS NOT NULL AND NOT validate_department_exists(NEW.department_id) THEN
        RAISE EXCEPTION 'Invalid department_id: Department % does not exist or is inactive', NEW.department_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for medical records validation
CREATE OR REPLACE FUNCTION validate_medical_record_references()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate patient exists
    IF NEW.patient_id IS NOT NULL AND NOT validate_patient_exists(NEW.patient_id) THEN
        RAISE EXCEPTION 'Invalid patient_id: Patient % does not exist or is inactive', NEW.patient_id;
    END IF;
    
    -- Validate doctor exists
    IF NEW.doctor_id IS NOT NULL AND NOT validate_doctor_exists(NEW.doctor_id) THEN
        RAISE EXCEPTION 'Invalid doctor_id: Doctor % does not exist or is inactive', NEW.doctor_id;
    END IF;
    
    -- Validate appointment exists (optional)
    IF NEW.appointment_id IS NOT NULL AND NOT validate_appointment_exists(NEW.appointment_id) THEN
        RAISE EXCEPTION 'Invalid appointment_id: Appointment % does not exist', NEW.appointment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. BACKUP EXISTING FK CONSTRAINTS BEFORE REMOVAL
-- =====================================================

-- Create detailed backup of FK constraints for core tables
CREATE TABLE IF NOT EXISTS backup_original.core_fk_constraints AS
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    pg_get_constraintdef(oid) as constraint_definition,
    contype,
    confupdtype,
    confdeltype,
    NOW() as backup_timestamp
FROM pg_constraint 
WHERE contype = 'f' 
  AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (
    conrelid::regclass::text IN (
      'profiles', 'patient_profiles', 'doctor_profiles', 'appointments', 
      'medical_records', 'departments', 'payments', 'documents', 
      'notifications', 'audit_logs'
    )
    OR confrelid::regclass::text IN (
      'profiles', 'patient_profiles', 'doctor_profiles', 'appointments', 
      'medical_records', 'departments', 'payments', 'documents', 
      'notifications', 'audit_logs'
    )
  )
ORDER BY conrelid::regclass::text;

-- =====================================================
-- 4. SYSTEMATIC FK CONSTRAINT REMOVAL
-- =====================================================

-- Remove FK constraints from appointments table
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE contype = 'f' 
          AND conrelid = 'public.appointments'::regclass
    LOOP
        EXECUTE format('ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
        RAISE NOTICE 'Dropped FK constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- Remove FK constraints from medical_records table
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE contype = 'f' 
          AND conrelid = 'public.medical_records'::regclass
    LOOP
        EXECUTE format('ALTER TABLE public.medical_records DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
        RAISE NOTICE 'Dropped FK constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- Remove FK constraints from patient_profiles table
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE contype = 'f' 
          AND conrelid = 'public.patient_profiles'::regclass
    LOOP
        EXECUTE format('ALTER TABLE public.patient_profiles DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
        RAISE NOTICE 'Dropped FK constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- Remove FK constraints from doctor_profiles table
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE contype = 'f' 
          AND conrelid = 'public.doctor_profiles'::regclass
    LOOP
        EXECUTE format('ALTER TABLE public.doctor_profiles DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
        RAISE NOTICE 'Dropped FK constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- =====================================================
-- 5. APPLY SOFT REFERENCE VALIDATION TRIGGERS
-- =====================================================

-- Apply validation trigger to appointments table
DROP TRIGGER IF EXISTS trg_validate_appointment_references ON public.appointments;
CREATE TRIGGER trg_validate_appointment_references
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION validate_appointment_references();

-- Apply validation trigger to medical_records table
DROP TRIGGER IF EXISTS trg_validate_medical_record_references ON public.medical_records;
CREATE TRIGGER trg_validate_medical_record_references
    BEFORE INSERT OR UPDATE ON public.medical_records
    FOR EACH ROW
    EXECUTE FUNCTION validate_medical_record_references();

-- =====================================================
-- 6. CREATE DENORMALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- Denormalized appointment view with patient and doctor info
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
FROM public.appointments a
LEFT JOIN public.patient_profiles pp ON a.patient_id = pp.user_id
LEFT JOIN public.profiles p_patient ON pp.user_id = p_patient.id
LEFT JOIN public.doctor_profiles dp ON a.doctor_id = dp.user_id  
LEFT JOIN public.profiles p_doctor ON dp.user_id = p_doctor.id
LEFT JOIN public.departments d ON a.department_id = d.id;

-- Denormalized medical records view
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
FROM public.medical_records mr
LEFT JOIN public.patient_profiles pp ON mr.patient_id = pp.user_id
LEFT JOIN public.profiles p_patient ON pp.user_id = p_patient.id
LEFT JOIN public.doctor_profiles dp ON mr.doctor_id = dp.user_id
LEFT JOIN public.profiles p_doctor ON dp.user_id = p_doctor.id
LEFT JOIN public.appointments a ON mr.appointment_id = a.id;

-- =====================================================
-- 7. VALIDATION AND TESTING
-- =====================================================

-- Test soft reference validation
DO $$
DECLARE
    test_result TEXT;
BEGIN
    -- Test validation functions
    IF validate_user_exists('00000000-0000-0000-0000-000000000000') THEN
        test_result := 'FAIL: Should not validate non-existent user';
    ELSE
        test_result := 'PASS: Correctly rejected non-existent user';
    END IF;
    
    RAISE NOTICE 'Validation test: %', test_result;
END $$;

-- Verify FK constraints removal
SELECT 
    'FK Constraints Remaining' as check_type,
    COUNT(*) as count,
    STRING_AGG(conname, ', ') as constraint_names
FROM pg_constraint 
WHERE contype = 'f' 
  AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND conrelid::regclass::text IN (
    'appointments', 'medical_records', 'patient_profiles', 'doctor_profiles'
  );

-- Verify triggers created
SELECT 
    'Validation Triggers' as check_type,
    COUNT(*) as count,
    STRING_AGG(trigger_name, ', ') as trigger_names
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND trigger_name LIKE 'trg_validate_%';

-- =====================================================
-- SOFT REFERENCE MIGRATION COMPLETION
-- =====================================================

-- Log migration completion
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
    'SOFT_REFERENCE_MIGRATION_COMPLETED',
    'database_migration',
    'phase_2',
    '{}',
    jsonb_build_object(
        'fk_constraints_removed', (SELECT COUNT(*) FROM backup_original.core_fk_constraints),
        'validation_functions_created', 5,
        'validation_triggers_created', 2,
        'denormalized_views_created', 2,
        'timestamp', NOW()
    ),
    '127.0.0.1',
    'Database Migration Script Phase 2',
    NOW()
);

SELECT 
    'SOFT REFERENCE MIGRATION COMPLETED SUCCESSFULLY' as message,
    NOW() as completion_timestamp,
    'Phase 2 of 4 completed' as progress;