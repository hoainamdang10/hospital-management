-- =====================================================
-- Scheduler Service - Execute Run Transactional Function
-- =====================================================
-- Purpose: Atomically execute run + create outbox in single transaction
-- Pattern: Transactional Outbox Pattern
-- =====================================================

CREATE OR REPLACE FUNCTION scheduler.execute_run_transactional(
  p_run_id UUID,
  p_worker_id TEXT,
  p_topic_or_command TEXT,
  p_payload_json JSONB,
  p_headers_json JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_run_status TEXT;
  v_locked_by TEXT;
BEGIN
  -- =====================================================
  -- STEP 1: Validate run ownership
  -- =====================================================
  SELECT status, locked_by
  INTO v_run_status, v_locked_by
  FROM scheduler.schedule_runs
  WHERE run_id = p_run_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Run not found';
    RETURN;
  END IF;

  IF v_locked_by != p_worker_id THEN
    RETURN QUERY SELECT FALSE, 'Run locked by different worker: ' || v_locked_by;
    RETURN;
  END IF;

  IF v_run_status != 'DUE' THEN
    RETURN QUERY SELECT FALSE, 'Run status is not DUE: ' || v_run_status;
    RETURN;
  END IF;

  -- =====================================================
  -- STEP 2: Update run to RUNNING
  -- =====================================================
  UPDATE scheduler.schedule_runs
  SET 
    status = 'RUNNING',
    started_at_utc = NOW()
  WHERE run_id = p_run_id;

  -- =====================================================
  -- STEP 3: Update run to EMITTING
  -- =====================================================
  UPDATE scheduler.schedule_runs
  SET status = 'EMITTING'
  WHERE run_id = p_run_id;

  -- =====================================================
  -- STEP 4: Create Outbox entry
  -- =====================================================
  INSERT INTO scheduler.outbox (
    aggregate_type,
    aggregate_id,
    event_type,
    payload_json,
    headers_json,
    occurred_at_utc,
    published_at_utc,
    publish_attempts,
    last_publish_error
  ) VALUES (
    'schedule_run',
    p_run_id,
    p_topic_or_command,
    p_payload_json,
    p_headers_json,
    NOW(),
    NULL,
    0,
    NULL
  );

  -- =====================================================
  -- STEP 5: Update run to EMITTED
  -- =====================================================
  UPDATE scheduler.schedule_runs
  SET status = 'EMITTED'
  WHERE run_id = p_run_id;

  -- =====================================================
  -- STEP 6: Update run to SUCCEEDED
  -- =====================================================
  UPDATE scheduler.schedule_runs
  SET 
    status = 'SUCCEEDED',
    finished_at_utc = NOW()
  WHERE run_id = p_run_id;

  -- =====================================================
  -- Return success
  -- =====================================================
  RETURN QUERY SELECT TRUE, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    -- =====================================================
    -- On error: Mark run as FAILED
    -- =====================================================
    UPDATE scheduler.schedule_runs
    SET 
      status = 'FAILED',
      last_error = SQLERRM,
      finished_at_utc = NOW()
    WHERE run_id = p_run_id;

    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;

-- =====================================================
-- Grant execute permission to service_role
-- =====================================================
GRANT EXECUTE ON FUNCTION scheduler.execute_run_transactional TO service_role;

-- =====================================================
-- Add helpful comment
-- =====================================================
COMMENT ON FUNCTION scheduler.execute_run_transactional IS 
'Atomically execute run and create outbox entry in single transaction.
Implements Transactional Outbox Pattern to ensure data consistency.
All steps (RUNNING → EMITTING → EMITTED → SUCCEEDED) + outbox creation are atomic.
On error, run is marked as FAILED and transaction is rolled back.';
