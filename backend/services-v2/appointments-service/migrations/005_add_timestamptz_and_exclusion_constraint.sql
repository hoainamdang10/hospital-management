-- 005_add_timestamptz_and_exclusion_constraint.sql
-- Add timezone-aware columns, multi-tenancy, optimistic locking, and exclusion constraint
-- to prevent double-booking

-- ============================================================================
-- Step 1: Install btree_gist extension (required for exclusion constraint)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- Step 2: Add new columns
-- ============================================================================

-- Timezone-aware appointment times
ALTER TABLE appointments_schema.appointments
  ADD COLUMN IF NOT EXISTS start_at_utc timestamptz,
  ADD COLUMN IF NOT EXISTS end_at_utc timestamptz;

-- Multi-tenancy support
ALTER TABLE appointments_schema.appointments
  ADD COLUMN IF NOT EXISTS tenant_id text NOT NULL DEFAULT 'hospital-1';

-- Optimistic locking
ALTER TABLE appointments_schema.appointments
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- ============================================================================
-- Step 3: Backfill data from appointment_date + appointment_time
-- ============================================================================

-- Backfill start_at_utc (combine date + time, assume Asia/Ho_Chi_Minh timezone)
UPDATE appointments_schema.appointments
SET start_at_utc = (appointment_date + appointment_time) AT TIME ZONE 'Asia/Ho_Chi_Minh'
WHERE start_at_utc IS NULL;

-- Backfill end_at_utc (start_at_utc + duration_minutes)
UPDATE appointments_schema.appointments
SET end_at_utc = start_at_utc + (COALESCE(duration_minutes, 30) || ' minutes')::interval
WHERE end_at_utc IS NULL AND start_at_utc IS NOT NULL;

-- ============================================================================
-- Step 4: Make timestamptz columns NOT NULL after backfill
-- ============================================================================

ALTER TABLE appointments_schema.appointments
  ALTER COLUMN start_at_utc SET NOT NULL,
  ALTER COLUMN end_at_utc SET NOT NULL;

-- ============================================================================
-- Step 5: Add exclusion constraint to prevent double-booking
-- ============================================================================

-- Constraint: Same doctor cannot have overlapping appointments
-- Uses GiST index with tstzrange for efficient overlap detection
ALTER TABLE appointments_schema.appointments
  ADD CONSTRAINT exclude_doctor_time_overlap
  EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(start_at_utc, end_at_utc) WITH &&
  )
  WHERE (status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED'));

-- ============================================================================
-- Step 6: Add indexes for new columns
-- ============================================================================

-- Index for tenant-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id
  ON appointments_schema.appointments(tenant_id);

-- Composite index for tenant + doctor queries
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_doctor
  ON appointments_schema.appointments(tenant_id, doctor_id, start_at_utc);

-- Composite index for tenant + patient queries
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_patient
  ON appointments_schema.appointments(tenant_id, patient_id, start_at_utc);

-- Index for version (optimistic locking)
CREATE INDEX IF NOT EXISTS idx_appointments_version
  ON appointments_schema.appointments(id, version);

-- GiST index for time range queries (already created by exclusion constraint, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_appointments_time_range
  ON appointments_schema.appointments USING gist(tstzrange(start_at_utc, end_at_utc));

-- ============================================================================
-- Step 7: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN appointments_schema.appointments.start_at_utc IS 'Appointment start time in UTC (timezone-aware)';
COMMENT ON COLUMN appointments_schema.appointments.end_at_utc IS 'Appointment end time in UTC (timezone-aware)';
COMMENT ON COLUMN appointments_schema.appointments.tenant_id IS 'Tenant identifier for multi-tenancy support';
COMMENT ON COLUMN appointments_schema.appointments.version IS 'Version number for optimistic locking (incremented on each update)';

COMMENT ON CONSTRAINT exclude_doctor_time_overlap ON appointments_schema.appointments IS 
  'Prevents double-booking: same doctor cannot have overlapping appointments (excludes cancelled/no-show/rescheduled)';

-- ============================================================================
-- Step 8: Create trigger to auto-increment version on update
-- ============================================================================

CREATE OR REPLACE FUNCTION appointments_schema.increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_version ON appointments_schema.appointments;

CREATE TRIGGER trigger_increment_version
  BEFORE UPDATE ON appointments_schema.appointments
  FOR EACH ROW
  EXECUTE FUNCTION appointments_schema.increment_version();

-- ============================================================================
-- Step 9: Update RLS policies to include tenant_id
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS service_role_full_access_appointments ON appointments_schema.appointments;

-- Recreate with tenant awareness (service_role still has full access)
CREATE POLICY service_role_full_access_appointments
  ON appointments_schema.appointments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional: Add tenant-specific policy for authenticated users (commented out for now)
-- CREATE POLICY tenant_isolation_appointments
--   ON appointments_schema.appointments
--   FOR ALL
--   USING (tenant_id = current_setting('app.current_tenant', true))
--   WITH CHECK (tenant_id = current_setting('app.current_tenant', true));

-- ============================================================================
-- Rollback script (for reference, not executed)
-- ============================================================================

-- To rollback this migration:
-- DROP TRIGGER IF EXISTS trigger_increment_version ON appointments_schema.appointments;
-- DROP FUNCTION IF EXISTS appointments_schema.increment_version();
-- ALTER TABLE appointments_schema.appointments DROP CONSTRAINT IF EXISTS exclude_doctor_time_overlap;
-- DROP INDEX IF EXISTS appointments_schema.idx_appointments_time_range;
-- DROP INDEX IF EXISTS appointments_schema.idx_appointments_version;
-- DROP INDEX IF EXISTS appointments_schema.idx_appointments_tenant_patient;
-- DROP INDEX IF EXISTS appointments_schema.idx_appointments_tenant_doctor;
-- DROP INDEX IF EXISTS appointments_schema.idx_appointments_tenant_id;
-- ALTER TABLE appointments_schema.appointments DROP COLUMN IF EXISTS version;
-- ALTER TABLE appointments_schema.appointments DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE appointments_schema.appointments DROP COLUMN IF EXISTS end_at_utc;
-- ALTER TABLE appointments_schema.appointments DROP COLUMN IF EXISTS start_at_utc;
-- DROP EXTENSION IF EXISTS btree_gist;

