-- Test script for acquire_due_runs function
-- Run this after deploying migration 002

-- 1. Verify function exists
SELECT 
  routine_name, 
  routine_type,
  routine_schema
FROM information_schema.routines 
WHERE routine_schema = 'scheduler' 
  AND routine_name = 'acquire_due_runs';

-- Expected: 1 row with routine_name = 'acquire_due_runs', routine_type = 'FUNCTION'

-- 2. Create test schedule
INSERT INTO scheduler.schedules (
  schedule_id,
  tenant_id,
  owner_service,
  dedup_key,
  schedule_type,
  topic_or_command,
  payload_json,
  status,
  created_at
) VALUES (
  'test-schedule-001',
  'test-tenant',
  'test-service',
  'test-dedup-001',
  'ONCE',
  'test.topic',
  '{"test": true}',
  'ACTIVE',
  NOW()
) ON CONFLICT (schedule_id) DO NOTHING;

-- 3. Create test runs with different scenarios
-- Scenario 1: On-time run
INSERT INTO scheduler.schedule_runs (
  run_id,
  schedule_id,
  tenant_id,
  due_at_utc,
  status,
  attempt,
  segment,
  created_at
) VALUES (
  gen_random_uuid(),
  'test-schedule-001',
  'test-tenant',
  NOW(),
  'DUE',
  0,
  0,
  NOW()
);

-- Scenario 2: 30 seconds late (within grace window)
INSERT INTO scheduler.schedule_runs (
  run_id,
  schedule_id,
  tenant_id,
  due_at_utc,
  status,
  attempt,
  segment,
  created_at
) VALUES (
  gen_random_uuid(),
  'test-schedule-001',
  'test-tenant',
  NOW() - INTERVAL '30 seconds',
  'DUE',
  0,
  0,
  NOW()
);

-- Scenario 3: 90 seconds late (beyond grace window)
INSERT INTO scheduler.schedule_runs (
  run_id,
  schedule_id,
  tenant_id,
  due_at_utc,
  status,
  attempt,
  segment,
  created_at
) VALUES (
  gen_random_uuid(),
  'test-schedule-001',
  'test-tenant',
  NOW() - INTERVAL '90 seconds',
  'DUE',
  0,
  0,
  NOW()
);

-- 4. Test acquire_due_runs function
-- Should acquire runs 1 and 2 (within grace window), skip run 3
SELECT 
  run_id,
  due_at_utc,
  locked_by,
  locked_at_utc
FROM scheduler.acquire_due_runs(
  NOW(),           -- p_before_date
  'test-worker-1', -- p_worker_id
  NULL,            -- p_segment (all segments)
  10,              -- p_limit
  60000,           -- p_grace_window_ms (60 seconds)
  60000            -- p_lease_ttl_ms (60 seconds)
);

-- Expected: 2 rows (runs 1 and 2), both locked by 'test-worker-1'

-- 5. Verify locked runs
SELECT 
  run_id,
  due_at_utc,
  status,
  locked_by,
  locked_at_utc,
  EXTRACT(EPOCH FROM (NOW() - due_at_utc)) AS seconds_late
FROM scheduler.schedule_runs
WHERE schedule_id = 'test-schedule-001'
ORDER BY due_at_utc;

-- Expected:
-- - Run 1: locked_by = 'test-worker-1', seconds_late ~ 0
-- - Run 2: locked_by = 'test-worker-1', seconds_late ~ 30
-- - Run 3: locked_by = NULL, seconds_late ~ 90

-- 6. Test race condition prevention
-- Try to acquire same runs with different worker
SELECT 
  run_id,
  locked_by
FROM scheduler.acquire_due_runs(
  NOW(),
  'test-worker-2',
  NULL,
  10,
  60000,
  60000
);

-- Expected: 0 rows (all runs already locked by worker-1)

-- 7. Test lock expiry
-- Wait 61 seconds or manually update locked_at_utc
UPDATE scheduler.schedule_runs
SET locked_at_utc = NOW() - INTERVAL '61 seconds'
WHERE schedule_id = 'test-schedule-001'
  AND locked_by = 'test-worker-1';

-- Now try to acquire again
SELECT 
  run_id,
  locked_by,
  locked_at_utc
FROM scheduler.acquire_due_runs(
  NOW(),
  'test-worker-2',
  NULL,
  10,
  60000,
  60000
);

-- Expected: 2 rows (runs 1 and 2), now locked by 'test-worker-2'

-- 8. Test segment filtering
-- Create runs in different segments
INSERT INTO scheduler.schedule_runs (
  run_id,
  schedule_id,
  tenant_id,
  due_at_utc,
  status,
  attempt,
  segment,
  created_at
) VALUES 
  (gen_random_uuid(), 'test-schedule-001', 'test-tenant', NOW(), 'DUE', 0, 1, NOW()),
  (gen_random_uuid(), 'test-schedule-001', 'test-tenant', NOW(), 'DUE', 0, 2, NOW()),
  (gen_random_uuid(), 'test-schedule-001', 'test-tenant', NOW(), 'DUE', 0, 3, NOW());

-- Acquire only segment 1
SELECT 
  run_id,
  segment,
  locked_by
FROM scheduler.acquire_due_runs(
  NOW(),
  'test-worker-segment-1',
  1,               -- p_segment = 1
  10,
  60000,
  60000
);

-- Expected: 1 row with segment = 1

-- 9. Cleanup test data
DELETE FROM scheduler.schedule_runs WHERE schedule_id = 'test-schedule-001';
DELETE FROM scheduler.schedules WHERE schedule_id = 'test-schedule-001';

-- 10. Summary
SELECT 'Test completed successfully' AS result;

