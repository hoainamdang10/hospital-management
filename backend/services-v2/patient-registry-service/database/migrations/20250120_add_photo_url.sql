-- Migration: Add photo_url column to patients table
-- Date: 2025-01-20
-- Description: Add FHIR-compliant photo field to store patient photo URL
-- Compliance: FHIR R6 Patient Resource (photo field)

-- Add photo_url column
ALTER TABLE patient_schema.patients
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment
COMMENT ON COLUMN patient_schema.patients.photo_url IS 'Patient photo URL from Supabase Storage (FHIR: photo field)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_photo_url ON patient_schema.patients(photo_url) WHERE photo_url IS NOT NULL;

-- Rollback script (if needed):
-- ALTER TABLE patient_schema.patients DROP COLUMN IF EXISTS photo_url;
-- DROP INDEX IF EXISTS patient_schema.idx_patients_photo_url;

