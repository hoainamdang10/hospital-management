/**
 * Migration: Add is_active columns to emergency_contacts and patient_consents
 * 
 * Purpose: Fix schema mismatch between code and database
 * - Add is_active column to emergency_contacts table
 * - Add is_active column to patient_consents table
 * 
 * Author: Hospital Management Team
 * Date: 2025-01-19
 * Version: 2.0.0
 */

-- ============================================================================
-- 1. Add is_active column to emergency_contacts table
-- ============================================================================

-- Add column with default value true
ALTER TABLE patient_schema.emergency_contacts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN patient_schema.emergency_contacts.is_active IS 
'Indicates if the emergency contact is active (soft delete support)';

-- Update existing records to be active
UPDATE patient_schema.emergency_contacts 
SET is_active = true 
WHERE is_active IS NULL;

-- Add NOT NULL constraint after setting default values
ALTER TABLE patient_schema.emergency_contacts 
ALTER COLUMN is_active SET NOT NULL;

-- ============================================================================
-- 2. Add is_active column to patient_consents table
-- ============================================================================

-- Add column with default value true
ALTER TABLE patient_schema.patient_consents 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN patient_schema.patient_consents.is_active IS 
'Indicates if the consent record is active (soft delete support)';

-- Update existing records to be active
UPDATE patient_schema.patient_consents 
SET is_active = true 
WHERE is_active IS NULL;

-- Add NOT NULL constraint after setting default values
ALTER TABLE patient_schema.patient_consents 
ALTER COLUMN is_active SET NOT NULL;

-- ============================================================================
-- 3. Create indexes for performance (optional but recommended)
-- ============================================================================

-- Index for emergency_contacts queries filtering by is_active
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active 
ON patient_schema.emergency_contacts(patient_id, is_active);

-- Index for patient_consents queries filtering by is_active
CREATE INDEX IF NOT EXISTS idx_patient_consents_active 
ON patient_schema.patient_consents(patient_id, is_active);

-- Composite index for common queries (active + primary)
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active_primary 
ON patient_schema.emergency_contacts(patient_id, is_active, is_primary);

-- ============================================================================
-- 4. Verification queries
-- ============================================================================

-- Verify emergency_contacts column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'patient_schema' 
    AND table_name = 'emergency_contacts' 
    AND column_name = 'is_active'
  ) THEN
    RAISE NOTICE 'SUCCESS: is_active column added to emergency_contacts';
  ELSE
    RAISE EXCEPTION 'FAILED: is_active column not found in emergency_contacts';
  END IF;
END $$;

-- Verify patient_consents column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'patient_schema' 
    AND table_name = 'patient_consents' 
    AND column_name = 'is_active'
  ) THEN
    RAISE NOTICE 'SUCCESS: is_active column added to patient_consents';
  ELSE
    RAISE EXCEPTION 'FAILED: is_active column not found in patient_consents';
  END IF;
END $$;

-- ============================================================================
-- 5. Rollback script (for reference)
-- ============================================================================

/*
-- To rollback this migration, run:

-- Drop indexes
DROP INDEX IF EXISTS patient_schema.idx_emergency_contacts_active;
DROP INDEX IF EXISTS patient_schema.idx_patient_consents_active;
DROP INDEX IF EXISTS patient_schema.idx_emergency_contacts_active_primary;

-- Drop columns
ALTER TABLE patient_schema.emergency_contacts DROP COLUMN IF EXISTS is_active;
ALTER TABLE patient_schema.patient_consents DROP COLUMN IF EXISTS is_active;
*/

-- ============================================================================
-- Migration completed successfully
-- ============================================================================

