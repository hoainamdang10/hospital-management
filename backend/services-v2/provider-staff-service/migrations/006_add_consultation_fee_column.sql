-- 006_add_consultation_fee_column.sql
-- Description: Add consultation_fee column to provider_schema.staff_profiles
-- Author: Hospital Management Team
-- Date: 2025-11-07
-- =====================================================

ALTER TABLE provider_schema.staff_profiles
ADD COLUMN IF NOT EXISTS consultation_fee numeric;

COMMENT ON COLUMN provider_schema.staff_profiles.consultation_fee
  IS 'Optional consultation fee in VND for doctors (nullable)';

-- =====================================================
-- ROLLBACK
-- =====================================================
-- To rollback:
-- ALTER TABLE provider_schema.staff_profiles DROP COLUMN IF EXISTS consultation_fee;
