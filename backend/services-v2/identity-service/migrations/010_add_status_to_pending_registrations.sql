-- ============================================================================
-- Migration: 010_add_status_to_pending_registrations.sql
-- Description: Add status column to pending_registrations table
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Date: 2025-10-18
-- Compliance: Clean Architecture, DDD, HIPAA
-- ============================================================================

-- Purpose:
-- Add status column to track registration state more precisely
-- This helps prevent orphaned records and improves cleanup logic

-- ============================================================================
-- STEP 1: Add status column
-- ============================================================================

-- Add status column with default value
ALTER TABLE auth_schema.pending_registrations 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING' 
CHECK (status IN ('PENDING', 'EMAIL_SENT', 'VERIFIED', 'FAILED', 'EXPIRED'));

-- Add comment
COMMENT ON COLUMN auth_schema.pending_registrations.status IS 
'Registration status: PENDING (created), EMAIL_SENT (email sent successfully), VERIFIED (user verified), FAILED (email sending failed), EXPIRED (token expired)';

-- ============================================================================
-- STEP 2: Update existing records
-- ============================================================================

-- Set status based on current state
UPDATE auth_schema.pending_registrations
SET status = CASE
  WHEN is_used = TRUE THEN 'VERIFIED'
  WHEN expires_at < NOW() THEN 'EXPIRED'
  ELSE 'EMAIL_SENT'  -- Assume existing records had email sent
END;

-- ============================================================================
-- STEP 3: Update unique constraint
-- ============================================================================

-- Drop old unique constraint
ALTER TABLE auth_schema.pending_registrations
DROP CONSTRAINT IF EXISTS pending_registrations_email_active_unique;

-- Create unique index (replaces unique constraint)
-- Only one active pending registration per email (PENDING or EMAIL_SENT)
-- Note: Cannot use expires_at > NOW() in partial index (NOW() is not immutable)
CREATE UNIQUE INDEX IF NOT EXISTS pending_registrations_email_active_unique 
  ON auth_schema.pending_registrations(email) 
  WHERE (status IN ('PENDING', 'EMAIL_SENT'));

-- ============================================================================
-- STEP 4: Create index for status-based queries
-- ============================================================================

-- Index for finding by status
CREATE INDEX IF NOT EXISTS idx_pending_registrations_status 
  ON auth_schema.pending_registrations(status)
  WHERE status IN ('PENDING', 'EMAIL_SENT');

-- Index for cleanup job (finding failed/expired records)
CREATE INDEX IF NOT EXISTS idx_pending_registrations_cleanup 
  ON auth_schema.pending_registrations(status, created_at)
  WHERE status IN ('FAILED', 'EXPIRED', 'VERIFIED');

-- ============================================================================
-- STEP 5: Update cleanup function
-- ============================================================================

CREATE OR REPLACE FUNCTION auth_schema.cleanup_expired_pending_registrations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired, used, or failed pending registrations
  DELETE FROM auth_schema.pending_registrations
  WHERE status IN ('VERIFIED', 'EXPIRED', 'FAILED')
     OR (status = 'EMAIL_SENT' AND expires_at < NOW());
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup operation
  INSERT INTO auth_schema.audit_logs (
    action,
    resource_type,
    details,
    severity,
    created_at
  ) VALUES (
    'CLEANUP_PENDING_REGISTRATIONS',
    'pending_registration',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'cleanup_time', NOW()
    ),
    'info',
    NOW()
  );
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION auth_schema.cleanup_expired_pending_registrations() IS 
'Enhanced cleanup function to delete expired, verified, or failed pending registrations. 
Should be called periodically (e.g., hourly) by scheduled job.
Returns number of deleted records.';

-- ============================================================================
-- STEP 6: Create function to mark as failed
-- ============================================================================

CREATE OR REPLACE FUNCTION auth_schema.mark_pending_registration_failed(
  p_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth_schema.pending_registrations
  SET status = 'FAILED'
  WHERE id = p_id;

  -- Log audit event
  INSERT INTO auth_schema.audit_logs (
    action,
    resource_type,
    resource_id,
    details,
    severity,
    created_at
  ) VALUES (
    'PENDING_REGISTRATION_MARKED_FAILED',
    'pending_registration',
    p_id::text,
    jsonb_build_object(
      'marked_at', NOW()
    ),
    'warning',
    NOW()
  );
END;
$$;

COMMENT ON FUNCTION auth_schema.mark_pending_registration_failed(UUID) IS 
'Mark a pending registration as failed (e.g., when email sending fails).
This allows cleanup job to remove it later.';

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

-- Grant execute permission on new function
GRANT EXECUTE ON FUNCTION auth_schema.mark_pending_registration_failed(UUID) TO service_role;

-- ============================================================================
-- STEP 8: Verification queries
-- ============================================================================

-- Verify column added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth_schema' 
    AND table_name = 'pending_registrations'
    AND column_name = 'status'
  ) THEN
    RAISE NOTICE '✅ Column status added successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to add column status';
  END IF;
END $$;

-- Verify unique constraint updated
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE table_schema = 'auth_schema'
  AND table_name = 'pending_registrations'
  AND constraint_name = 'pending_registrations_email_active_unique';
  
  IF constraint_count = 1 THEN
    RAISE NOTICE '✅ Unique constraint updated successfully';
  ELSE
    RAISE WARNING '⚠️  Unique constraint not found or duplicated';
  END IF;
END $$;

-- Verify indexes created
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'auth_schema'
  AND tablename = 'pending_registrations'
  AND indexname LIKE 'idx_pending_registrations_%';
  
  IF index_count >= 6 THEN
    RAISE NOTICE '✅ Indexes created successfully (count: %)', index_count;
  ELSE
    RAISE WARNING '⚠️  Expected at least 6 indexes, found: %', index_count;
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (for reference)
-- ============================================================================

-- To rollback this migration, run:
-- DROP FUNCTION IF EXISTS auth_schema.mark_pending_registration_failed(UUID);
-- DROP INDEX IF EXISTS auth_schema.idx_pending_registrations_status;
-- DROP INDEX IF EXISTS auth_schema.idx_pending_registrations_cleanup;
-- ALTER TABLE auth_schema.pending_registrations DROP CONSTRAINT IF EXISTS pending_registrations_email_active_unique;
-- ALTER TABLE auth_schema.pending_registrations DROP COLUMN IF EXISTS status;
-- -- Restore old unique constraint
-- ALTER TABLE auth_schema.pending_registrations
-- ADD CONSTRAINT pending_registrations_email_active_unique 
--   UNIQUE (email) 
--   WHERE (is_used = FALSE AND expires_at > NOW());

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
