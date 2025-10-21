-- =====================================================
-- Migration: Add UNIQUE Constraint to Prevent Duplicate Runs
-- Version: 1.0.1
-- Date: 2025-10-21
-- Description: Add UNIQUE constraint on (schedule_id, due_at_utc) to prevent
--              race conditions when multiple MaterializerWorkers run concurrently
-- =====================================================

-- Purpose:
-- 1. Prevent duplicate runs when two MaterializerWorkers materialize the same schedule
-- 2. Prevent duplicate runs during backfill operations
-- 3. Handle DST (Daylight Saving Time) edge cases
-- 4. Ensure database-level deduplication (application-level is not enough)

-- Add UNIQUE constraint
ALTER TABLE scheduler.schedule_runs
  ADD CONSTRAINT uq_runs_per_schedule_due 
  UNIQUE (schedule_id, due_at_utc);

-- Add comment for documentation
COMMENT ON CONSTRAINT uq_runs_per_schedule_due ON scheduler.schedule_runs IS 
'Prevents duplicate runs for the same schedule at the same due time. 
Protects against race conditions during materialization and backfill operations.';

-- Verify constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_runs_per_schedule_due' 
    AND conrelid = 'scheduler.schedule_runs'::regclass
  ) THEN
    RAISE NOTICE 'SUCCESS: UNIQUE constraint uq_runs_per_schedule_due added successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: UNIQUE constraint uq_runs_per_schedule_due was not created';
  END IF;
END $$;

