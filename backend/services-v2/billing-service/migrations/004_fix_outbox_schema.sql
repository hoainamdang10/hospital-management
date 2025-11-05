-- =====================================================
-- Migration: 004_fix_outbox_schema.sql
-- Description: Fix outbox table schema to match code
-- Author: Hospital Management Team
-- Date: 2025-11-03
-- =====================================================

SET search_path TO billing_schema;

-- =====================================================
-- ALTER OUTBOX TABLE
-- =====================================================

-- Add missing columns
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS event_id UUID DEFAULT gen_random_uuid();
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS sequence_number BIGSERIAL;
ALTER TABLE outbox ADD COLUMN IF NOT EXISTS partition_key VARCHAR(100);

-- Copy data from old columns to new columns
UPDATE outbox SET payload = event_data WHERE payload IS NULL;
UPDATE outbox SET retry_count = retries WHERE retry_count = 0;
UPDATE outbox SET published_at = processed_at WHERE published_at IS NULL;

-- Drop old columns (after data migration)
ALTER TABLE outbox DROP COLUMN IF EXISTS event_data;
ALTER TABLE outbox DROP COLUMN IF EXISTS retries;
ALTER TABLE outbox DROP COLUMN IF EXISTS occurred_at;
ALTER TABLE outbox DROP COLUMN IF EXISTS correlation_id;
ALTER TABLE outbox DROP COLUMN IF EXISTS causation_id;
ALTER TABLE outbox DROP COLUMN IF EXISTS user_id;
ALTER TABLE outbox DROP COLUMN IF EXISTS tenant_id;

-- Add constraints
ALTER TABLE outbox DROP CONSTRAINT IF EXISTS outbox_status_check;
ALTER TABLE outbox ADD CONSTRAINT outbox_status_check CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED'));

-- Update NOT NULL constraints
ALTER TABLE outbox ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE outbox ALTER COLUMN payload SET NOT NULL;
ALTER TABLE outbox ALTER COLUMN status SET NOT NULL;
ALTER TABLE outbox ALTER COLUMN retry_count SET NOT NULL;
ALTER TABLE outbox ALTER COLUMN max_retries SET NOT NULL;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_outbox_pending_events 
ON outbox (status, created_at) 
WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_outbox_event_type 
ON outbox (event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_outbox_aggregate 
ON outbox (aggregate_type, aggregate_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_outbox_published_cleanup 
ON outbox (status, published_at) 
WHERE status = 'PUBLISHED';

CREATE INDEX IF NOT EXISTS idx_outbox_failed_retry 
ON outbox (status, retry_count, created_at) 
WHERE status = 'FAILED';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004: Outbox schema fixed successfully';
  RAISE NOTICE '   - Added: event_id, payload, metadata, status, retry_count, published_at, sequence_number, partition_key';
  RAISE NOTICE '   - Removed: event_data, retries, occurred_at, correlation_id, causation_id, user_id, tenant_id';
  RAISE NOTICE '   - Indexes created';
END $$;

