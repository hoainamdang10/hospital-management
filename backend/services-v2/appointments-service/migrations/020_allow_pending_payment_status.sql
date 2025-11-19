-- =====================================================
-- Migration: 020_allow_pending_payment_status.sql
-- Purpose : Align appointments status constraint with prepaid flow
-- Author  : Coding Agent (Flow 3 support)
-- Date    : 2025-11-19
-- =====================================================
-- Adds the new PENDING_PAYMENT + ARRIVED statuses so that
-- prepaid appointments can be persisted without violating
-- the chk_status constraint.
-- =====================================================

SET search_path TO appointments_schema;

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS chk_status;

ALTER TABLE appointments
  ADD CONSTRAINT chk_status CHECK (
    status IN (
      'SCHEDULED',
      'PENDING_PAYMENT',
      'CONFIRMED',
      'ARRIVED',
      'CHECKED_IN',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'RESCHEDULED'
    )
  );
