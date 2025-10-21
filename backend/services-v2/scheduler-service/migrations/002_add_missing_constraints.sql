-- Migration: Add Missing Constraints
-- Description: Add unique constraints and business rule validations
-- Author: AI Agent
-- Date: 2025-10-21

-- ============================================================================
-- 1. ADD UNIQUE CONSTRAINT: Prevent duplicate schedule runs
-- ============================================================================

-- Ensure no duplicate (schedule_id, due_at_utc) combinations
-- This prevents materializer from creating duplicate runs
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_runs_unique_due 
ON scheduler.schedule_runs(schedule_id, due_at_utc);

COMMENT ON INDEX scheduler.idx_schedule_runs_unique_due IS 
'Prevent duplicate materialized runs for same schedule at same time';

-- ============================================================================
-- 2. ADD CHECK CONSTRAINTS: Business rule validations
-- ============================================================================

-- 2.1. Validate CRON schedule has cron_expr
ALTER TABLE scheduler.schedules 
ADD CONSTRAINT chk_cron_has_expr 
CHECK (
  schedule_type != 'CRON' OR cron_expr IS NOT NULL
);

COMMENT ON CONSTRAINT chk_cron_has_expr ON scheduler.schedules IS 
'CRON schedules must have cron_expr';

-- 2.2. Validate RRULE schedule has rrule
ALTER TABLE scheduler.schedules 
ADD CONSTRAINT chk_rrule_has_rule 
CHECK (
  schedule_type != 'RRULE' OR rrule IS NOT NULL
);

COMMENT ON CONSTRAINT chk_rrule_has_rule ON scheduler.schedules IS 
'RRULE schedules must have rrule';

-- 2.3. Validate ONCE schedule has start_at_utc
ALTER TABLE scheduler.schedules 
ADD CONSTRAINT chk_once_has_start 
CHECK (
  schedule_type != 'ONCE' OR start_at_utc IS NOT NULL
);

COMMENT ON CONSTRAINT chk_once_has_start ON scheduler.schedules IS 
'ONCE schedules must have start_at_utc';

-- 2.4. Validate end_at_utc > start_at_utc (if both present)
ALTER TABLE scheduler.schedules 
ADD CONSTRAINT chk_end_after_start 
CHECK (
  end_at_utc IS NULL OR start_at_utc IS NULL OR end_at_utc > start_at_utc
);

COMMENT ON CONSTRAINT chk_end_after_start ON scheduler.schedules IS 
'end_at_utc must be after start_at_utc';

-- 2.5. Validate max_runs > 0
ALTER TABLE scheduler.schedules 
ADD CONSTRAINT chk_max_runs_positive 
CHECK (
  max_runs IS NULL OR max_runs > 0
);

COMMENT ON CONSTRAINT chk_max_runs_positive ON scheduler.schedules IS 
'max_runs must be positive';

-- 2.6. Validate jitter_ms >= 0
ALTER TABLE scheduler.schedules 
ADD CONSTRAINT chk_jitter_non_negative 
CHECK (
  jitter_ms >= 0
);

COMMENT ON CONSTRAINT chk_jitter_non_negative ON scheduler.schedules IS 
'jitter_ms must be non-negative';

-- 2.7. Validate retry_policy_json structure
ALTER TABLE scheduler.schedules 
ADD CONSTRAINT chk_retry_policy_valid 
CHECK (
  retry_policy_json ? 'strategy' AND
  retry_policy_json ? 'max_attempts' AND
  retry_policy_json ? 'base_ms' AND
  (retry_policy_json->>'strategy') IN ('exp', 'linear', 'fixed') AND
  (retry_policy_json->>'max_attempts')::int > 0 AND
  (retry_policy_json->>'base_ms')::int > 0
);

COMMENT ON CONSTRAINT chk_retry_policy_valid ON scheduler.schedules IS 
'retry_policy_json must have valid structure';

-- ============================================================================
-- 3. ADD CHECK CONSTRAINTS: schedule_runs validations
-- ============================================================================

-- 3.1. Validate attempt >= 0
ALTER TABLE scheduler.schedule_runs 
ADD CONSTRAINT chk_attempt_non_negative 
CHECK (
  attempt >= 0
);

COMMENT ON CONSTRAINT chk_attempt_non_negative ON scheduler.schedule_runs IS 
'attempt must be non-negative';

-- 3.2. Validate segment in range [0, 9]
ALTER TABLE scheduler.schedule_runs 
ADD CONSTRAINT chk_segment_range 
CHECK (
  segment IS NULL OR (segment >= 0 AND segment <= 9)
);

COMMENT ON CONSTRAINT chk_segment_range ON scheduler.schedule_runs IS 
'segment must be between 0 and 9';

-- 3.3. Validate locked_by present when status = RUNNING
ALTER TABLE scheduler.schedule_runs 
ADD CONSTRAINT chk_running_has_lock 
CHECK (
  status != 'RUNNING' OR locked_by IS NOT NULL
);

COMMENT ON CONSTRAINT chk_running_has_lock ON scheduler.schedule_runs IS 
'RUNNING runs must have locked_by';

-- 3.4. Validate finished_at_utc > started_at_utc (if both present)
ALTER TABLE scheduler.schedule_runs 
ADD CONSTRAINT chk_finished_after_started 
CHECK (
  finished_at_utc IS NULL OR started_at_utc IS NULL OR finished_at_utc > started_at_utc
);

COMMENT ON CONSTRAINT chk_finished_after_started ON scheduler.schedule_runs IS 
'finished_at_utc must be after started_at_utc';

-- ============================================================================
-- 4. ADD CHECK CONSTRAINTS: outbox validations
-- ============================================================================

-- 4.1. Validate publish_attempts >= 0
ALTER TABLE scheduler.outbox 
ADD CONSTRAINT chk_publish_attempts_non_negative 
CHECK (
  publish_attempts >= 0
);

COMMENT ON CONSTRAINT chk_publish_attempts_non_negative ON scheduler.outbox IS 
'publish_attempts must be non-negative';

-- 4.2. Validate headers_json has required fields
ALTER TABLE scheduler.outbox 
ADD CONSTRAINT chk_headers_valid 
CHECK (
  headers_json ? 'tenant_id' AND
  headers_json ? 'idempotency_key'
);

COMMENT ON CONSTRAINT chk_headers_valid ON scheduler.outbox IS 
'headers_json must have tenant_id and idempotency_key';

-- ============================================================================
-- 5. ADD CHECK CONSTRAINTS: schedule_run_executions validations
-- ============================================================================

-- 5.1. Validate attempt > 0
ALTER TABLE scheduler.schedule_run_executions 
ADD CONSTRAINT chk_execution_attempt_positive 
CHECK (
  attempt > 0
);

COMMENT ON CONSTRAINT chk_execution_attempt_positive ON scheduler.schedule_run_executions IS 
'attempt must be positive';

-- 5.2. Validate finished_at > started_at (if finished)
ALTER TABLE scheduler.schedule_run_executions 
ADD CONSTRAINT chk_execution_finished_after_started 
CHECK (
  finished_at IS NULL OR finished_at > started_at
);

COMMENT ON CONSTRAINT chk_execution_finished_after_started ON scheduler.schedule_run_executions IS 
'finished_at must be after started_at';

-- ============================================================================
-- 6. ADD INDEXES: Performance optimization
-- ============================================================================

-- 6.1. Index for finding schedules by owner
CREATE INDEX IF NOT EXISTS idx_schedules_owner 
ON scheduler.schedules(owner_service, owner_resource_type, owner_resource_id)
WHERE status = 'ACTIVE';

COMMENT ON INDEX scheduler.idx_schedules_owner IS 
'Find active schedules by owner (for cancellation)';

-- 6.2. Index for finding runs by tenant
CREATE INDEX IF NOT EXISTS idx_schedule_runs_tenant 
ON scheduler.schedule_runs(tenant_id, status, due_at_utc);

COMMENT ON INDEX scheduler.idx_schedule_runs_tenant IS 
'Find runs by tenant and status';

-- 6.3. Index for outbox cleanup
CREATE INDEX IF NOT EXISTS idx_outbox_cleanup 
ON scheduler.outbox(published_at_utc)
WHERE published_at_utc IS NOT NULL;

COMMENT ON INDEX scheduler.idx_outbox_cleanup IS 
'Find published outbox entries for cleanup';

-- ============================================================================
-- 7. ADD FUNCTIONS: Helper functions
-- ============================================================================

-- 7.1. Function to validate CRON expression
CREATE OR REPLACE FUNCTION scheduler.validate_cron_expr(expr text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Basic validation: 5 or 6 fields separated by spaces
  -- Full validation done in application layer
  RETURN expr ~ '^\s*(\S+\s+){4,5}\S+\s*$';
END;
$$;

COMMENT ON FUNCTION scheduler.validate_cron_expr IS 
'Basic validation for CRON expression format';

-- 7.2. Function to calculate next run time (placeholder)
CREATE OR REPLACE FUNCTION scheduler.calculate_next_run(
  p_schedule_id uuid,
  p_after_utc timestamptz DEFAULT now()
)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_schedule_type text;
  v_cron_expr text;
  v_rrule text;
  v_start_at_utc timestamptz;
BEGIN
  -- Get schedule details
  SELECT schedule_type, cron_expr, rrule, start_at_utc
  INTO v_schedule_type, v_cron_expr, v_rrule, v_start_at_utc
  FROM scheduler.schedules
  WHERE schedule_id = p_schedule_id;

  -- For ONCE schedules
  IF v_schedule_type = 'ONCE' THEN
    IF v_start_at_utc > p_after_utc THEN
      RETURN v_start_at_utc;
    ELSE
      RETURN NULL; -- Already passed
    END IF;
  END IF;

  -- For CRON and RRULE, calculation done in application layer
  -- This is just a placeholder
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION scheduler.calculate_next_run IS 
'Calculate next run time for a schedule (placeholder for app layer)';

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on functions to service_role
GRANT EXECUTE ON FUNCTION scheduler.validate_cron_expr TO service_role;
GRANT EXECUTE ON FUNCTION scheduler.calculate_next_run TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 002_add_missing_constraints.sql completed successfully';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  - 1 unique index (schedule_runs)';
  RAISE NOTICE '  - 14 check constraints (schedules, schedule_runs, outbox, executions)';
  RAISE NOTICE '  - 3 performance indexes';
  RAISE NOTICE '  - 2 helper functions';
END $$;

