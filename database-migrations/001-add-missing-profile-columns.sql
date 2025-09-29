-- =====================================================
-- Migration 001: Add Missing Profile Columns
-- Purpose: Add authentication-related columns to profiles table
-- Date: 2025-01-17
-- Risk Level: LOW (only adding columns, no data loss)
-- =====================================================

-- Start transaction for safety
BEGIN;

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing users to have completed onboarding and accepted terms
-- (Since they're already in the system, assume they've completed these steps)
UPDATE profiles 
SET 
  onboarding_completed = true,
  terms_accepted_at = created_at,
  privacy_accepted_at = created_at
WHERE 
  onboarding_completed IS NULL 
  OR terms_accepted_at IS NULL 
  OR privacy_accepted_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed onboarding process';
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted terms of service';
COMMENT ON COLUMN profiles.privacy_accepted_at IS 'Timestamp when user accepted privacy policy';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user profile picture';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('onboarding_completed', 'terms_accepted_at', 'privacy_accepted_at', 'avatar_url')
ORDER BY column_name;

-- Commit transaction
COMMIT;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify migration success:
-- SELECT COUNT(*) as total_profiles,
--        COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_onboarding,
--        COUNT(CASE WHEN terms_accepted_at IS NOT NULL THEN 1 END) as accepted_terms,
--        COUNT(CASE WHEN privacy_accepted_at IS NOT NULL THEN 1 END) as accepted_privacy
-- FROM profiles;
