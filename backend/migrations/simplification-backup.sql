-- ============================================
-- HOSPITAL MANAGEMENT SYSTEM - SIMPLIFICATION BACKUP
-- Created: 2025-01-06
-- Purpose: Backup existing data before simplification
-- ============================================

-- 1. BACKUP EXISTING COMPLEX DATA
-- ============================================

-- Backup Lab Results (will be converted to simple text)
CREATE TABLE IF NOT EXISTS backup_lab_results AS 
SELECT 
    lr.*,
    mr.patient_id,
    mr.doctor_id,
    mr.visit_date,
    CONCAT(
        'Test: ', lr.test_name, 
        ' | Type: ', lr.test_type,
        ' | Result: ', COALESCE(lr.result_value, 'N/A'),
        ' | Range: ', COALESCE(lr.reference_range, 'N/A'),
        ' | Unit: ', COALESCE(lr.unit, ''),
        ' | Status: ', lr.status,
        ' | Date: ', lr.test_date::text,
        CASE WHEN lr.notes IS NOT NULL THEN ' | Notes: ' || lr.notes ELSE '' END
    ) AS simplified_text
FROM lab_results lr
JOIN medical_records mr ON lr.record_id = mr.record_id;

-- Backup Complex Vital Signs (will be simplified)
CREATE TABLE IF NOT EXISTS backup_vital_signs_history AS
SELECT 
    vs.*,
    mr.patient_id,
    mr.doctor_id,
    mr.visit_date,
    CONCAT(
        CASE WHEN vs.temperature IS NOT NULL THEN 'Temp: ' || vs.temperature || '°C ' ELSE '' END,
        CASE WHEN vs.blood_pressure_systolic IS NOT NULL AND vs.blood_pressure_diastolic IS NOT NULL 
             THEN 'BP: ' || vs.blood_pressure_systolic || '/' || vs.blood_pressure_diastolic || ' mmHg ' ELSE '' END,
        CASE WHEN vs.heart_rate IS NOT NULL THEN 'HR: ' || vs.heart_rate || ' bpm ' ELSE '' END,
        CASE WHEN vs.weight IS NOT NULL THEN 'Weight: ' || vs.weight || ' kg ' ELSE '' END,
        CASE WHEN vs.height IS NOT NULL THEN 'Height: ' || vs.height || ' cm ' ELSE '' END,
        CASE WHEN vs.respiratory_rate IS NOT NULL THEN 'RR: ' || vs.respiratory_rate || ' /min ' ELSE '' END,
        CASE WHEN vs.oxygen_saturation IS NOT NULL THEN 'O2Sat: ' || vs.oxygen_saturation || '% ' ELSE '' END,
        CASE WHEN vs.bmi IS NOT NULL THEN 'BMI: ' || vs.bmi ELSE '' END
    ) AS simplified_vitals_text
FROM vital_signs_history vs
JOIN medical_records mr ON vs.record_id = mr.record_id;

-- Backup Complex Medical Terminology
CREATE TABLE IF NOT EXISTS backup_medical_records_complex AS
SELECT 
    record_id,
    patient_id,
    doctor_id,
    chief_complaint,
    present_illness,
    past_medical_history,
    physical_examination,
    treatment_plan,
    follow_up_instructions,
    -- Create simplified versions
    CONCAT(
        COALESCE(chief_complaint, ''),
        CASE WHEN present_illness IS NOT NULL THEN ' | ' || present_illness ELSE '' END
    ) AS simplified_symptoms,
    physical_examination as simplified_examination,
    CONCAT(
        COALESCE(treatment_plan, ''),
        CASE WHEN follow_up_instructions IS NOT NULL THEN ' | Follow-up: ' || follow_up_instructions ELSE '' END
    ) AS simplified_treatment,
    created_at,
    updated_at
FROM medical_records
WHERE chief_complaint IS NOT NULL 
   OR present_illness IS NOT NULL 
   OR past_medical_history IS NOT NULL 
   OR physical_examination IS NOT NULL 
   OR treatment_plan IS NOT NULL 
   OR follow_up_instructions IS NOT NULL;

-- 2. BACKUP PRESCRIPTION COMPLEX DATA
-- ============================================

-- Backup Complex Medication Data
CREATE TABLE IF NOT EXISTS backup_medications_complex AS
SELECT 
    medication_id,
    name,
    generic_name,
    brand_name,
    contraindications,
    side_effects,
    storage_conditions,
    is_controlled_substance,
    -- Create simplified version
    CONCAT(
        name,
        CASE WHEN generic_name IS NOT NULL THEN ' (' || generic_name || ')' ELSE '' END,
        CASE WHEN brand_name IS NOT NULL THEN ' [' || brand_name || ']' ELSE '' END
    ) as simplified_name,
    created_at,
    updated_at
FROM medications
WHERE contraindications IS NOT NULL 
   OR side_effects IS NOT NULL 
   OR storage_conditions IS NOT NULL 
   OR is_controlled_substance = true;

-- Backup Prescription Templates (will be removed)
CREATE TABLE IF NOT EXISTS backup_prescription_templates AS
SELECT * FROM prescription_templates;

-- Backup Medical Record Templates (will be removed)  
CREATE TABLE IF NOT EXISTS backup_medical_record_templates AS
SELECT * FROM medical_record_templates;

-- 3. CREATE DATA MIGRATION MAPPING
-- ============================================

-- Create mapping for lab results to be moved to medical records
CREATE TABLE IF NOT EXISTS lab_results_migration_map AS
SELECT 
    lr.record_id,
    STRING_AGG(
        CONCAT(
            lr.test_name, ': ', 
            COALESCE(lr.result_value, 'Pending'),
            CASE WHEN lr.unit IS NOT NULL THEN ' ' || lr.unit ELSE '' END,
            ' (', lr.test_date::date, ')'
        ), 
        '; ' ORDER BY lr.test_date
    ) as consolidated_lab_results
FROM lab_results lr
GROUP BY lr.record_id;

-- Create mapping for vital signs to be simplified
CREATE TABLE IF NOT EXISTS vital_signs_migration_map AS
SELECT 
    vs.record_id,
    -- Keep only basic vital signs
    AVG(vs.temperature) as avg_temperature,
    CONCAT(
        ROUND(AVG(vs.blood_pressure_systolic)), '/', 
        ROUND(AVG(vs.blood_pressure_diastolic))
    ) as avg_blood_pressure,
    ROUND(AVG(vs.heart_rate)) as avg_heart_rate,
    AVG(vs.weight) as latest_weight,
    AVG(vs.height) as latest_height,
    MAX(vs.recorded_at) as last_recorded
FROM vital_signs_history vs
GROUP BY vs.record_id;

-- 4. VERIFICATION QUERIES
-- ============================================

-- Count records to be migrated
SELECT 
    'lab_results' as table_name, 
    COUNT(*) as record_count,
    COUNT(DISTINCT record_id) as unique_medical_records
FROM lab_results
UNION ALL
SELECT 
    'vital_signs_history' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT record_id) as unique_medical_records  
FROM vital_signs_history
UNION ALL
SELECT 
    'medical_records_with_complex_fields' as table_name,
    COUNT(*) as record_count,
    COUNT(*) as unique_medical_records
FROM medical_records 
WHERE chief_complaint IS NOT NULL 
   OR present_illness IS NOT NULL 
   OR past_medical_history IS NOT NULL;

-- Show sample of what will be simplified
SELECT 
    'Sample Lab Result Simplification' as type,
    lr.test_name as original_field,
    blr.simplified_text as simplified_version
FROM backup_lab_results blr
JOIN lab_results lr ON blr.result_id = lr.result_id
LIMIT 3;

COMMENT ON TABLE backup_lab_results IS 'Backup of lab results before simplification - contains original complex structure';
COMMENT ON TABLE backup_vital_signs_history IS 'Backup of vital signs before simplification - contains all 9 vital sign fields';
COMMENT ON TABLE backup_medical_records_complex IS 'Backup of complex medical terminology before simplification';
COMMENT ON TABLE backup_medications_complex IS 'Backup of complex medication data before simplification';
