-- =====================================================
-- Scheduler Platform - Database Schema
-- Version: 1.0.0
-- Description: Multi-tenant scheduler with Transactional Outbox
-- =====================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS scheduler;

-- =====================================================
-- 1. SCHEDULES TABLE (Schedule Definitions)
-- =====================================================
CREATE TABLE scheduler.schedules (
  schedule_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           TEXT NOT NULL,
  owner_service       TEXT NOT NULL,
  owner_resource_type TEXT,
  owner_resource_id   TEXT,
  policy_tag          TEXT,
  
  -- Scheduling configuration
  schedule_type       TEXT NOT NULL CHECK (schedule_type IN ('ONCE', 'CRON', 'RRULE')),
  timezone            TEXT NOT NULL DEFAULT 'UTC',
  start_at_utc        TIMESTAMPTZ,
  end_at_utc          TIMESTAMPTZ,
  cron_expr           TEXT,
  rrule               TEXT,
  
  -- Command/Event configuration
  topic_or_command    TEXT NOT NULL,
  payload_json        JSONB NOT NULL,
  
  -- Retry & jitter
  max_runs            INT,
  jitter_ms           INT DEFAULT 0,
  retry_policy_json   JSONB NOT NULL DEFAULT '{"strategy":"exp","max_attempts":5,"base_ms":1000}'::jsonb,
  
  -- Deduplication
  dedup_key           TEXT NOT NULL,
  
  -- Status
  status              TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED')),
  
  -- Audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          TEXT,
  
  -- Constraints
  CONSTRAINT chk_schedule_type_config CHECK (
    (schedule_type = 'ONCE' AND start_at_utc IS NOT NULL) OR
    (schedule_type = 'CRON' AND cron_expr IS NOT NULL) OR
    (schedule_type = 'RRULE' AND rrule IS NOT NULL)
  )
);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX uq_sched_tenant_dedup 
ON scheduler.schedules(tenant_id, dedup_key);

-- Indexes for queries
CREATE INDEX idx_schedules_tenant ON scheduler.schedules(tenant_id);
CREATE INDEX idx_schedules_owner ON scheduler.schedules(owner_service, owner_resource_type, owner_resource_id);
CREATE INDEX idx_schedules_status ON scheduler.schedules(status);

-- =====================================================
-- 2. SCHEDULE_RUNS TABLE (Materialized Fire Times)
-- =====================================================
CREATE TABLE scheduler.schedule_runs (
  run_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id         UUID NOT NULL REFERENCES scheduler.schedules(schedule_id) ON DELETE CASCADE,
  tenant_id           TEXT NOT NULL,
  
  -- Execution timing
  due_at_utc          TIMESTAMPTZ NOT NULL,
  
  -- State machine
  status              TEXT NOT NULL CHECK (status IN ('DUE', 'RUNNING', 'EMITTING', 'EMITTED', 'SUCCEEDED', 'FAILED')),
  
  -- Retry tracking
  attempt             INT NOT NULL DEFAULT 0,
  
  -- Distributed lock
  locked_by           TEXT,
  locked_at_utc       TIMESTAMPTZ,
  
  -- Execution tracking
  started_at_utc      TIMESTAMPTZ,
  finished_at_utc     TIMESTAMPTZ,
  last_error          TEXT,
  
  -- Segment for partitioning
  segment             INT,
  
  -- Audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Critical index for worker polling
CREATE INDEX idx_runs_due ON scheduler.schedule_runs(status, due_at_utc);

-- Index for segment-based partitioning
CREATE INDEX idx_runs_segment ON scheduler.schedule_runs(status, due_at_utc, segment);

-- Index for schedule lookup
CREATE INDEX idx_runs_schedule ON scheduler.schedule_runs(schedule_id);

-- Index for tenant lookup
CREATE INDEX idx_runs_tenant ON scheduler.schedule_runs(tenant_id);

-- =====================================================
-- 3. OUTBOX TABLE (Transactional Outbox Pattern)
-- =====================================================
CREATE TABLE scheduler.outbox (
  outbox_id           BIGSERIAL PRIMARY KEY,
  aggregate_type      TEXT NOT NULL DEFAULT 'schedule_run',
  aggregate_id        UUID NOT NULL,  -- run_id
  
  -- Event details
  event_type          TEXT NOT NULL,  -- topic_or_command
  payload_json        JSONB NOT NULL,
  headers_json        JSONB NOT NULL,
  
  -- Timing
  occurred_at_utc     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at_utc    TIMESTAMPTZ,
  
  -- Retry tracking
  publish_attempts    INT NOT NULL DEFAULT 0,
  last_publish_error  TEXT
);

-- Critical index for publisher
CREATE INDEX idx_outbox_unpub 
ON scheduler.outbox(published_at_utc) 
WHERE published_at_utc IS NULL;

-- Index for cleanup
CREATE INDEX idx_outbox_published 
ON scheduler.outbox(published_at_utc) 
WHERE published_at_utc IS NOT NULL;

-- =====================================================
-- 4. DEAD_LETTERS TABLE (Failed Runs)
-- =====================================================
CREATE TABLE scheduler.dead_letters (
  id                  BIGSERIAL PRIMARY KEY,
  run_id              UUID,
  schedule_id         UUID,
  tenant_id           TEXT,
  
  -- Failure details
  reason              TEXT,
  error_message       TEXT,
  
  -- Snapshot
  snapshot_json       JSONB,
  
  -- Audit
  stored_at_utc       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for analysis
CREATE INDEX idx_dead_letters_tenant ON scheduler.dead_letters(tenant_id);
CREATE INDEX idx_dead_letters_schedule ON scheduler.dead_letters(schedule_id);
CREATE INDEX idx_dead_letters_stored ON scheduler.dead_letters(stored_at_utc);

-- =====================================================
-- 5. WORKER_LEASES TABLE (Distributed Locking)
-- =====================================================
CREATE TABLE scheduler.worker_leases (
  lease_key           TEXT PRIMARY KEY,
  holder              TEXT,
  acquired_at_utc     TIMESTAMPTZ,
  expires_at_utc      TIMESTAMPTZ
);

-- Index for cleanup
CREATE INDEX idx_leases_expires ON scheduler.worker_leases(expires_at_utc);

-- =====================================================
-- 6. EXECUTION_AUDIT TABLE (Execution History)
-- =====================================================
CREATE TABLE scheduler.schedule_run_executions (
  execution_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID NOT NULL REFERENCES scheduler.schedule_runs(run_id) ON DELETE CASCADE,
  schedule_id         UUID NOT NULL,
  tenant_id           TEXT NOT NULL,
  
  -- Worker info
  worker_id           TEXT,
  
  -- Timing
  started_at          TIMESTAMPTZ NOT NULL,
  finished_at         TIMESTAMPTZ,
  
  -- Result
  status              TEXT NOT NULL CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED')),
  error_message       TEXT,
  
  -- Retry info
  attempt             INT NOT NULL
);

-- Indexes
CREATE INDEX idx_exec_run ON scheduler.schedule_run_executions(run_id);
CREATE INDEX idx_exec_schedule ON scheduler.schedule_run_executions(schedule_id);
CREATE INDEX idx_exec_tenant ON scheduler.schedule_run_executions(tenant_id);
CREATE INDEX idx_exec_started ON scheduler.schedule_run_executions(started_at);

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION scheduler.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on schedules
CREATE TRIGGER trg_schedules_updated_at
BEFORE UPDATE ON scheduler.schedules
FOR EACH ROW
EXECUTE FUNCTION scheduler.update_updated_at();

-- Function: Calculate segment for run
CREATE OR REPLACE FUNCTION scheduler.calculate_segment(schedule_id_param UUID, num_segments INT DEFAULT 10)
RETURNS INT AS $$
BEGIN
  RETURN MOD(HASHTEXT(schedule_id_param::TEXT), num_segments);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE scheduler.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler.schedule_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler.dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler.worker_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler.schedule_run_executions ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "service_role_full_access_schedules"
  ON scheduler.schedules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_runs"
  ON scheduler.schedule_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_outbox"
  ON scheduler.outbox
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_dead_letters"
  ON scheduler.dead_letters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_leases"
  ON scheduler.worker_leases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_executions"
  ON scheduler.schedule_run_executions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON SCHEMA scheduler IS 'Scheduler Platform - Multi-tenant time-driven infrastructure service';

COMMENT ON TABLE scheduler.schedules IS 'Schedule definitions with CRON/RRULE support';
COMMENT ON TABLE scheduler.schedule_runs IS 'Materialized fire times for schedules';
COMMENT ON TABLE scheduler.outbox IS 'Transactional outbox for reliable messaging';
COMMENT ON TABLE scheduler.dead_letters IS 'Failed runs for manual intervention';
COMMENT ON TABLE scheduler.worker_leases IS 'Distributed locks for worker coordination';
COMMENT ON TABLE scheduler.schedule_run_executions IS 'Execution history for audit trail';

COMMENT ON COLUMN scheduler.schedules.dedup_key IS 'Unique key per tenant for idempotent schedule creation';
COMMENT ON COLUMN scheduler.schedule_runs.segment IS 'Partition key for horizontal scaling (0-9)';
COMMENT ON COLUMN scheduler.outbox.headers_json IS 'Contains correlation_id, causation_id, schedule_id, run_id, tenant_id, idempotency_key';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
