-- =====================================================
-- Migration: 007_create_outbox_pattern.sql
-- Description: Create Outbox Pattern tables for Clinical EMR Service
-- Author: Hospital Management Team
-- Date: 2025-11-02
-- Compliance: Transactional Outbox Pattern, HIPAA, Event Sourcing
-- =====================================================

-- Use clinical_schema for all EMR-related tables
SET search_path TO clinical_schema;

-- =====================================================
-- TABLE: outbox_events
-- Purpose: Store domain events for guaranteed delivery
-- Pattern: Transactional Outbox (saved in same transaction as aggregate)
-- =====================================================

CREATE TABLE IF NOT EXISTS outbox_events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Metadata
  event_id UUID NOT NULL UNIQUE,
  event_type VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL, -- 'MedicalRecord', 'ClinicalNote', etc.
  aggregate_id UUID NOT NULL,
  
  -- Event Payload (JSONB for flexibility)
  payload JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Correlation ID, User ID, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Status Tracking
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PUBLISHED, FAILED
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  
  -- Ordering & Partitioning
  sequence_number BIGSERIAL NOT NULL,
  partition_key VARCHAR(100), -- For sharding if needed
  
  -- Indexes will be created below
  CONSTRAINT outbox_events_status_check CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED'))
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Index for polling pending events (most frequent query)
CREATE INDEX idx_outbox_pending_events 
ON outbox_events (status, created_at) 
WHERE status = 'PENDING';

-- Index for event type filtering
CREATE INDEX idx_outbox_event_type 
ON outbox_events (event_type, created_at);

-- Index for aggregate tracking
CREATE INDEX idx_outbox_aggregate 
ON outbox_events (aggregate_type, aggregate_id, sequence_number);

-- Index for cleanup of old published events
CREATE INDEX idx_outbox_published_cleanup 
ON outbox_events (status, published_at) 
WHERE status = 'PUBLISHED';

-- Index for retry failed events
CREATE INDEX idx_outbox_failed_retry 
ON outbox_events (status, retry_count, created_at) 
WHERE status = 'FAILED';

-- =====================================================
-- TABLE: outbox_processing_lock
-- Purpose: Distributed lock for worker coordination
-- Pattern: Pessimistic locking to prevent duplicate processing
-- =====================================================

CREATE TABLE IF NOT EXISTS outbox_processing_lock (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Only 1 row allowed
  locked_by VARCHAR(255), -- Worker instance ID
  locked_at TIMESTAMP WITH TIME ZONE,
  heartbeat_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT single_row_lock CHECK (id = 1)
);

-- Initialize with unlocked state
INSERT INTO outbox_processing_lock (id, locked_by, locked_at, heartbeat_at)
VALUES (1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TABLE: outbox_dead_letter_queue
-- Purpose: Store permanently failed events for manual intervention
-- =====================================================

CREATE TABLE IF NOT EXISTS outbox_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id UUID NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB,
  
  -- Failure Details
  failure_reason TEXT NOT NULL,
  final_error_message TEXT,
  total_retry_attempts INTEGER NOT NULL,
  
  -- Timestamps
  first_attempted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  moved_to_dlq_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(255),
  resolution_notes TEXT
);

-- Index for querying unresolved DLQ events
CREATE INDEX idx_dlq_unresolved 
ON outbox_dead_letter_queue (resolved, moved_to_dlq_at) 
WHERE resolved = FALSE;

-- =====================================================
-- FUNCTION: acquire_outbox_lock
-- Purpose: Atomic lock acquisition for worker coordination
-- =====================================================

CREATE OR REPLACE FUNCTION acquire_outbox_lock(
  p_worker_id VARCHAR(255),
  p_lock_timeout_seconds INTEGER DEFAULT 30
) RETURNS BOOLEAN AS $$
DECLARE
  v_acquired BOOLEAN;
BEGIN
  -- Try to acquire lock
  UPDATE outbox_processing_lock
  SET 
    locked_by = p_worker_id,
    locked_at = NOW(),
    heartbeat_at = NOW()
  WHERE 
    id = 1
    AND (
      locked_by IS NULL 
      OR heartbeat_at < NOW() - (p_lock_timeout_seconds || ' seconds')::INTERVAL
    );
  
  -- Check if lock was acquired
  GET DIAGNOSTICS v_acquired = ROW_COUNT;
  
  RETURN v_acquired > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: release_outbox_lock
-- Purpose: Release lock after processing batch
-- =====================================================

CREATE OR REPLACE FUNCTION release_outbox_lock(
  p_worker_id VARCHAR(255)
) RETURNS BOOLEAN AS $$
DECLARE
  v_released BOOLEAN;
BEGIN
  UPDATE outbox_processing_lock
  SET 
    locked_by = NULL,
    locked_at = NULL,
    heartbeat_at = NULL
  WHERE 
    id = 1
    AND locked_by = p_worker_id;
  
  GET DIAGNOSTICS v_released = ROW_COUNT;
  
  RETURN v_released > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: update_heartbeat
-- Purpose: Keep lock alive during long processing
-- =====================================================

CREATE OR REPLACE FUNCTION update_outbox_heartbeat(
  p_worker_id VARCHAR(255)
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE outbox_processing_lock
  SET heartbeat_at = NOW()
  WHERE 
    id = 1
    AND locked_by = p_worker_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: move_to_dead_letter_queue
-- Purpose: Move permanently failed events to DLQ
-- =====================================================

CREATE OR REPLACE FUNCTION move_to_dead_letter_queue(
  p_event_id UUID,
  p_failure_reason TEXT
) RETURNS VOID AS $$
DECLARE
  v_event outbox_events%ROWTYPE;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM outbox_events
  WHERE event_id = p_event_id;
  
  IF FOUND THEN
    -- Insert into DLQ
    INSERT INTO outbox_dead_letter_queue (
      original_event_id,
      event_type,
      aggregate_type,
      aggregate_id,
      payload,
      metadata,
      failure_reason,
      final_error_message,
      total_retry_attempts,
      first_attempted_at
    ) VALUES (
      v_event.event_id,
      v_event.event_type,
      v_event.aggregate_type,
      v_event.aggregate_id,
      v_event.payload,
      v_event.metadata,
      p_failure_reason,
      v_event.error_message,
      v_event.retry_count,
      v_event.created_at
    );
    
    -- Delete from outbox
    DELETE FROM outbox_events WHERE event_id = p_event_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: cleanup_old_published_events
-- Purpose: Archive or delete old published events
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_published_events(
  p_retention_days INTEGER DEFAULT 30
) RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM outbox_events
  WHERE 
    status = 'PUBLISHED'
    AND published_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Purpose: Ensure secure access to outbox tables
-- =====================================================

-- Enable RLS
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY outbox_service_role_policy ON outbox_events
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY dlq_service_role_policy ON outbox_dead_letter_queue
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to service role
GRANT ALL ON outbox_events TO service_role;
GRANT ALL ON outbox_processing_lock TO service_role;
GRANT ALL ON outbox_dead_letter_queue TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION acquire_outbox_lock(VARCHAR, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION release_outbox_lock(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION update_outbox_heartbeat(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION move_to_dead_letter_queue(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_published_events(INTEGER) TO service_role;

-- =====================================================
-- COMMENTS for Documentation
-- =====================================================

COMMENT ON TABLE outbox_events IS 'Transactional outbox pattern - stores domain events for guaranteed delivery';
COMMENT ON TABLE outbox_processing_lock IS 'Distributed lock for coordinating multiple worker instances';
COMMENT ON TABLE outbox_dead_letter_queue IS 'Dead letter queue for permanently failed events requiring manual intervention';

COMMENT ON COLUMN outbox_events.event_id IS 'Unique identifier for the domain event (idempotency key)';
COMMENT ON COLUMN outbox_events.aggregate_id IS 'ID of the aggregate that produced this event';
COMMENT ON COLUMN outbox_events.sequence_number IS 'Monotonically increasing sequence for ordering';
COMMENT ON COLUMN outbox_events.partition_key IS 'Optional key for sharding/partitioning events';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table creation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 007: Outbox Pattern tables created successfully';
  RAISE NOTICE '   - outbox_events';
  RAISE NOTICE '   - outbox_processing_lock';
  RAISE NOTICE '   - outbox_dead_letter_queue';
  RAISE NOTICE '   - 5 support functions';
  RAISE NOTICE '   - 6 indexes for performance';
END $$;

-- Show table counts
SELECT 
  'outbox_events' as table_name,
  COUNT(*) as row_count
FROM outbox_events
UNION ALL
SELECT 
  'outbox_processing_lock',
  COUNT(*)
FROM outbox_processing_lock
UNION ALL
SELECT 
  'outbox_dead_letter_queue',
  COUNT(*)
FROM outbox_dead_letter_queue;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
