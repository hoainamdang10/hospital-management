-- Migration: Add payment_deadline column for prepaid model (Flow 3 - Phase 1B)
-- Description: Add payment_deadline column to track payment timeout for online booking
-- Author: Hospital Management Team
-- Date: 2025-01-11
-- Flow: Flow 3 - Online Booking (Prepaid Model)
-- Phase: Phase 1B - Payment Timeout Handling

-- ==================== ADD PAYMENT_DEADLINE COLUMN ====================

-- Add payment_deadline column to appointments table
ALTER TABLE appointments_schema.appointments
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN appointments_schema.appointments.payment_deadline IS 
'Payment deadline for prepaid appointments. Appointments with expired deadlines will be auto-cancelled by cron job (every 5 minutes). Default: 30 minutes from appointment creation.';

-- ==================== ADD INDEX FOR PERFORMANCE ====================

-- Add index for efficient querying of expired unpaid appointments
-- Query pattern: payment_status = 'PENDING' AND payment_deadline < NOW()
CREATE INDEX IF NOT EXISTS idx_appointments_payment_timeout
ON appointments_schema.appointments(payment_status, payment_deadline)
WHERE payment_status = 'PENDING' AND payment_deadline IS NOT NULL;

-- Add comment for index
COMMENT ON INDEX appointments_schema.idx_appointments_payment_timeout IS 
'Index for efficient querying of expired unpaid appointments. Used by ExpireUnpaidAppointmentsUseCase cron job (runs every 5 minutes).';

-- ==================== VERIFICATION ====================

-- Verify column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'appointments_schema'
      AND table_name = 'appointments'
      AND column_name = 'payment_deadline'
  ) THEN
    RAISE NOTICE 'SUCCESS: payment_deadline column added to appointments_schema.appointments';
  ELSE
    RAISE EXCEPTION 'FAILED: payment_deadline column not found in appointments_schema.appointments';
  END IF;
END $$;

-- Verify index exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'appointments_schema'
      AND tablename = 'appointments'
      AND indexname = 'idx_appointments_payment_timeout'
  ) THEN
    RAISE NOTICE 'SUCCESS: idx_appointments_payment_timeout index created';
  ELSE
    RAISE EXCEPTION 'FAILED: idx_appointments_payment_timeout index not found';
  END IF;
END $$;

-- ==================== ROLLBACK SCRIPT (FOR REFERENCE) ====================
-- To rollback this migration, run:
-- DROP INDEX IF EXISTS appointments_schema.idx_appointments_payment_timeout;
-- ALTER TABLE appointments_schema.appointments DROP COLUMN IF EXISTS payment_deadline;

