-- =====================================================================================
-- Fix ID column types to support UUID strings (36 chars)
-- =====================================================================================
-- Purpose: Fix schema to support UUID-based IDs from other services:
--   - doctor_id/patient_id: UUID from identity-service (36 chars)
--   - department_id: Business code OR UUID (50 chars for flexibility)
-- =====================================================================================

-- Fix appointments table
ALTER TABLE appointments_schema.appointments 
  ALTER COLUMN department_id TYPE VARCHAR(50),
  ALTER COLUMN doctor_id TYPE VARCHAR(50),
  ALTER COLUMN patient_id TYPE VARCHAR(50);

-- Fix appointment_read_model table
ALTER TABLE appointments_schema.appointment_read_model
  ALTER COLUMN doctor_id TYPE VARCHAR(50),
  ALTER COLUMN patient_id TYPE VARCHAR(50);

-- Drop format constraints (allow UUID from identity-service)
ALTER TABLE appointments_schema.appointments 
  DROP CONSTRAINT IF EXISTS chk_doctor_id_format,
  DROP CONSTRAINT IF EXISTS chk_patient_id_format;

-- Add comments
COMMENT ON COLUMN appointments_schema.appointments.department_id IS 'Department code (e.g., GEN) or UUID - references provider-service';
COMMENT ON COLUMN appointments_schema.appointments.doctor_id IS 'Doctor UUID from identity-service';
COMMENT ON COLUMN appointments_schema.appointments.patient_id IS 'Patient UUID from identity-service';
