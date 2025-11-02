-- =====================================================================================
-- Migration 015: Align Queue Schema with Supabase Reality
-- =====================================================================================
-- Purpose: Fix schema mismatch between migration 001 and actual Supabase schema
-- 
-- PROBLEM:
-- - Migration 001 created scheduling_schema.queue_entries with wrong columns:
--   priority_level (int), joined_at (timestamp), estimated_wait_time (int)
-- 
-- - Actual Supabase has appointments_schema.queue_entries with correct columns:
--   priority (text), check_in_time (timestamptz), estimated_wait_minutes (int)
--
-- SOLUTION: 
-- - Drop old scheduling_schema tables if they exist
-- - Ensure appointments_schema.queue_entries has correct structure
-- - Add missing constraints and indexes
-- =====================================================================================

-- =====================================================================================
-- 1. CLEANUP OLD SCHEMA (if exists from migration 001)
-- =====================================================================================

-- Drop old scheduling_schema tables (they're not used)
DROP TABLE IF EXISTS scheduling_schema.queue_entries CASCADE;
DROP TABLE IF EXISTS scheduling_schema.queues CASCADE;
DROP TABLE IF EXISTS scheduling_schema.recurring_appointments CASCADE;
DROP SCHEMA IF EXISTS scheduling_schema CASCADE;

-- =====================================================================================
-- 2. VERIFY APPOINTMENTS_SCHEMA.QUEUE_ENTRIES STRUCTURE
-- =====================================================================================

-- Ensure queue_entries table exists with correct columns
DO $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'appointments_schema' 
    AND table_name = 'queue_entries'
  ) THEN
    -- Create table if not exists (should already exist from migration 014)
    CREATE TABLE appointments_schema.queue_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id VARCHAR(50) NOT NULL,
      doctor_id VARCHAR(50) NOT NULL,
      appointment_id VARCHAR(50),
      queue_number INTEGER NOT NULL,
      
      -- CORRECT columns (matching code expectations)
      priority TEXT DEFAULT 'NORMAL',
      status TEXT DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
      check_in_time TIMESTAMPTZ DEFAULT NOW(),
      called_time TIMESTAMPTZ,
      completed_time TIMESTAMPTZ,
      estimated_wait_minutes INTEGER,
      
      -- FK to queues
      queue_id VARCHAR(50),
      
      -- Audit
      created_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Foreign key
      CONSTRAINT fk_queue_entries_queue FOREIGN KEY (queue_id) 
        REFERENCES appointments_schema.queues(queue_id) ON DELETE CASCADE
    );
  END IF;
END $$;

-- =====================================================================================
-- 3. ADD MISSING CONSTRAINTS
-- =====================================================================================

-- Priority check (NORMAL, URGENT, EMERGENCY)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_schema = 'appointments_schema' 
    AND table_name = 'queue_entries' 
    AND constraint_name LIKE '%priority%check%'
  ) THEN
    ALTER TABLE appointments_schema.queue_entries 
    ADD CONSTRAINT queue_entries_priority_check 
    CHECK (priority IN ('NORMAL', 'URGENT', 'EMERGENCY'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- 4. ENSURE CORRECT INDEXES
-- =====================================================================================

-- Index on queue_id (for FK lookups)
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_id 
ON appointments_schema.queue_entries(queue_id);

-- Index on doctor_id (for finding doctor's queue)
CREATE INDEX IF NOT EXISTS idx_queue_entries_doctor_id 
ON appointments_schema.queue_entries(doctor_id);

-- Index on status (for filtering by queue status)
CREATE INDEX IF NOT EXISTS idx_queue_entries_status 
ON appointments_schema.queue_entries(status);

-- Index on check_in_time (for sorting by check-in time)
CREATE INDEX IF NOT EXISTS idx_queue_entries_check_in_time 
ON appointments_schema.queue_entries(check_in_time);

-- Index on patient_id (for finding patient's queue entries)
CREATE INDEX IF NOT EXISTS idx_queue_entries_patient_id 
ON appointments_schema.queue_entries(patient_id);

-- Composite index for common query pattern (doctor + status)
CREATE INDEX IF NOT EXISTS idx_queue_entries_doctor_status 
ON appointments_schema.queue_entries(doctor_id, status);

-- =====================================================================================
-- 5. VERIFY QUEUES TABLE
-- =====================================================================================

-- Ensure queues table has correct structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'appointments_schema' 
    AND table_name = 'queues'
  ) THEN
    CREATE TABLE appointments_schema.queues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      queue_id VARCHAR(50) UNIQUE NOT NULL,
      doctor_id VARCHAR(50) NOT NULL,
      department_id VARCHAR(50),
      date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CLOSED')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      created_by VARCHAR(50)
    );
  END IF;
END $$;

-- Index on queue_id (business key)
CREATE INDEX IF NOT EXISTS idx_queues_queue_id 
ON appointments_schema.queues(queue_id);

-- Index on doctor_id and date (for finding doctor's queue on specific date)
CREATE INDEX IF NOT EXISTS idx_queues_doctor_date 
ON appointments_schema.queues(doctor_id, date);

-- Index on status
CREATE INDEX IF NOT EXISTS idx_queues_status 
ON appointments_schema.queues(status);

-- =====================================================================================
-- 6. ENABLE RLS (if not already enabled)
-- =====================================================================================

ALTER TABLE appointments_schema.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_schema.queues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS queue_entries_policy ON appointments_schema.queue_entries;
DROP POLICY IF EXISTS queues_policy ON appointments_schema.queues;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY queue_entries_policy ON appointments_schema.queue_entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY queues_policy ON appointments_schema.queues
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================

-- Verify final schema
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'appointments_schema'
    AND table_name = 'queue_entries'
    AND column_name IN ('priority', 'check_in_time', 'estimated_wait_minutes');
  
  IF col_count < 3 THEN
    RAISE EXCEPTION 'Migration 015 failed: queue_entries missing required columns';
  END IF;
  
  RAISE NOTICE 'Migration 015 completed successfully';
  RAISE NOTICE 'Schema aligned: priority, check_in_time, estimated_wait_minutes';
END $$;
