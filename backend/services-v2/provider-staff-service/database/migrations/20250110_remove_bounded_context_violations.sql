-- Migration: Remove Bounded Context Violations from Provider Staff Service
-- Date: 2025-01-10
-- Description: Remove rating, total_patients, is_accepting_new_patients, and reviews columns
--              These belong to other bounded contexts:
--              - rating, reviews → Review/Rating Service
--              - total_patients, is_accepting_new_patients → Scheduling/Appointment Service
--
-- This migration ensures Provider Staff Service only manages:
-- - Professional credentials and qualifications
-- - Work schedules and availability
-- - Employment information
-- - Department assignments

-- ==================== BACKUP DATA (Optional) ====================
-- If you need to migrate data to other services, uncomment and run these queries first:

-- -- Backup reviews to a temporary table (for migration to Review Service)
-- CREATE TABLE IF NOT EXISTS provider_schema.staff_reviews_backup AS
-- SELECT 
--   staff_id,
--   user_id,
--   reviews,
--   rating,
--   created_at,
--   updated_at
-- FROM provider_schema.staff_profiles
-- WHERE reviews IS NOT NULL AND reviews != '[]'::jsonb;

-- -- Backup patient statistics (for migration to Scheduling Service)
-- CREATE TABLE IF NOT EXISTS provider_schema.staff_patient_stats_backup AS
-- SELECT 
--   staff_id,
--   user_id,
--   total_patients,
--   is_accepting_new_patients,
--   created_at,
--   updated_at
-- FROM provider_schema.staff_profiles
-- WHERE total_patients IS NOT NULL OR is_accepting_new_patients = true;

-- ==================== DROP CONSTRAINTS ====================

-- Drop rating constraint
ALTER TABLE provider_schema.staff_profiles
DROP CONSTRAINT IF EXISTS chk_rating;

-- ==================== DROP COLUMNS ====================

-- Drop reviews column (belongs to Review/Rating Service)
ALTER TABLE provider_schema.staff_profiles
DROP COLUMN IF EXISTS reviews;

-- Drop rating column (belongs to Review/Rating Service)
ALTER TABLE provider_schema.staff_profiles
DROP COLUMN IF EXISTS rating;

-- Drop total_patients column (belongs to Scheduling/Appointment Service)
ALTER TABLE provider_schema.staff_profiles
DROP COLUMN IF EXISTS total_patients;

-- Drop is_accepting_new_patients column (belongs to Scheduling/Appointment Service)
ALTER TABLE provider_schema.staff_profiles
DROP COLUMN IF EXISTS is_accepting_new_patients;

-- ==================== VERIFICATION ====================

-- Verify columns are dropped
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if rating column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'provider_schema' 
      AND table_name = 'staff_profiles' 
      AND column_name = 'rating'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'Migration failed: rating column still exists';
  END IF;
  
  -- Check if total_patients column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'provider_schema' 
      AND table_name = 'staff_profiles' 
      AND column_name = 'total_patients'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'Migration failed: total_patients column still exists';
  END IF;
  
  -- Check if is_accepting_new_patients column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'provider_schema' 
      AND table_name = 'staff_profiles' 
      AND column_name = 'is_accepting_new_patients'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'Migration failed: is_accepting_new_patients column still exists';
  END IF;
  
  -- Check if reviews column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'provider_schema' 
      AND table_name = 'staff_profiles' 
      AND column_name = 'reviews'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'Migration failed: reviews column still exists';
  END IF;
  
  RAISE NOTICE 'Migration successful: All bounded context violation columns removed';
END $$;

-- ==================== NOTES ====================
-- 
-- After running this migration:
-- 1. Update application code to remove references to these fields
-- 2. Create Integration Events for cross-service communication:
--    - StaffRatingUpdated (from Review Service)
--    - StaffPatientCountUpdated (from Scheduling Service)
--    - StaffAvailabilityChanged (from Scheduling Service)
-- 3. Update API Gateway to aggregate data from multiple services
-- 4. Consider implementing CQRS read models for performance
--
-- Rollback (if needed):
-- ALTER TABLE provider_schema.staff_profiles ADD COLUMN reviews JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE provider_schema.staff_profiles ADD COLUMN rating NUMERIC(3, 2) DEFAULT 0.00;
-- ALTER TABLE provider_schema.staff_profiles ADD COLUMN total_patients INTEGER;
-- ALTER TABLE provider_schema.staff_profiles ADD COLUMN is_accepting_new_patients BOOLEAN DEFAULT false;
-- ALTER TABLE provider_schema.staff_profiles ADD CONSTRAINT chk_rating CHECK (rating >= 0 AND rating <= 5);

