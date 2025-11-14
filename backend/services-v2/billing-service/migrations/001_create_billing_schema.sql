-- =====================================================
-- Migration: 001_create_billing_schema.sql
-- Description: Create billing schema and core tables
-- Author: Hospital Management Team
-- Date: 2025-01-13
-- Compliance: Vietnamese Healthcare Standards
-- =====================================================

-- Create billing schema
CREATE SCHEMA IF NOT EXISTS billing_schema;

-- Use billing_schema
SET search_path TO billing_schema;

-- =====================================================
-- TABLE: invoices
-- Purpose: Store invoice records
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY,
  patient_id VARCHAR(50) NOT NULL,
  invoice_number VARCHAR(50) UNIQUE,
  
  -- Line items (JSONB array)
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  -- Amounts
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
  insurance_coverage DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  outstanding_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  
  -- Insurance (JSONB)
  insurance JSONB,
  
  -- Payments (JSONB array)
  payments JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Constraints
  CONSTRAINT chk_status CHECK (status IN ('draft', 'pending', 'partially_paid', 'paid', 'cancelled', 'refunded')),
  CONSTRAINT chk_amounts CHECK (
    subtotal >= 0 AND 
    tax >= 0 AND 
    insurance_coverage >= 0 AND 
    total_amount >= 0 AND 
    outstanding_amount >= 0
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_outstanding ON invoices(outstanding_amount) WHERE outstanding_amount > 0;

COMMENT ON TABLE invoices IS 'Invoice records for billing';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON invoices TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001: Billing Schema completed successfully';
  RAISE NOTICE '   - billing_schema created';
  RAISE NOTICE '   - invoices table created';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
