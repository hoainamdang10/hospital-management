-- Migration: Create auth_user_profiles_view
-- Purpose: Provide a unified view of user profiles with roles and permissions
-- Schema: public (view) -> auth_schema (tables)
-- 
-- This view is used by SupabaseAuthClient.getUserProfile()
-- Location: src/infrastructure/auth/SupabaseAuthClient.ts:137-154

-- Drop view if exists (for idempotency)
DROP VIEW IF EXISTS public.auth_user_profiles_view CASCADE;

-- Create view with user profiles, roles, and permissions
-- NOTE: Adapted to actual schema (user_profiles has is_verified, not email_verified)
CREATE OR REPLACE VIEW public.auth_user_profiles_view AS
SELECT
  -- User profile fields (all columns from user_profiles)
  up.id,
  up.email,
  up.username,
  up.full_name,
  up.phone_number,
  up.avatar_url,
  up.role_type,
  up.is_active,
  up.is_verified,
  up.citizen_id,
  up.date_of_birth,
  up.gender,
  up.address,
  up.emergency_contact_name,
  up.emergency_contact_phone,
  up.subscription_tier,
  up.subscription_expires_at,
  up.created_at,
  up.updated_at,

  -- Aggregate roles from user_roles (role_name is stored directly)
  COALESCE(
    json_agg(DISTINCT ur.role_name) FILTER (WHERE ur.role_name IS NOT NULL),
    '[]'::json
  ) AS roles,

  -- Aggregate permissions from user_permissions (permission_name is stored directly)
  COALESCE(
    json_agg(DISTINCT up2.permission_name) FILTER (WHERE up2.permission_name IS NOT NULL),
    '[]'::json
  ) AS permissions

FROM auth_schema.user_profiles up

-- Join with user_roles (stores role_name directly)
LEFT JOIN auth_schema.user_roles ur ON up.id = ur.user_id

-- Join with user_permissions (stores permission_name directly)
LEFT JOIN auth_schema.user_permissions up2 ON up.id = up2.user_id

-- Group by all user profile fields
GROUP BY
  up.id,
  up.email,
  up.username,
  up.full_name,
  up.phone_number,
  up.avatar_url,
  up.role_type,
  up.is_active,
  up.is_verified,
  up.citizen_id,
  up.date_of_birth,
  up.gender,
  up.address,
  up.emergency_contact_name,
  up.emergency_contact_phone,
  up.subscription_tier,
  up.subscription_expires_at,
  up.created_at,
  up.updated_at;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.auth_user_profiles_view TO authenticated;

-- Grant SELECT permission to service role
GRANT SELECT ON public.auth_user_profiles_view TO service_role;

-- Add comment for documentation
COMMENT ON VIEW public.auth_user_profiles_view IS 
'Unified view of user profiles with their roles and permissions. Used for authentication and authorization.';

-- Create helper function to get user profile by ID
CREATE OR REPLACE FUNCTION public.get_user_profile_by_id(user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth_schema
AS $$
DECLARE
  profile_json json;
BEGIN
  SELECT row_to_json(v)
  INTO profile_json
  FROM public.auth_user_profiles_view v
  WHERE v.id = user_id;
  
  RETURN profile_json;
END;
$$;

COMMENT ON FUNCTION public.get_user_profile_by_id(UUID) IS 
'Helper function to get user profile as JSON by user ID.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_id(UUID) TO service_role;

-- Create helper function to get user profile by email
CREATE OR REPLACE FUNCTION public.get_user_profile_by_email(user_email VARCHAR)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth_schema
AS $$
DECLARE
  profile_json json;
BEGIN
  SELECT row_to_json(v)
  INTO profile_json
  FROM public.auth_user_profiles_view v
  WHERE v.email = user_email;
  
  RETURN profile_json;
END;
$$;

COMMENT ON FUNCTION public.get_user_profile_by_email(VARCHAR) IS 
'Helper function to get user profile as JSON by email.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_email(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_email(VARCHAR) TO service_role;

-- Verification queries (run manually to test)
-- SELECT * FROM public.auth_user_profiles_view LIMIT 10;
-- 
-- SELECT public.get_user_profile_by_id('00000000-0000-0000-0000-000000000000');
-- 
-- SELECT public.get_user_profile_by_email('test@example.com');
-- 
-- -- Check view performance
-- EXPLAIN ANALYZE 
-- SELECT * FROM public.auth_user_profiles_view 
-- WHERE email = 'test@example.com';

