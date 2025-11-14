/**
 * Migration: Create Event Outbox Table
 * Purpose: Implement Outbox Pattern for guaranteed event publishing
 * 
 * The Outbox Pattern ensures that domain events are published reliably:
 * 1. Events are stored in the outbox table atomically with business data
 * 2. A separate background job publishes events from the outbox
 * 3. If publishing fails, events are retried
 * 4. Once published, events are marked as published
 * 
 * This guarantees at-least-once event delivery (exactly-once with idempotency)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Outbox Pattern
 */

-- Create event_outbox table in auth_schema
CREATE TABLE IF NOT EXISTS auth_schema.event_outbox (
  -- Primary key
  outbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_id UUID NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  
  -- Event payload
  payload JSONB NOT NULL,
  
  -- Event metadata
  source_service TEXT DEFAULT 'identity-service',
  routing_key TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  
  -- Publishing status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED')),
  published_at TIMESTAMPTZ,
  publishing_error TEXT,
  publish_attempts INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_outbox_status ON auth_schema.event_outbox(status);
CREATE INDEX IF NOT EXISTS idx_event_outbox_pending ON auth_schema.event_outbox(created_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_event_outbox_failed ON auth_schema.event_outbox(created_at) WHERE status = 'FAILED';
CREATE INDEX IF NOT EXISTS idx_event_outbox_aggregate ON auth_schema.event_outbox(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_event_outbox_event_type ON auth_schema.event_outbox(event_type);
CREATE INDEX IF NOT EXISTS idx_event_outbox_event_id ON auth_schema.event_outbox(event_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION auth_schema.update_event_outbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_outbox_updated_at
  BEFORE UPDATE ON auth_schema.event_outbox
  FOR EACH ROW
  EXECUTE FUNCTION auth_schema.update_event_outbox_updated_at();

-- Add comments
COMMENT ON TABLE auth_schema.event_outbox IS 'Outbox Pattern: Stores domain events for reliable publishing to message broker';
COMMENT ON COLUMN auth_schema.event_outbox.event_id IS 'Unique event identifier (UUID) for deduplication';
COMMENT ON COLUMN auth_schema.event_outbox.status IS 'Publishing status: PENDING (new), PUBLISHING (in progress), PUBLISHED (success), FAILED (error)';
COMMENT ON COLUMN auth_schema.event_outbox.publish_attempts IS 'Number of publishing attempts (for retry logic)';
COMMENT ON COLUMN auth_schema.event_outbox.routing_key IS 'RabbitMQ routing key for topic-based routing';

-- Enable Row Level Security (RLS)
ALTER TABLE auth_schema.event_outbox ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (service role only)
CREATE POLICY event_outbox_service_role_policy ON auth_schema.event_outbox
  FOR ALL
  USING (true)
  WITH CHECK (true);
