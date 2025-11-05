-- =====================================================
-- Migration: 016_fix_outbox_reserved_timeout.sql
-- Purpose: Fix stuck RESERVED events and improve outbox pattern
-- Date: 2025-11-03
-- =====================================================

-- =====================================================
-- STEP 1: Release stuck RESERVED events
-- =====================================================

-- Release events that have been RESERVED for more than 5 minutes
-- These are likely from crashed workers or failed processing
UPDATE appointments_schema.outbox_events
SET 
  status = 'PENDING',
  next_retry_at = NOW(),
  updated_at = NOW()
WHERE 
  status = 'RESERVED' 
  AND updated_at < NOW() - INTERVAL '5 minutes';

-- Log the fix
DO $$
DECLARE
  v_released_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_released_count = ROW_COUNT;
  RAISE NOTICE '✅ Released % stuck RESERVED events back to PENDING', v_released_count;
END $$;

-- =====================================================
-- STEP 2: Improve claim_outbox_events function
-- Add timeout mechanism for RESERVED events
-- =====================================================

CREATE OR REPLACE FUNCTION appointments_schema.claim_outbox_events(
  batch_size integer,
  reserved_timeout_minutes integer DEFAULT 5
)
RETURNS SETOF appointments_schema.outbox_events
LANGUAGE sql
AS $$
  -- First, release timed-out RESERVED events back to PENDING
  WITH released AS (
    UPDATE appointments_schema.outbox_events
    SET 
      status = 'PENDING',
      next_retry_at = NOW(),
      updated_at = NOW()
    WHERE 
      status = 'RESERVED'
      AND updated_at < NOW() - (reserved_timeout_minutes || ' minutes')::INTERVAL
    RETURNING id
  ),
  -- Then claim PENDING events
  cte AS (
    SELECT ctid, id
    FROM appointments_schema.outbox_events
    WHERE status = 'PENDING' 
      AND next_retry_at <= NOW()
    ORDER BY created_at
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE appointments_schema.outbox_events t
  SET 
    status = 'RESERVED', 
    updated_at = NOW()
  FROM cte
  WHERE t.ctid = cte.ctid
  RETURNING t.*;
$$;

COMMENT ON FUNCTION appointments_schema.claim_outbox_events IS 
'Claim pending outbox events for processing with automatic timeout recovery.
Automatically releases RESERVED events that have been stuck for more than reserved_timeout_minutes.';

-- =====================================================
-- STEP 3: Add helper function to check outbox health
-- =====================================================

CREATE OR REPLACE FUNCTION appointments_schema.get_outbox_health()
RETURNS TABLE (
  status TEXT,
  count BIGINT,
  oldest_event TIMESTAMP WITH TIME ZONE,
  newest_event TIMESTAMP WITH TIME ZONE,
  avg_age_minutes NUMERIC
)
LANGUAGE sql
AS $$
  SELECT 
    status::TEXT,
    COUNT(*) as count,
    MIN(created_at) as oldest_event,
    MAX(created_at) as newest_event,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/60)::NUMERIC, 2) as avg_age_minutes
  FROM appointments_schema.outbox_events
  GROUP BY status
  ORDER BY status;
$$;

COMMENT ON FUNCTION appointments_schema.get_outbox_health IS 
'Get health metrics for outbox events by status';

-- =====================================================
-- STEP 4: Add cleanup function for old SENT events
-- =====================================================

CREATE OR REPLACE FUNCTION appointments_schema.cleanup_old_outbox_events(
  retention_days integer DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM appointments_schema.outbox_events
  WHERE 
    status = 'SENT'
    AND updated_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Cleaned up % old SENT events (retention: % days)', v_deleted_count, retention_days;
  
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION appointments_schema.cleanup_old_outbox_events IS 
'Delete old SENT events to prevent table bloat. Default retention is 7 days.';

-- =====================================================
-- STEP 5: Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION appointments_schema.claim_outbox_events(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION appointments_schema.get_outbox_health() TO service_role;
GRANT EXECUTE ON FUNCTION appointments_schema.cleanup_old_outbox_events(integer) TO service_role;

-- =====================================================
-- STEP 6: Verify the fix
-- =====================================================

-- Show current outbox health
SELECT * FROM appointments_schema.get_outbox_health();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 016 completed successfully';
  RAISE NOTICE '   - Released stuck RESERVED events';
  RAISE NOTICE '   - Improved claim_outbox_events with timeout recovery';
  RAISE NOTICE '   - Added get_outbox_health() function';
  RAISE NOTICE '   - Added cleanup_old_outbox_events() function';
END $$;

