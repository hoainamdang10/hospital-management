-- =====================================================
-- Migration: 007_add_refund_status_columns
-- Description: Add refund status/gateway tracking fields to payment_records
-- Author: Coding Agent
-- Date: 2025-01-23
-- =====================================================

-- 1) Create payment_status enum if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'payment_status' AND n.nspname = 'billing_schema'
  ) THEN
    CREATE TYPE billing_schema.payment_status AS ENUM (
      'pending',
      'completed',
      'failed',
      'refund_pending',
      'refunded'
    );
  END IF;
END $$;

-- 2) Add status & refund metadata columns
ALTER TABLE billing_schema.payment_records
  ADD COLUMN IF NOT EXISTS status billing_schema.payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_by UUID,
  ADD COLUMN IF NOT EXISTS gateway_refund_id VARCHAR(150);

-- 3) Backfill status for existing rows
UPDATE billing_schema.payment_records
SET status = CASE
  WHEN method = 'refund' THEN 'refund_pending'::billing_schema.payment_status
  ELSE 'completed'::billing_schema.payment_status
END
WHERE status = 'pending'::billing_schema.payment_status;

-- 4) Indexes for refund lookup
CREATE INDEX IF NOT EXISTS idx_payment_records_status
  ON billing_schema.payment_records(status);

CREATE INDEX IF NOT EXISTS idx_payment_records_gateway_refund_id
  ON billing_schema.payment_records(gateway_refund_id)
  WHERE gateway_refund_id IS NOT NULL;

-- 5) Comments
COMMENT ON COLUMN billing_schema.payment_records.status IS
  'Payment status including refund lifecycle: pending|completed|failed|refund_pending|refunded';

COMMENT ON COLUMN billing_schema.payment_records.refunded_at IS
  'Timestamp when refund completed (gateway confirmed or manual reconcile)';

COMMENT ON COLUMN billing_schema.payment_records.refund_reason IS
  'Reason for refund';

COMMENT ON COLUMN billing_schema.payment_records.refunded_by IS
  'User who initiated/approved the refund';

COMMENT ON COLUMN billing_schema.payment_records.gateway_refund_id IS
  'Refund identifier returned by payment gateway (VNPAY/PayOS) or manual reconcile tag';

-- 6) Verify migration
DO $$
BEGIN
  PERFORM 1 FROM information_schema.columns
   WHERE table_schema='billing_schema' AND table_name='payment_records' AND column_name='status';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Migration 007 failed: status column missing';
  END IF;

  PERFORM 1 FROM information_schema.columns
   WHERE table_schema='billing_schema' AND table_name='payment_records' AND column_name='refunded_at';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Migration 007 failed: refunded_at column missing';
  END IF;
END $$;
