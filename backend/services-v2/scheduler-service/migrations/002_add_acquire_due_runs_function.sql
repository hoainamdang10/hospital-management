-- =====================================================
-- Scheduler Service - Acquire Due Runs Function
-- =====================================================
-- Purpose: Atomically claim due runs for execution
-- Pattern: UPDATE-in-SELECT with FOR UPDATE SKIP LOCKED
-- Reference: https://www.inferable.ai/blog/posts/postgres-skip-locked
-- =====================================================

CREATE OR REPLACE FUNCTION scheduler.acquire_due_runs(
  p_before_date TIMESTAMPTZ,
  p_worker_id TEXT,
  p_segment INT DEFAULT NULL,
  p_limit INT DEFAULT 100,
  p_grace_window_ms INT DEFAULT 60000,
  p_lease_ttl_ms INT DEFAULT 60000
)
RETURNS TABLE (
  run_id UUID,
  schedule_id UUID,
  tenant_id TEXT,
  due_at_utc TIMESTAMPTZ,
  status TEXT,
  attempt INT,
  locked_by TEXT,
  locked_at_utc TIMESTAMPTZ,
  started_at_utc TIMESTAMPTZ,
  finished_at_utc TIMESTAMPTZ,
  last_error TEXT,
  segment INT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- =====================================================
  -- Atomic lock acquisition with FOR UPDATE SKIP LOCKED
  -- =====================================================
  -- This function:
  -- 1. Finds DUE runs within grace window
  -- 2. Locks them with FOR UPDATE SKIP LOCKED
  -- 3. Updates locked_by and locked_at_utc
  -- 4. Returns claimed runs
  --
  -- Race condition prevention:
  -- - FOR UPDATE SKIP LOCKED ensures only 1 worker claims each run
  -- - Expired locks are re-acquired (lease_ttl_ms)
  -- - Segment filtering for horizontal scaling
  -- =====================================================
  
  RETURN QUERY
  UPDATE scheduler.schedule_runs
  SET 
    locked_by = p_worker_id,
    locked_at_utc = NOW()
  WHERE schedule_runs.run_id IN (
    SELECT sr.run_id
    FROM scheduler.schedule_runs sr
    WHERE sr.status = 'DUE'
      -- Grace window: Accept runs that are late (past due) within grace period
      -- Example: If grace_window = 60s, accept runs due up to 60s ago
      -- This handles clock skew, network latency, processing delays
      AND sr.due_at_utc <= p_before_date
      AND sr.due_at_utc >= p_before_date - (p_grace_window_ms || ' milliseconds')::INTERVAL
      
      -- Segment filtering: For horizontal scaling
      -- Workers can be assigned specific segments to reduce contention
      AND (p_segment IS NULL OR sr.segment = p_segment)
      
      -- Lock expiry: Re-acquire expired locks
      -- If a worker crashes, its locks expire after lease_ttl_ms
      -- This prevents stuck runs
      AND (
        sr.locked_by IS NULL 
        OR sr.locked_at_utc < NOW() - (p_lease_ttl_ms || ' milliseconds')::INTERVAL
      )
    
    -- Order by due_at_utc: Process oldest runs first
    -- This minimizes queue lag
    ORDER BY sr.due_at_utc ASC
    
    -- Limit: Claim only what worker can handle
    -- Prevents overloading workers
    LIMIT p_limit
    
    -- FOR UPDATE SKIP LOCKED: The magic sauce
    -- - FOR UPDATE: Lock selected rows
    -- - SKIP LOCKED: Skip rows already locked by other transactions
    -- - Result: No blocking, no duplicate claims
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    schedule_runs.run_id,
    schedule_runs.schedule_id,
    schedule_runs.tenant_id,
    schedule_runs.due_at_utc,
    schedule_runs.status,
    schedule_runs.attempt,
    schedule_runs.locked_by,
    schedule_runs.locked_at_utc,
    schedule_runs.started_at_utc,
    schedule_runs.finished_at_utc,
    schedule_runs.last_error,
    schedule_runs.segment,
    schedule_runs.created_at;
END;
$$;

-- =====================================================
-- Grant execute permission to service_role
-- =====================================================
GRANT EXECUTE ON FUNCTION scheduler.acquire_due_runs TO service_role;

-- =====================================================
-- Add helpful comment
-- =====================================================
COMMENT ON FUNCTION scheduler.acquire_due_runs IS 
'Atomically claim due runs for execution using FOR UPDATE SKIP LOCKED pattern. 
Prevents race conditions in distributed worker environments.
Reference: https://www.inferable.ai/blog/posts/postgres-skip-locked';

