-- =====================================================
-- Migration: 004_add_vnpay_refund_fields
-- Description: Add VNPAY-specific fields to payment_records for refund support
-- Author: Hospital Management Team
-- Date: 2025-01-22
-- =====================================================

-- Add VNPAY transaction fields to payment_records table
-- These fields are required for VNPAY refund API calls
ALTER TABLE billing_schema.payment_records
ADD COLUMN IF NOT EXISTS vnpay_txn_ref VARCHAR(100),
ADD COLUMN IF NOT EXISTS vnpay_transaction_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS vnpay_pay_date TIMESTAMPTZ;

-- Add index for faster refund lookups by VNPAY transaction reference
CREATE INDEX IF NOT EXISTS idx_payment_records_vnpay_txn_ref 
ON billing_schema.payment_records(vnpay_txn_ref) 
WHERE vnpay_txn_ref IS NOT NULL;

-- Add index for VNPAY transaction number
CREATE INDEX IF NOT EXISTS idx_payment_records_vnpay_transaction_no 
ON billing_schema.payment_records(vnpay_transaction_no) 
WHERE vnpay_transaction_no IS NOT NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN billing_schema.payment_records.vnpay_txn_ref IS 
'VNPAY transaction reference (vnp_TxnRef) - Required for refund API calls';

COMMENT ON COLUMN billing_schema.payment_records.vnpay_transaction_no IS 
'VNPAY transaction number (vnp_TransactionNo) from payment response - Required for refund API calls';

COMMENT ON COLUMN billing_schema.payment_records.vnpay_pay_date IS 
'VNPAY payment date (vnp_PayDate) in format yyyyMMddHHmmss - Required for refund API calls';

-- Verify migration
DO $$
BEGIN
  -- Check if columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'billing_schema' 
      AND table_name = 'payment_records' 
      AND column_name = 'vnpay_txn_ref'
  ) THEN
    RAISE EXCEPTION 'Migration failed: vnpay_txn_ref column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'billing_schema' 
      AND table_name = 'payment_records' 
      AND column_name = 'vnpay_transaction_no'
  ) THEN
    RAISE EXCEPTION 'Migration failed: vnpay_transaction_no column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'billing_schema' 
      AND table_name = 'payment_records' 
      AND column_name = 'vnpay_pay_date'
  ) THEN
    RAISE EXCEPTION 'Migration failed: vnpay_pay_date column not created';
  END IF;

  RAISE NOTICE 'Migration 004_add_vnpay_refund_fields completed successfully';
END $$;

