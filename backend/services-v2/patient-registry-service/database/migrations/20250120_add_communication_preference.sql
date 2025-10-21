-- Migration: Add communication_preference column to patients table
-- Date: 2025-01-20
-- Description: Add FHIR-compliant communication field to store patient communication preferences
-- Compliance: FHIR R6 Patient Resource (communication field)

-- Add communication_preference column (JSONB)
ALTER TABLE patient_schema.patients
ADD COLUMN IF NOT EXISTS communication_preference JSONB;

-- Add comment
COMMENT ON COLUMN patient_schema.patients.communication_preference IS 'Patient communication preferences (FHIR: communication field) - language, preferred, contactMethod, timezone';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_communication_preference ON patient_schema.patients USING GIN (communication_preference);

-- Rollback script (if needed):
-- ALTER TABLE patient_schema.patients DROP COLUMN IF EXISTS communication_preference;
-- DROP INDEX IF EXISTS patient_schema.idx_patients_communication_preference;

