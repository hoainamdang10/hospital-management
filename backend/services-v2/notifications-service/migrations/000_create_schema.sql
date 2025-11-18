/**
 * Migration 000: Create Notifications Schema
 * Description: Create notifications_schema and grant permissions to service_role
 *
 * This must be run FIRST before any other migrations
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @date 2025-01-17
 */

-- =====================================================
-- Create Schema
-- =====================================================

-- Create notifications_schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS notifications_schema;

-- =====================================================
-- Grant Permissions to service_role
-- =====================================================

-- Grant USAGE on schema (allows access to schema)
GRANT USAGE ON SCHEMA notifications_schema TO service_role;
GRANT USAGE ON SCHEMA notifications_schema TO authenticated;
GRANT USAGE ON SCHEMA notifications_schema TO anon;

-- Grant ALL privileges on schema (allows creating tables, etc.)
GRANT ALL ON SCHEMA notifications_schema TO service_role;

-- Grant ALL privileges on all existing tables in schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA notifications_schema TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA notifications_schema TO authenticated;

-- Grant ALL privileges on all existing sequences in schema
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA notifications_schema TO service_role;

-- Grant ALL privileges on all existing functions in schema
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA notifications_schema TO service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA notifications_schema
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA notifications_schema
  GRANT SELECT ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA notifications_schema
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA notifications_schema
  GRANT ALL ON FUNCTIONS TO service_role;

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata
    WHERE schema_name = 'notifications_schema'
  ) THEN
    RAISE NOTICE '✅ Migration 000: notifications_schema created successfully';
    RAISE NOTICE '✅ Permissions granted to service_role';
  ELSE
    RAISE EXCEPTION '❌ Migration 000: Failed to create notifications_schema';
  END IF;
END $$;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON SCHEMA notifications_schema IS
'Notifications Service schema - stores notifications, templates, preferences, and appointment reminders.
Isolated from other service schemas following bounded context principles.';

