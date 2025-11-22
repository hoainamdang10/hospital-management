-- Migration 005: Fix refund constraints and payment amount validation
-- Purpose: Allow negative amounts for refund payments
-- Date: 2025-01-11
-- Author: System

-- Drop the old constraint that only allows positive amounts
ALTER TABLE billing_schema.payment_records
DROP CONSTRAINT IF EXISTS valid_amount;

-- Add new constraint that allows both positive (payments) and negative (refunds)
-- We still want to prevent zero amounts
ALTER TABLE billing_schema.payment_records
ADD CONSTRAINT valid_amount CHECK (amount != 0);

-- Add comment for clarity
COMMENT ON CONSTRAINT valid_amount ON billing_schema.payment_records IS 
'Allows positive amounts (payments) and negative amounts (refunds), but prevents zero amounts';

-- Verify the change
DO $$
BEGIN
  RAISE NOTICE 'Migration 005 completed: Refund amounts now allowed';
END $$;

