-- =====================================================
-- Migration: 999_cleanup_outbox_saga_tables.sql
-- Description: Remove unused Outbox and Saga pattern tables
-- Author: Hospital Management Team
-- Date: 2025-01-13
-- Reason: Service uses direct event publishing via RabbitMQ
-- =====================================================

-- Use billing_schema
SET search_path TO billing_schema;

-- =====================================================
-- DROP UNUSED TABLES
-- =====================================================

-- Drop Outbox Pattern tables
DROP TABLE IF EXISTS outbox CASCADE;
DROP TABLE IF EXISTS outbox_locks CASCADE;
DROP TABLE IF EXISTS inbox CASCADE;

-- Drop Saga Pattern tables
DROP TABLE IF EXISTS saga_state CASCADE;

-- Drop Idempotency table (not used)
DROP TABLE IF EXISTS idempotency_keys CASCADE;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 999: Cleanup Outbox/Saga tables completed';
  RAISE NOTICE '   - Dropped: outbox, outbox_locks, inbox';
  RAISE NOTICE '   - Dropped: saga_state';
  RAISE NOTICE '   - Dropped: idempotency_keys';
  RAISE NOTICE '   - Remaining tables: invoices, billing_items, payment_records, insurance_claims, invoice_sequences';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
