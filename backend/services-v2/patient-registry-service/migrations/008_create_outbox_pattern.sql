-- =====================================================
-- Migration: 008_create_outbox_pattern.sql
-- Description: Create outbox pattern for reliable event publishing
-- Author: Hospital Management Team
-- Date: 2025-11-04
-- Schema: patient_schema
-- =====================================================

SET search_path TO patient_schema;

-- =====================================================
-- CREATE OUTBOX TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS outbox_events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Metadata
  event_id UUID NOT NULL DEFAULT gen_random_uuid(),
  event_type VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL, -- 'Patient', 'EmergencyContact', 'Consent', etc.
  aggregate_id VARCHAR(255) NOT NULL, -- Patient ID format: PAT-YYYYMM-XXX

  -- Event Payload (JSONB for flexibility)
  payload JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Correlation ID, User ID, etc.

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Processing Status
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,

  -- Partitioning & Ordering
  sequence_number BIGSERIAL,
  partition_key VARCHAR(100) -- For sharding/partitioning
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Index for pending events (most common query)
CREATE INDEX IF NOT EXISTS idx_outbox_pending_events 
ON outbox_events (status, created_at) 
WHERE status = 'PENDING';

-- Index for event type queries
CREATE INDEX IF NOT EXISTS idx_outbox_event_type 
ON outbox_events (event_type, created_at);

-- Index for aggregate queries
CREATE INDEX IF NOT EXISTS idx_outbox_aggregate 
ON outbox_events (aggregate_type, aggregate_id);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_outbox_published_at 
ON outbox_events (published_at) 
WHERE status = 'PUBLISHED';

-- =====================================================
-- CREATE DEAD LETTER QUEUE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS outbox_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id UUID NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  failure_reason TEXT NOT NULL,
  retry_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  moved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for DLQ queries
CREATE INDEX IF NOT EXISTS idx_dlq_event_type 
ON outbox_dead_letter_queue (event_type, moved_at);

CREATE INDEX IF NOT EXISTS idx_dlq_aggregate 
ON outbox_dead_letter_queue (aggregate_type, aggregate_id);

-- =====================================================
-- CREATE OUTBOX PROCESSING LOCK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS outbox_processing_lock (
  lock_id VARCHAR(50) PRIMARY KEY,
  worker_id VARCHAR(100) NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  heartbeat_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to acquire processing lock
CREATE OR REPLACE FUNCTION acquire_outbox_lock(
  p_lock_id VARCHAR(50),
  p_worker_id VARCHAR(100),
  p_ttl_seconds INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_acquired BOOLEAN;
BEGIN
  -- Try to insert lock
  INSERT INTO outbox_processing_lock (lock_id, worker_id, expires_at)
  VALUES (p_lock_id, p_worker_id, NOW() + (p_ttl_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (lock_id) DO NOTHING;

  -- Check if we acquired the lock
  SELECT EXISTS (
    SELECT 1 FROM outbox_processing_lock
    WHERE lock_id = p_lock_id AND worker_id = p_worker_id
  ) INTO v_acquired;

  RETURN v_acquired;
END;
$$;

-- Function to release processing lock
CREATE OR REPLACE FUNCTION release_outbox_lock(
  p_lock_id VARCHAR(50),
  p_worker_id VARCHAR(100)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM outbox_processing_lock
  WHERE lock_id = p_lock_id AND worker_id = p_worker_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

-- Function to update heartbeat
CREATE OR REPLACE FUNCTION update_outbox_heartbeat(
  p_lock_id VARCHAR(50),
  p_worker_id VARCHAR(100)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE outbox_processing_lock
  SET heartbeat_at = NOW()
  WHERE lock_id = p_lock_id AND worker_id = p_worker_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Function to move failed event to DLQ
CREATE OR REPLACE FUNCTION move_to_dead_letter_queue(
  p_event_id UUID,
  p_failure_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into DLQ
  INSERT INTO outbox_dead_letter_queue (
    original_event_id, event_type, aggregate_type, aggregate_id,
    payload, metadata, failure_reason, retry_count, created_at
  )
  SELECT
    event_id, event_type, aggregate_type, aggregate_id,
    payload, metadata, p_failure_reason, retry_count, created_at
  FROM outbox_events
  WHERE id = p_event_id;

  -- Delete from outbox
  DELETE FROM outbox_events WHERE id = p_event_id;
END;
$$;

-- Function to cleanup old published events
CREATE OR REPLACE FUNCTION cleanup_old_published_events(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM outbox_events
  WHERE status = 'PUBLISHED'
    AND published_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on sequence to service_role
GRANT USAGE, SELECT ON SEQUENCE outbox_events_sequence_number_seq TO service_role;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_processing_lock ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY service_role_full_access_outbox ON outbox_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY service_role_full_access_dlq ON outbox_dead_letter_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY service_role_full_access_lock ON outbox_processing_lock
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 008: Outbox pattern created successfully';
  RAISE NOTICE '   - Tables: outbox_events, outbox_dead_letter_queue, outbox_processing_lock';
  RAISE NOTICE '   - Functions: acquire_outbox_lock, release_outbox_lock, update_outbox_heartbeat';
  RAISE NOTICE '   - Functions: move_to_dead_letter_queue, cleanup_old_published_events';
  RAISE NOTICE '   - Indexes created for performance';
  RAISE NOTICE '   - RLS policies enabled';
END $$;


