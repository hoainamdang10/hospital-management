-- Migration 006: Add 'refund' to payment_method enum
-- Purpose: Allow refund payment method for refund transactions
-- Date: 2025-01-11
-- Author: System

-- Add 'refund' value to payment_method enum
ALTER TYPE billing_schema.payment_method ADD VALUE IF NOT EXISTS 'refund';

-- Verify the change
DO $$
BEGIN
  RAISE NOTICE 'Migration 006 completed: refund payment method added';
END $$;

