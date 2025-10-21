-- Migration: Remove consultation_fee from Provider/Staff Service
-- Date: 2025-01-20
-- Reason: Consultation fee is financial data and belongs to Billing Service
-- Bounded Context Violation Fix

BEGIN;

-- Step 1: Create backup table (optional - for data migration to Billing Service)
CREATE TABLE IF NOT EXISTS provider_schema.staff_consultation_fees_backup (
  staff_id UUID PRIMARY KEY,
  consultation_fee NUMERIC(10,2),
  backed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Backup existing consultation fees
INSERT INTO provider_schema.staff_consultation_fees_backup (staff_id, consultation_fee)
SELECT id, consultation_fee
FROM provider_schema.staff_profiles
WHERE consultation_fee IS NOT NULL;

-- Step 3: Drop consultation_fee column
ALTER TABLE provider_schema.staff_profiles
  DROP COLUMN IF EXISTS consultation_fee;

-- Step 4: Add comment explaining the change
COMMENT ON TABLE provider_schema.staff_consultation_fees_backup IS 
'Backup of consultation fees before migration to Billing Service. This data should be migrated to Billing Service and then this table can be dropped.';

COMMIT;

-- Rollback script (if needed):
-- BEGIN;
-- ALTER TABLE provider_schema.staff_profiles
--   ADD COLUMN consultation_fee NUMERIC(10,2);
-- 
-- UPDATE provider_schema.staff_profiles sp
-- SET consultation_fee = b.consultation_fee
-- FROM provider_schema.staff_consultation_fees_backup b
-- WHERE sp.id = b.staff_id;
-- 
-- DROP TABLE provider_schema.staff_consultation_fees_backup;
-- COMMIT;

