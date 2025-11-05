-- =====================================================
-- Migration: 002_complete_outbox_functions.sql
-- Description: Complete Outbox Pattern with missing database functions
-- Author: Hospital Management Team
-- Date: 2025-11-03
-- Compliance: Transactional Outbox Pattern, Distributed Locking
-- =====================================================

-- Use billing_schema for all billing-related tables
SET search_path TO billing_schema;

-- =====================================================
-- TABLE: outbox_locks
-- Purpose: Distributed lock for coordinating multiple worker instances
-- =====================================================

CREATE TABLE IF NOT EXISTS outbox_locks (
  worker_id VARCHAR(255) PRIMARY KEY,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup of expired locks
CREATE INDEX IF NOT EXISTS idx_outbox_locks_expires_at 
ON outbox_locks(expires_at);

COMMENT ON TABLE outbox_locks IS 'Distributed lock table for outbox worker coordination';

-- =====================================================
-- FUNCTION: acquire_outbox_lock
-- Purpose: Acquire distributed lock for outbox processing
-- =====================================================

CREATE OR REPLACE FUNCTION billing_schema.acquire_outbox_lock(
  p_worker_id VARCHAR,
  p_lock_timeout_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_expires_at TIMESTAMPTZ := v_now + (p_lock_timeout_seconds || ' seconds')::INTERVAL;
BEGIN
  -- Clean expired locks first
  DELETE FROM billing_schema.outbox_locks
  WHERE expires_at < v_now;
  
  -- Try to acquire lock (upsert pattern)
  INSERT INTO billing_schema.outbox_locks (worker_id, acquired_at, heartbeat_at, expires_at)
  VALUES (p_worker_id, v_now, v_now, v_expires_at)
  ON CONFLICT (worker_id) DO UPDATE
  SET 
    heartbeat_at = v_now, 
    expires_at = v_expires_at
  WHERE outbox_locks.worker_id = p_worker_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION billing_schema.acquire_outbox_lock IS 'Acquire distributed lock for outbox worker';

-- =====================================================
-- FUNCTION: release_outbox_lock
-- Purpose: Release distributed lock
-- =====================================================

CREATE OR REPLACE FUNCTION billing_schema.release_outbox_lock(
  p_worker_id VARCHAR
) RETURNS VOID AS $$
BEGIN
  DELETE FROM billing_schema.outbox_locks
  WHERE worker_id = p_worker_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION billing_schema.release_outbox_lock IS 'Release distributed lock for outbox worker';

-- =====================================================
-- FUNCTION: update_outbox_heartbeat
-- Purpose: Update heartbeat to keep lock alive
-- =====================================================

CREATE OR REPLACE FUNCTION billing_schema.update_outbox_heartbeat(
  p_worker_id VARCHAR
) RETURNS VOID AS $$
BEGIN
  UPDATE billing_schema.outbox_locks
  SET heartbeat_at = NOW()
  WHERE worker_id = p_worker_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION billing_schema.update_outbox_heartbeat IS 'Update heartbeat to keep lock alive';

-- =====================================================
-- FUNCTION: get_retryable_outbox_events
-- Purpose: Get failed events that can still be retried
-- =====================================================

CREATE OR REPLACE FUNCTION billing_schema.get_retryable_outbox_events(
  batch_size INTEGER
) RETURNS SETOF billing_schema.outbox AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM billing_schema.outbox
  WHERE processed_at IS NULL
    AND retries > 0
    AND retries < max_retries
    AND error_message IS NOT NULL
  ORDER BY occurred_at ASC
  LIMIT batch_size
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION billing_schema.get_retryable_outbox_events IS 'Get failed events that can still be retried';

-- =====================================================
-- FUNCTION: cleanup_old_outbox_events
-- Purpose: Delete old published events for cleanup
-- =====================================================

CREATE OR REPLACE FUNCTION billing_schema.cleanup_old_outbox_events(
  retention_days INTEGER
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM billing_schema.outbox
  WHERE processed_at IS NOT NULL
    AND processed_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION billing_schema.cleanup_old_outbox_events IS 'Delete old published events';

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to service role
GRANT ALL ON outbox_locks TO service_role;
GRANT EXECUTE ON FUNCTION billing_schema.acquire_outbox_lock TO service_role;
GRANT EXECUTE ON FUNCTION billing_schema.release_outbox_lock TO service_role;
GRANT EXECUTE ON FUNCTION billing_schema.update_outbox_heartbeat TO service_role;
GRANT EXECUTE ON FUNCTION billing_schema.get_retryable_outbox_events TO service_role;
GRANT EXECUTE ON FUNCTION billing_schema.cleanup_old_outbox_events TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002: Outbox Functions completed successfully';
  RAISE NOTICE '   - outbox_locks table created';
  RAISE NOTICE '   - acquire_outbox_lock function created';
  RAISE NOTICE '   - release_outbox_lock function created';
  RAISE NOTICE '   - update_outbox_heartbeat function created';
  RAISE NOTICE '   - get_retryable_outbox_events function created';
  RAISE NOTICE '   - cleanup_old_outbox_events function created';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

