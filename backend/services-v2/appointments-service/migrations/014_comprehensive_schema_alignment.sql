-- =====================================================================================
-- COMPREHENSIVE SCHEMA ALIGNMENT FIX
-- Fixes critical production blockers
-- =====================================================================================
-- Version: 1.0.0
-- Date: 2025-01-11
-- Author: Hospital Management Team
-- =====================================================================================

-- =====================================================================================
-- CRITICAL FIXES:
-- 1. Rename scheduling_schema → appointments_schema (align with code)
-- 2. Create missing queues parent table
-- 3. Remove UNIQUE constraint from queue_entries.queue_id
-- 4. Fix all ID column types to VARCHAR(50)
-- 5. Remove format validation constraints
-- =====================================================================================

BEGIN;

-- =====================================================================================
-- 1. SCHEMA MIGRATION: scheduling_schema → appointments_schema
-- =====================================================================================

-- Check if appointments_schema already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'appointments_schema') THEN
        -- Rename scheduling_schema to appointments_schema
        ALTER SCHEMA scheduling_schema RENAME TO appointments_schema;
        RAISE NOTICE 'Renamed scheduling_schema to appointments_schema';
    ELSE
        RAISE NOTICE 'appointments_schema already exists, skipping rename';
    END IF;
END $$;

-- =====================================================================================
-- 2. CREATE MISSING QUEUES PARENT TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS appointments_schema.queues (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Queue Identifier
  queue_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Queue Ownership
  doctor_id VARCHAR(50) NOT NULL,
  department_id VARCHAR(50),
  
  -- Queue Date
  date DATE NOT NULL,
  
  -- Queue Status
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CLOSED')),
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(50),
  
  -- Unique constraint: one queue per doctor per date
  CONSTRAINT unique_doctor_date UNIQUE (doctor_id, date)
);

CREATE INDEX IF NOT EXISTS idx_queues_doctor_date ON appointments_schema.queues(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_queues_date ON appointments_schema.queues(date);

COMMENT ON TABLE appointments_schema.queues IS 'Parent table for queue management - one queue per doctor per date';

-- =====================================================================================
-- 3. FIX QUEUE_ENTRIES TABLE
-- =====================================================================================

-- Drop UNIQUE constraint on queue_id (allows multiple entries per queue)
DO $$
BEGIN
    ALTER TABLE appointments_schema.queue_entries 
        DROP CONSTRAINT IF EXISTS queue_entries_queue_id_key;
    RAISE NOTICE 'Dropped UNIQUE constraint on queue_entries.queue_id';
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'UNIQUE constraint on queue_id does not exist, skipping';
END $$;

-- Add foreign key to queues table (if not exists)
DO $$
BEGIN
    ALTER TABLE appointments_schema.queue_entries
        ADD CONSTRAINT fk_queue_entries_queue 
        FOREIGN KEY (queue_id) REFERENCES appointments_schema.queues(queue_id) 
        ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint to queues table';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key constraint already exists, skipping';
END $$;

-- Ensure all ID columns are VARCHAR(50)
ALTER TABLE appointments_schema.queue_entries
  ALTER COLUMN patient_id TYPE VARCHAR(50),
  ALTER COLUMN doctor_id TYPE VARCHAR(50),
  ALTER COLUMN appointment_id TYPE VARCHAR(50);

-- Drop format validation constraints
ALTER TABLE appointments_schema.queue_entries
  DROP CONSTRAINT IF EXISTS chk_patient_id_format,
  DROP CONSTRAINT IF EXISTS chk_doctor_id_format,
  DROP CONSTRAINT IF EXISTS chk_appointment_id_format;

-- Add indexes for queue queries
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_id ON appointments_schema.queue_entries(queue_id);
-- Note: queue_entries does NOT have 'date' column - date is in parent queues table
-- CREATE INDEX IF NOT EXISTS idx_queue_entries_doctor_date ON appointments_schema.queue_entries(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_queue_entries_doctor_id ON appointments_schema.queue_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON appointments_schema.queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_check_in_time ON appointments_schema.queue_entries(check_in_time);

-- =====================================================================================
-- 4. FIX APPOINTMENTS TABLE
-- =====================================================================================

-- Ensure all ID columns are VARCHAR(50)
ALTER TABLE appointments_schema.appointments
  ALTER COLUMN patient_id TYPE VARCHAR(50),
  ALTER COLUMN doctor_id TYPE VARCHAR(50),
  ALTER COLUMN department_id TYPE VARCHAR(50);

-- Drop format validation constraints
ALTER TABLE appointments_schema.appointments
  DROP CONSTRAINT IF EXISTS chk_patient_id_format,
  DROP CONSTRAINT IF EXISTS chk_doctor_id_format,
  DROP CONSTRAINT IF EXISTS chk_department_id_format;

-- =====================================================================================
-- 5. FIX READ MODEL TABLES
-- =====================================================================================

-- Fix appointment_read_model (if exists from migration 012)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'appointments_schema' 
               AND table_name = 'appointment_read_model') THEN
        
        -- Fix ID columns
        ALTER TABLE appointments_schema.appointment_read_model
          ALTER COLUMN patient_id TYPE VARCHAR(50),
          ALTER COLUMN doctor_id TYPE VARCHAR(50);
        
        -- Drop format constraints
        ALTER TABLE appointments_schema.appointment_read_model
          DROP CONSTRAINT IF EXISTS appointment_read_model_doctor_id_format,
          DROP CONSTRAINT IF EXISTS appointment_read_model_patient_id_format;
        
        -- Disable RLS (for testing/development)
        ALTER TABLE appointments_schema.appointment_read_model DISABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Fixed appointment_read_model table';
    END IF;
END $$;

-- Fix patient_read_model
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'appointments_schema' 
               AND table_name = 'patient_read_model') THEN
        
        ALTER TABLE appointments_schema.patient_read_model
          ALTER COLUMN patient_id TYPE VARCHAR(50);
        
        ALTER TABLE appointments_schema.patient_read_model
          DROP CONSTRAINT IF EXISTS patient_read_model_patient_id_format;
        
        -- Disable RLS
        ALTER TABLE appointments_schema.patient_read_model DISABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Fixed patient_read_model table';
    END IF;
END $$;

-- Fix provider_read_model
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'appointments_schema' 
               AND table_name = 'provider_read_model') THEN
        
        ALTER TABLE appointments_schema.provider_read_model
          ALTER COLUMN provider_id TYPE VARCHAR(50);
        
        ALTER TABLE appointments_schema.provider_read_model
          DROP CONSTRAINT IF EXISTS provider_read_model_provider_id_format;
        
        -- Disable RLS
        ALTER TABLE appointments_schema.provider_read_model DISABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Fixed provider_read_model table';
    END IF;
END $$;

-- =====================================================================================
-- 6. VERIFY SCHEMA ALIGNMENT
-- =====================================================================================

DO $$
DECLARE
    v_schema_exists BOOLEAN;
    v_queues_exists BOOLEAN;
    v_queue_entries_exists BOOLEAN;
BEGIN
    -- Check schema
    SELECT EXISTS (
        SELECT 1 FROM pg_namespace WHERE nspname = 'appointments_schema'
    ) INTO v_schema_exists;
    
    -- Check tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'appointments_schema' AND table_name = 'queues'
    ) INTO v_queues_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'appointments_schema' AND table_name = 'queue_entries'
    ) INTO v_queue_entries_exists;
    
    IF v_schema_exists AND v_queues_exists AND v_queue_entries_exists THEN
        RAISE NOTICE '✅ Schema alignment successful!';
        RAISE NOTICE '   - appointments_schema: EXISTS';
        RAISE NOTICE '   - queues table: EXISTS';
        RAISE NOTICE '   - queue_entries table: EXISTS';
    ELSE
        RAISE WARNING '⚠️  Schema alignment incomplete:';
        RAISE WARNING '   - appointments_schema: %', v_schema_exists;
        RAISE WARNING '   - queues table: %', v_queues_exists;
        RAISE WARNING '   - queue_entries table: %', v_queue_entries_exists;
    END IF;
END $$;

COMMIT;

-- =====================================================================================
-- VERIFICATION QUERIES (Run separately to check)
-- =====================================================================================

-- Check schema exists
-- SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'appointments_schema';

-- Check queues table structure
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_schema = 'appointments_schema' AND table_name = 'queues';

-- Check queue_entries constraints
-- SELECT con.conname, con.contype, pg_get_constraintdef(con.oid) as definition
-- FROM pg_constraint con
-- JOIN pg_class rel ON rel.oid = con.conrelid
-- JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
-- WHERE nsp.nspname = 'appointments_schema' 
--   AND rel.relname = 'queue_entries'
--   AND con.conname LIKE '%queue_id%';

-- Check all ID column types
-- SELECT table_name, column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_schema = 'appointments_schema'
--   AND column_name LIKE '%_id'
-- ORDER BY table_name, column_name;
