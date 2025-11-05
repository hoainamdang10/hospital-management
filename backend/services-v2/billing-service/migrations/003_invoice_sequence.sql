-- =====================================================
-- Migration: 003_invoice_sequence.sql
-- Description: Invoice sequence number management
-- Author: Hospital Management Team
-- Date: 2025-11-03
-- Compliance: Vietnamese Invoice Numbering Standards
-- =====================================================

-- Use billing_schema
SET search_path TO billing_schema;

-- =====================================================
-- TABLE: invoice_sequences
-- Purpose: Track invoice sequence numbers by year/month
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_sequences (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  last_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(year, month)
);

CREATE INDEX IF NOT EXISTS idx_invoice_sequences_year_month 
ON invoice_sequences(year, month);

COMMENT ON TABLE invoice_sequences IS 'Invoice sequence number tracking by year/month';

-- =====================================================
-- FUNCTION: get_next_invoice_sequence
-- Purpose: Get and increment next invoice sequence number
-- =====================================================

CREATE OR REPLACE FUNCTION billing_schema.get_next_invoice_sequence(
  p_year INTEGER,
  p_month INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_next_sequence INTEGER;
BEGIN
  -- Insert or update sequence
  INSERT INTO billing_schema.invoice_sequences (year, month, last_sequence, updated_at)
  VALUES (p_year, p_month, 1, NOW())
  ON CONFLICT (year, month) DO UPDATE
  SET 
    last_sequence = invoice_sequences.last_sequence + 1,
    updated_at = NOW()
  RETURNING last_sequence INTO v_next_sequence;
  
  RETURN v_next_sequence;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION billing_schema.get_next_invoice_sequence IS 'Get next invoice sequence number for year/month';

-- =====================================================
-- FUNCTION: reset_invoice_sequence
-- Purpose: Reset sequence for a specific year/month (admin only)
-- =====================================================

CREATE OR REPLACE FUNCTION billing_schema.reset_invoice_sequence(
  p_year INTEGER,
  p_month INTEGER,
  p_new_value INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO billing_schema.invoice_sequences (year, month, last_sequence, updated_at)
  VALUES (p_year, p_month, p_new_value, NOW())
  ON CONFLICT (year, month) DO UPDATE
  SET 
    last_sequence = p_new_value,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION billing_schema.reset_invoice_sequence IS 'Reset invoice sequence (admin only)';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON invoice_sequences TO service_role;
GRANT USAGE, SELECT ON SEQUENCE invoice_sequences_id_seq TO service_role;
GRANT EXECUTE ON FUNCTION billing_schema.get_next_invoice_sequence TO service_role;
GRANT EXECUTE ON FUNCTION billing_schema.reset_invoice_sequence TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 003: Invoice Sequence completed successfully';
  RAISE NOTICE '   - invoice_sequences table created';
  RAISE NOTICE '   - get_next_invoice_sequence function created';
  RAISE NOTICE '   - reset_invoice_sequence function created';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

