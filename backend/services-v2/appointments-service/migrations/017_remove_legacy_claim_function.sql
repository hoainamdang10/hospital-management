-- 017_remove_legacy_claim_function.sql
-- Purpose: Ensure only the new claim_outbox_events signature exists
-- Date: 2025-11-07

DO $$
BEGIN
  -- Drop legacy single-argument signature if it still exists
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE
      n.nspname = 'appointments_schema'
      AND p.proname = 'claim_outbox_events'
      AND pg_catalog.pg_get_function_identity_arguments(p.oid) = 'integer'
  ) THEN
    EXECUTE 'DROP FUNCTION appointments_schema.claim_outbox_events(integer);';
    RAISE NOTICE 'Dropped legacy claim_outbox_events(integer) function';
  ELSE
    RAISE NOTICE 'Legacy claim_outbox_events(integer) function already absent';
  END IF;
END $$;

-- Re-grant permissions on the current signature to be safe
GRANT EXECUTE ON FUNCTION appointments_schema.claim_outbox_events(integer, integer) TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 017 completed';
  RAISE NOTICE '   - Ensured only the (integer, integer) claim_outbox_events signature remains';
END $$;
