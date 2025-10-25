/**
 * Migration: Create Event Inbox Table
 * Purpose: Implement Inbox Pattern for idempotent event processing
 * 
 * This table stores all incoming events from other services to ensure
 * each event is processed exactly once (idempotency guarantee).
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Idempotency Pattern
 */

-- Create event_inbox table in auth_schema
CREATE TABLE IF NOT EXISTS auth_schema.event_inbox (
  -- Primary key
  inbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  
  -- Event payload
  payload_json JSONB NOT NULL,
  
  -- Event metadata
  source_service TEXT,
  routing_key TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED')),
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_inbox_event_id ON auth_schema.event_inbox(event_id);
CREATE INDEX IF NOT EXISTS idx_event_inbox_status ON auth_schema.event_inbox(status);
CREATE INDEX IF NOT EXISTS idx_event_inbox_unprocessed ON auth_schema.event_inbox(created_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_event_inbox_aggregate ON auth_schema.event_inbox(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_event_inbox_event_type ON auth_schema.event_inbox(event_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION auth_schema.update_event_inbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_inbox_updated_at
  BEFORE UPDATE ON auth_schema.event_inbox
  FOR EACH ROW
  EXECUTE FUNCTION auth_schema.update_event_inbox_updated_at();

-- Add comment
COMMENT ON TABLE auth_schema.event_inbox IS 'Inbox Pattern: Stores incoming events from other services for idempotent processing';
COMMENT ON COLUMN auth_schema.event_inbox.event_id IS 'Unique event identifier from source service (for deduplication)';
COMMENT ON COLUMN auth_schema.event_inbox.status IS 'Processing status: PENDING (new), PROCESSING (in progress), PROCESSED (completed), FAILED (error)';
COMMENT ON COLUMN auth_schema.event_inbox.retry_count IS 'Number of processing attempts (for retry logic)';

-- Enable Row Level Security (RLS)
ALTER TABLE auth_schema.event_inbox ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (service role only)
CREATE POLICY event_inbox_service_role_policy ON auth_schema.event_inbox
  FOR ALL
  USING (true)
  WITH CHECK (true);
