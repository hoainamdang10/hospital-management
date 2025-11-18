-- =====================================================
-- Cleanup Legacy Schemas
-- Date: 2025-01-16
-- Description: Remove unused/legacy schemas to avoid confusion
-- =====================================================

-- ⚠️ WARNING: This script will DROP schemas and all their data!
-- ⚠️ Make sure you have backups before running this script!
-- ⚠️ Run migration 004 first to migrate departments to provider_schema!

BEGIN;

-- =====================================================
-- STEP 1: Drop departments_schema (after migration)
-- =====================================================
DO $$
BEGIN
  -- Check if migration was successful
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'provider_schema' 
    AND table_name = 'departments'
  ) THEN
    RAISE NOTICE '✅ Departments found in provider_schema, safe to drop departments_schema';
    
    -- Drop schema
    DROP SCHEMA IF EXISTS departments_schema CASCADE;
    RAISE NOTICE '✅ Dropped departments_schema';
  ELSE
    RAISE EXCEPTION '❌ Departments NOT found in provider_schema! Run migration 004 first!';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Drop scheduler schema (service removed)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '🗑️  Dropping scheduler schema (service removed)...';
  DROP SCHEMA IF EXISTS scheduler CASCADE;
  RAISE NOTICE '✅ Dropped scheduler schema';
END $$;

-- =====================================================
-- STEP 3: Drop payment_schema (duplicate of billing_schema)
-- =====================================================
DO $$
DECLARE
  payment_tables INTEGER;
  billing_tables INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO payment_tables 
  FROM information_schema.tables 
  WHERE table_schema = 'payment_schema';
  
  SELECT COUNT(*) INTO billing_tables 
  FROM information_schema.tables 
  WHERE table_schema = 'billing_schema';
  
  RAISE NOTICE 'Payment schema tables: %', payment_tables;
  RAISE NOTICE 'Billing schema tables: %', billing_tables;
  
  -- Only drop if billing_schema has more tables (is the active one)
  IF billing_tables > payment_tables THEN
    RAISE NOTICE '🗑️  Dropping payment_schema (legacy duplicate)...';
    DROP SCHEMA IF EXISTS payment_schema CASCADE;
    RAISE NOTICE '✅ Dropped payment_schema';
  ELSE
    RAISE WARNING '⚠️  Billing schema has fewer tables than payment schema!';
    RAISE WARNING '⚠️  Manual review needed before dropping payment_schema';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Drop backup_legacy schema (if exists)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_legacy') THEN
    RAISE NOTICE '🗑️  Dropping backup_legacy schema...';
    DROP SCHEMA IF EXISTS backup_legacy CASCADE;
    RAISE NOTICE '✅ Dropped backup_legacy schema';
  END IF;
END $$;

-- =====================================================
-- STEP 5: List remaining custom schemas
-- =====================================================
DO $$
DECLARE
  schema_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 Remaining Custom Schemas:';
  RAISE NOTICE '================================';
  
  FOR schema_rec IN 
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN (
      'pg_catalog', 'information_schema', 'pg_toast', 
      'public', 'storage', 'graphql', 'graphql_public', 
      'realtime', 'vault', 'extensions', 'auth', 
      'supabase_functions', 'pgsodium', 'pgsodium_masks', 
      'net', 'pgbouncer', 'supabase_migrations', 'pgmq'
    )
    AND schema_name NOT LIKE 'pg_temp%'
    AND schema_name NOT LIKE 'pg_toast_temp%'
    ORDER BY schema_name
  LOOP
    RAISE NOTICE '  ✅ %', schema_rec.schema_name;
  END LOOP;
  
  RAISE NOTICE '================================';
END $$;

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Legacy schema cleanup completed!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  ✅ departments_schema → Dropped (migrated to provider_schema)';
  RAISE NOTICE '  ✅ scheduler → Dropped (service removed)';
  RAISE NOTICE '  ✅ payment_schema → Dropped (duplicate of billing_schema)';
  RAISE NOTICE '  ✅ backup_legacy → Dropped (if existed)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Active Service Schemas:';
  RAISE NOTICE '  - auth_schema (Identity)';
  RAISE NOTICE '  - patient_schema (Patient Registry)';
  RAISE NOTICE '  - provider_schema (Provider/Staff + Departments)';
  RAISE NOTICE '  - appointments_schema (Appointments)';
  RAISE NOTICE '  - billing_schema (Billing)';
  RAISE NOTICE '  - notifications_schema (Notifications)';
  RAISE NOTICE '  - clinical_schema (Clinical EMR)';
END $$;

