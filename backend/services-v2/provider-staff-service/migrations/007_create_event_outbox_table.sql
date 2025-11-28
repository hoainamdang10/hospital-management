/**
 * Migration: Create Event Outbox Table (provider_schema)
 * Purpose: Implement Outbox Pattern for reliable event publishing
 *
 * Guarantees:
 * - At-least-once delivery (idempotent consumers required)
 * - Events persisted in the same database as the service data
 */

CREATE TABLE IF NOT EXISTS provider_schema.event_outbox (
  outbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  routing_key TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED')),
  published_at TIMESTAMPTZ,
  publishing_error TEXT,
  publish_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_outbox_status ON provider_schema.event_outbox(status);
CREATE INDEX IF NOT EXISTS idx_event_outbox_pending ON provider_schema.event_outbox(created_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_event_outbox_failed ON provider_schema.event_outbox(created_at) WHERE status = 'FAILED';
CREATE INDEX IF NOT EXISTS idx_event_outbox_aggregate ON provider_schema.event_outbox(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_event_outbox_event_type ON provider_schema.event_outbox(event_type);
CREATE INDEX IF NOT EXISTS idx_event_outbox_event_id ON provider_schema.event_outbox(event_id);

CREATE OR REPLACE FUNCTION provider_schema.update_event_outbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_outbox_updated_at ON provider_schema.event_outbox;
CREATE TRIGGER trigger_update_event_outbox_updated_at
  BEFORE UPDATE ON provider_schema.event_outbox
  FOR EACH ROW
  EXECUTE FUNCTION provider_schema.update_event_outbox_updated_at();

COMMENT ON TABLE provider_schema.event_outbox IS 'Outbox Pattern: Stores domain events for reliable publishing to broker';
COMMENT ON COLUMN provider_schema.event_outbox.event_id IS 'Unique event identifier for deduplication';
COMMENT ON COLUMN provider_schema.event_outbox.status IS 'PUBLISHING lifecycle state';
COMMENT ON COLUMN provider_schema.event_outbox.publish_attempts IS 'Retry counter';

ALTER TABLE provider_schema.event_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_outbox_service_role_policy ON provider_schema.event_outbox
  FOR ALL
  USING (true)
  WITH CHECK (true);
