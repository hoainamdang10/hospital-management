-- Migration 004: Add columns for unroutable messages to dead_letters table
-- Purpose: Support storing unroutable RabbitMQ messages for investigation
-- Author: AI Agent
-- Date: 2025-10-21

-- Add columns for unroutable messages
ALTER TABLE scheduler.dead_letters
  ADD COLUMN IF NOT EXISTS message_id TEXT,
  ADD COLUMN IF NOT EXISTS routing_key TEXT,
  ADD COLUMN IF NOT EXISTS exchange TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB,
  ADD COLUMN IF NOT EXISTS headers JSONB,
  ADD COLUMN IF NOT EXISTS failure_type TEXT CHECK (failure_type IN ('run_failed', 'unroutable_message', 'publish_failed'));

-- Add index for message_id (for deduplication)
CREATE INDEX IF NOT EXISTS idx_dead_letters_message_id 
  ON scheduler.dead_letters(message_id);

-- Add index for failure_type (for filtering)
CREATE INDEX IF NOT EXISTS idx_dead_letters_failure_type 
  ON scheduler.dead_letters(failure_type);

-- Add comments
COMMENT ON COLUMN scheduler.dead_letters.message_id IS 'RabbitMQ messageId (idempotency_key)';
COMMENT ON COLUMN scheduler.dead_letters.routing_key IS 'RabbitMQ routing key';
COMMENT ON COLUMN scheduler.dead_letters.exchange IS 'RabbitMQ exchange name';
COMMENT ON COLUMN scheduler.dead_letters.payload IS 'Message payload (JSON)';
COMMENT ON COLUMN scheduler.dead_letters.headers IS 'Message headers (JSON)';
COMMENT ON COLUMN scheduler.dead_letters.failure_type IS 'Type of failure: run_failed, unroutable_message, publish_failed';

-- Rollback script (commented out)
-- ALTER TABLE scheduler.dead_letters
--   DROP COLUMN IF EXISTS message_id,
--   DROP COLUMN IF EXISTS routing_key,
--   DROP COLUMN IF EXISTS exchange,
--   DROP COLUMN IF EXISTS payload,
--   DROP COLUMN IF EXISTS headers,
--   DROP COLUMN IF EXISTS failure_type;
-- DROP INDEX IF EXISTS idx_dead_letters_message_id;
-- DROP INDEX IF EXISTS idx_dead_letters_failure_type;

