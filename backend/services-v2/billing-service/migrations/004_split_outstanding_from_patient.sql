-- =====================================================
-- Migration: 004_split_outstanding_from_patient.sql
-- Description: Separate outstanding amount from patient payment amount
-- Author: Hospital Management Team
-- Date: 2025-12-08
-- =====================================================

SET search_path TO billing_schema;

-- Add new columns to track real outstanding amount (post-payment)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_currency VARCHAR(3) NOT NULL DEFAULT 'VND';

-- Backfill outstanding amount with previous patient_payment_amount values
UPDATE invoices
SET
  outstanding_amount = COALESCE(patient_payment_amount, 0),
  outstanding_currency = COALESCE(patient_payment_currency, 'VND');

-- Recalculate patient payment amount as total - insurance (patient liability)
UPDATE invoices
SET
  patient_payment_amount = GREATEST(
    COALESCE(total_amount, 0) - COALESCE(insurance_coverage_amount, 0),
    0
  );

-- Refresh index for overdue lookup (uses outstanding amount)
DROP INDEX IF EXISTS idx_invoices_outstanding;
CREATE INDEX IF NOT EXISTS idx_invoices_outstanding
  ON invoices(outstanding_amount)
  WHERE outstanding_amount > 0;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004: Outstanding amount column added and data normalized';
END $$;
