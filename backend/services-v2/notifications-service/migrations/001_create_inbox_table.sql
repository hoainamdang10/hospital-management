-- =====================================================
-- Notifications Service - Inbox Table
-- =====================================================
-- Purpose: Idempotent event processing with deduplication
-- Pattern: Inbox Pattern for exactly-once semantics
-- =====================================================

-- Create inbox table
CREATE TABLE IF NOT EXISTS notifications_schema.inbox (
  inbox_id BIGSERIAL PRIMARY KEY,
  
  -- Idempotency key (unique constraint for race-free insert)
  idempotency_key TEXT NOT NULL UNIQUE,
  
  -- Event metadata
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  headers_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  
  -- Timestamps
  received_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at_utc TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  last_retry_at_utc TIMESTAMPTZ,
  
  -- Audit
  created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Index for finding pending events
CREATE INDEX idx_inbox_pending ON notifications_schema.inbox(status, received_at_utc)
WHERE status = 'PENDING';

-- Index for finding failed events (for retry)
CREATE INDEX idx_inbox_failed ON notifications_schema.inbox(status, last_retry_at_utc)
WHERE status = 'FAILED';

-- Index for cleanup (old completed events)
CREATE INDEX idx_inbox_completed ON notifications_schema.inbox(status, processed_at_utc)
WHERE status = 'COMPLETED';

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE notifications_schema.inbox ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role has full access to inbox"
  ON notifications_schema.inbox
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Trigger for updated_at_utc
-- =====================================================

CREATE OR REPLACE FUNCTION notifications_schema.update_inbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at_utc = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inbox_updated_at
  BEFORE UPDATE ON notifications_schema.inbox
  FOR EACH ROW
  EXECUTE FUNCTION notifications_schema.update_inbox_updated_at();

-- =====================================================
-- Helper function: Process event idempotently
-- =====================================================

CREATE OR REPLACE FUNCTION notifications_schema.process_event_idempotent(
  p_idempotency_key TEXT,
  p_event_type TEXT,
  p_payload_json JSONB,
  p_headers_json JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  is_new BOOLEAN,
  inbox_id BIGINT,
  status TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_inbox_id BIGINT;
  v_status TEXT;
  v_is_new BOOLEAN;
BEGIN
  -- =====================================================
  -- Try to insert new event (race-free with ON CONFLICT)
  -- =====================================================
  INSERT INTO notifications_schema.inbox (
    idempotency_key,
    event_type,
    payload_json,
    headers_json,
    status
  ) VALUES (
    p_idempotency_key,
    p_event_type,
    p_payload_json,
    p_headers_json,
    'PENDING'
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING inbox.inbox_id, inbox.status
  INTO v_inbox_id, v_status;

  -- =====================================================
  -- Check if insert succeeded (new event) or conflicted (duplicate)
  -- =====================================================
  IF v_inbox_id IS NOT NULL THEN
    -- New event inserted
    v_is_new := TRUE;
  ELSE
    -- Duplicate event, fetch existing
    SELECT inbox.inbox_id, inbox.status
    INTO v_inbox_id, v_status
    FROM notifications_schema.inbox
    WHERE idempotency_key = p_idempotency_key;
    
    v_is_new := FALSE;
  END IF;

  -- =====================================================
  -- Return result
  -- =====================================================
  RETURN QUERY SELECT v_is_new, v_inbox_id, v_status;
END;
$$;

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION notifications_schema.process_event_idempotent TO service_role;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE notifications_schema.inbox IS 
'Inbox table for idempotent event processing.
Implements Inbox Pattern to ensure exactly-once semantics.
Uses unique constraint on idempotency_key for race-free deduplication.';

COMMENT ON FUNCTION notifications_schema.process_event_idempotent IS 
'Atomically insert event or detect duplicate.
Returns is_new=true if event is new, is_new=false if duplicate.
Uses INSERT ... ON CONFLICT DO NOTHING for race-free operation.';
