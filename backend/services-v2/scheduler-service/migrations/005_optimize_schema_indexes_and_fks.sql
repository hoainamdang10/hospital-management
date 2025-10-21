-- Migration 005: Optimize Schema - Remove Redundant FK and Add Performance Indexes
-- Created: 2025-01-15
-- Purpose: 
--   1. Remove redundant FK from schedule_run_executions.schedule_id
--   2. Add performance indexes for common query patterns
--   3. Add composite unique index for deduplication

-- =============================================================================
-- PART 1: Remove Redundant Foreign Key
-- =============================================================================

-- Drop redundant FK: schedule_run_executions.schedule_id → schedules.schedule_id
-- Reason: schedule_id can be obtained via schedule_runs.schedule_id
-- This FK is redundant because:
--   - schedule_run_executions.run_id → schedule_runs.run_id (FK exists)
--   - schedule_runs.schedule_id → schedules.schedule_id (FK exists)
--   - Therefore: schedule_run_executions can reach schedules via schedule_runs

DO $$
BEGIN
  -- Check if FK exists before dropping
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'scheduler' 
      AND table_name = 'schedule_run_executions'
      AND constraint_name LIKE '%schedule_id%'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Get exact FK name
    EXECUTE (
      SELECT 'ALTER TABLE scheduler.schedule_run_executions DROP CONSTRAINT ' || constraint_name || ';'
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'scheduler'
        AND table_name = 'schedule_run_executions'
        AND constraint_name LIKE '%schedule_id%'
        AND constraint_type = 'FOREIGN KEY'
      LIMIT 1
    );
    
    RAISE NOTICE 'Dropped redundant FK from schedule_run_executions.schedule_id';
  ELSE
    RAISE NOTICE 'Redundant FK does not exist, skipping';
  END IF;
END $$;

-- =============================================================================
-- PART 2: Add Performance Indexes
-- =============================================================================

-- Index 1: schedule_runs.due_at_utc
-- Purpose: Optimize queries for finding due runs (most common query)
-- Query pattern: SELECT * FROM schedule_runs WHERE due_at_utc <= NOW() AND status = 'DUE'
CREATE INDEX IF NOT EXISTS idx_schedule_runs_due_at_utc 
  ON scheduler.schedule_runs(due_at_utc) 
  WHERE status = 'DUE';

COMMENT ON INDEX scheduler.idx_schedule_runs_due_at_utc IS 
  'Partial index for finding due runs - optimizes worker polling queries';

-- Index 2: schedule_runs.status
-- Purpose: Optimize filtering by status
-- Query pattern: SELECT * FROM schedule_runs WHERE status = 'RUNNING'
CREATE INDEX IF NOT EXISTS idx_schedule_runs_status 
  ON scheduler.schedule_runs(status);

COMMENT ON INDEX scheduler.idx_schedule_runs_status IS 
  'Index for filtering runs by status';

-- Index 3: schedule_runs.schedule_id + status
-- Purpose: Optimize queries for runs of a specific schedule
-- Query pattern: SELECT * FROM schedule_runs WHERE schedule_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_schedule_runs_schedule_status 
  ON scheduler.schedule_runs(schedule_id, status);

COMMENT ON INDEX scheduler.idx_schedule_runs_schedule_status IS 
  'Composite index for finding runs by schedule and status';

-- Index 4: schedules.tenant_id
-- Purpose: Optimize multi-tenancy queries
-- Query pattern: SELECT * FROM schedules WHERE tenant_id = ?
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_id 
  ON scheduler.schedules(tenant_id);

COMMENT ON INDEX scheduler.idx_schedules_tenant_id IS 
  'Index for multi-tenancy filtering';

-- Index 5: schedules.status
-- Purpose: Optimize filtering active/paused schedules
-- Query pattern: SELECT * FROM schedules WHERE status = 'ACTIVE'
CREATE INDEX IF NOT EXISTS idx_schedules_status 
  ON scheduler.schedules(status);

COMMENT ON INDEX scheduler.idx_schedules_status IS 
  'Index for filtering schedules by status';

-- Index 6: schedules.owner_service
-- Purpose: Optimize queries by owning service
-- Query pattern: SELECT * FROM schedules WHERE owner_service = ?
CREATE INDEX IF NOT EXISTS idx_schedules_owner_service 
  ON scheduler.schedules(owner_service);

COMMENT ON INDEX scheduler.idx_schedules_owner_service IS 
  'Index for filtering schedules by owner service';

-- Index 7: outbox.published_at_utc
-- Purpose: Optimize finding unpublished events
-- Query pattern: SELECT * FROM outbox WHERE published_at_utc IS NULL
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished 
  ON scheduler.outbox(published_at_utc) 
  WHERE published_at_utc IS NULL;

COMMENT ON INDEX scheduler.idx_outbox_unpublished IS 
  'Partial index for finding unpublished outbox events';

-- Index 8: outbox.occurred_at_utc
-- Purpose: Optimize ordering events by occurrence time
-- Query pattern: SELECT * FROM outbox ORDER BY occurred_at_utc
CREATE INDEX IF NOT EXISTS idx_outbox_occurred_at 
  ON scheduler.outbox(occurred_at_utc);

COMMENT ON INDEX scheduler.idx_outbox_occurred_at IS 
  'Index for ordering outbox events by occurrence time';

-- Index 9: dead_letters.stored_at_utc
-- Purpose: Optimize finding recent dead letters
-- Query pattern: SELECT * FROM dead_letters ORDER BY stored_at_utc DESC
CREATE INDEX IF NOT EXISTS idx_dead_letters_stored_at 
  ON scheduler.dead_letters(stored_at_utc DESC);

COMMENT ON INDEX scheduler.idx_dead_letters_stored_at IS 
  'Index for finding recent dead letters';

-- Index 10: dead_letters.failure_type
-- Purpose: Optimize filtering by failure type
-- Query pattern: SELECT * FROM dead_letters WHERE failure_type = 'unroutable_message'
CREATE INDEX IF NOT EXISTS idx_dead_letters_failure_type 
  ON scheduler.dead_letters(failure_type);

COMMENT ON INDEX scheduler.idx_dead_letters_failure_type IS 
  'Index for filtering dead letters by failure type';

-- =============================================================================
-- PART 3: Add Composite Unique Index for Deduplication
-- =============================================================================

-- Composite unique index: (tenant_id, dedup_key)
-- Purpose: Ensure deduplication works correctly per tenant
-- Constraint: A dedup_key must be unique within a tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_tenant_dedup_unique 
  ON scheduler.schedules(tenant_id, dedup_key);

COMMENT ON INDEX scheduler.idx_schedules_tenant_dedup_unique IS 
  'Unique constraint for deduplication per tenant';

-- =============================================================================
-- PART 4: Add Index for Segment-based Sharding
-- =============================================================================

-- Index 11: schedule_runs.segment
-- Purpose: Optimize segment-based worker distribution
-- Query pattern: SELECT * FROM schedule_runs WHERE segment = ?
CREATE INDEX IF NOT EXISTS idx_schedule_runs_segment 
  ON scheduler.schedule_runs(segment) 
  WHERE segment IS NOT NULL;

COMMENT ON INDEX scheduler.idx_schedule_runs_segment IS 
  'Partial index for segment-based worker distribution';

-- =============================================================================
-- PART 5: Add Index for Locked Runs
-- =============================================================================

-- Index 12: schedule_runs.locked_by + locked_at_utc
-- Purpose: Optimize finding locked runs and detecting stale locks
-- Query pattern: SELECT * FROM schedule_runs WHERE locked_by IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_schedule_runs_locked 
  ON scheduler.schedule_runs(locked_by, locked_at_utc) 
  WHERE locked_by IS NOT NULL;

COMMENT ON INDEX scheduler.idx_schedule_runs_locked IS 
  'Partial index for finding locked runs and detecting stale locks';

-- =============================================================================
-- PART 6: Statistics and Verification
-- =============================================================================

-- Update table statistics for query planner
ANALYZE scheduler.schedules;
ANALYZE scheduler.schedule_runs;
ANALYZE scheduler.outbox;
ANALYZE scheduler.dead_letters;
ANALYZE scheduler.schedule_run_executions;

-- Verify indexes were created
DO $$
DECLARE
  index_count INTEGER;
  index_name TEXT;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'scheduler'
    AND indexname LIKE 'idx_%';

  RAISE NOTICE 'Total indexes created: %', index_count;

  -- List all indexes
  RAISE NOTICE 'Indexes in scheduler schema:';
  FOR index_name IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'scheduler'
      AND indexname LIKE 'idx_%'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  - %', index_name;
  END LOOP;
END $$;

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================

-- To rollback this migration, run:
/*
-- Drop indexes
DROP INDEX IF EXISTS scheduler.idx_schedule_runs_due_at_utc;
DROP INDEX IF EXISTS scheduler.idx_schedule_runs_status;
DROP INDEX IF EXISTS scheduler.idx_schedule_runs_schedule_status;
DROP INDEX IF EXISTS scheduler.idx_schedules_tenant_id;
DROP INDEX IF EXISTS scheduler.idx_schedules_status;
DROP INDEX IF EXISTS scheduler.idx_schedules_owner_service;
DROP INDEX IF EXISTS scheduler.idx_outbox_unpublished;
DROP INDEX IF EXISTS scheduler.idx_outbox_occurred_at;
DROP INDEX IF EXISTS scheduler.idx_dead_letters_stored_at;
DROP INDEX IF EXISTS scheduler.idx_dead_letters_failure_type;
DROP INDEX IF EXISTS scheduler.idx_schedules_tenant_dedup_unique;
DROP INDEX IF EXISTS scheduler.idx_schedule_runs_segment;
DROP INDEX IF EXISTS scheduler.idx_schedule_runs_locked;

-- Re-add redundant FK (if needed)
ALTER TABLE scheduler.schedule_run_executions 
  ADD CONSTRAINT schedule_run_executions_schedule_id_fkey 
  FOREIGN KEY (schedule_id) REFERENCES scheduler.schedules(schedule_id);
*/

