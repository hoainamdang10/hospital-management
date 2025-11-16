-- =====================================================
-- Migration: 002_normalize_billing_schema.sql
-- Description: Normalize billing schema - split items and payments into separate tables
-- Author: Hospital Management Team
-- Date: 2025-01-15
-- Purpose: Align with production schema (verified via Supabase MCP)
-- =====================================================

-- Use billing_schema
SET search_path TO billing_schema;

-- =====================================================
-- DROP OLD JSONB COLUMNS (if they exist from migration 001)
-- =====================================================

ALTER TABLE invoices DROP COLUMN IF EXISTS items CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS payments CASCADE;

-- =====================================================
-- UPDATE invoices table structure to match production
-- =====================================================

-- Add new columns if not exist
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS vietnamese_invoice_number VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS medical_record_id UUID,
  ADD COLUMN IF NOT EXISTS doctor_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN IF NOT EXISTS appointment_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS issued_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS contains_phi BOOLEAN NOT NULL DEFAULT true;

-- Split Money fields into amount + currency
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal_currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  ADD COLUMN IF NOT EXISTS total_amount_new DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS total_currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  ADD COLUMN IF NOT EXISTS insurance_coverage_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_coverage_currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  ADD COLUMN IF NOT EXISTS patient_payment_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS patient_payment_currency VARCHAR(3) NOT NULL DEFAULT 'VND';

-- Migrate data from old columns to new (if old columns exist)
UPDATE invoices 
SET 
  subtotal_amount = COALESCE(subtotal, 0),
  tax_amount = COALESCE(tax, 0),
  total_amount_new = COALESCE(total_amount, 0),
  insurance_coverage_amount = COALESCE(insurance_coverage, 0),
  patient_payment_amount = COALESCE(outstanding_amount, 0)
WHERE subtotal IS NOT NULL;

-- Drop old single-value columns
ALTER TABLE invoices 
  DROP COLUMN IF EXISTS subtotal,
  DROP COLUMN IF EXISTS tax,
  DROP COLUMN IF EXISTS total_amount CASCADE,
  DROP COLUMN IF EXISTS insurance_coverage,
  DROP COLUMN IF EXISTS outstanding_amount,
  DROP COLUMN IF EXISTS currency;

-- Rename new columns
ALTER TABLE invoices RENAME COLUMN total_amount_new TO total_amount;

-- Add insurance fields (Phase 1: nullable, Phase 2: will be used)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS insurance_valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS insurance_coverage_level INTEGER,
  ADD COLUMN IF NOT EXISTS insurance_issued_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS insurance_data JSONB;

-- Drop old insurance JSONB if exists
ALTER TABLE invoices DROP COLUMN IF EXISTS insurance;

-- Update invoice_number column name if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'billing_schema' 
    AND table_name = 'invoices' 
    AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE invoices RENAME COLUMN invoice_number TO invoice_id;
  END IF;
END $$;

-- Update status constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS chk_status;
ALTER TABLE invoices ADD CONSTRAINT chk_status CHECK (
  status IN ('draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded')
);

-- Add insurance coverage level constraint
ALTER TABLE invoices ADD CONSTRAINT chk_insurance_coverage_level CHECK (
  insurance_coverage_level IS NULL OR (insurance_coverage_level >= 0 AND insurance_coverage_level <= 100)
);

-- =====================================================
-- CREATE ENUMS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE billing_schema.invoice_status AS ENUM (
    'draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_schema.insurance_type AS ENUM (
    'BHYT', 'BHTN', 'Private', 'Self-pay'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_schema.item_category AS ENUM (
    'consultation', 'medication', 'procedure', 'test', 'room', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_schema.payment_method AS ENUM (
    'cash', 'card', 'bank_transfer', 'payos', 'insurance_direct'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_schema.claim_status AS ENUM (
    'submitted', 'processing', 'approved', 'rejected', 'paid'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- TABLE: billing_items (normalized)
-- =====================================================

CREATE TABLE IF NOT EXISTS billing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  vietnamese_description TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_amount DECIMAL(15, 2) NOT NULL,
  unit_price_currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  total_price_amount DECIMAL(15, 2) NOT NULL,
  total_price_currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  category billing_schema.item_category,
  service_code VARCHAR(50),
  taxable BOOLEAN NOT NULL DEFAULT true,
  insurance_coverable BOOLEAN NOT NULL DEFAULT true,
  medical_record_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_items_invoice_id ON billing_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_category ON billing_items(category);
CREATE INDEX IF NOT EXISTS idx_billing_items_service_code ON billing_items(service_code);

COMMENT ON TABLE billing_items IS 'Line items for invoices';

-- =====================================================
-- TABLE: payment_records (normalized)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_id VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  method billing_schema.payment_method NOT NULL,
  transaction_id VARCHAR(100),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_by UUID,
  payos_data JSONB,
  payos_order_code BIGINT,
  payos_transaction_id VARCHAR(100),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_invoice_id ON payment_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_id ON payment_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_method ON payment_records(method);
CREATE INDEX IF NOT EXISTS idx_payment_records_payos_order_code ON payment_records(payos_order_code);

COMMENT ON TABLE payment_records IS 'Payment transactions';

-- =====================================================
-- TABLE: insurance_claims (normalized)
-- =====================================================

CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  claim_id VARCHAR(50) UNIQUE NOT NULL,
  claim_number VARCHAR(50) UNIQUE,
  insurance_type billing_schema.insurance_type NOT NULL,
  insurance_number VARCHAR(50) NOT NULL,
  insurance_data JSONB,
  claim_amount DECIMAL(15, 2) NOT NULL,
  approved_amount DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  status billing_schema.claim_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_invoice_id ON insurance_claims(invoice_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_claim_id ON insurance_claims(claim_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);

COMMENT ON TABLE insurance_claims IS 'Insurance claims for invoices';

-- =====================================================
-- TABLE: invoice_sequences (for invoice number generation)
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

CREATE INDEX IF NOT EXISTS idx_invoice_sequences_year_month ON invoice_sequences(year, month);

COMMENT ON TABLE invoice_sequences IS 'Invoice sequence number tracking by year/month';

-- =====================================================
-- UPDATE invoices indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_id ON invoices(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vietnamese_number ON invoices(vietnamese_invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment_id ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_doctor_id ON invoices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_medical_record_id ON invoices(medical_record_id);

-- =====================================================
-- UPDATED COMMENTS
-- =====================================================

COMMENT ON TABLE invoices IS 'Main invoice aggregate root';
COMMENT ON COLUMN invoices.appointment_id IS 'Foreign key to appointments_schema.appointments.appointment_id (VARCHAR format like 2025-APT-202511-901)';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON billing_items TO service_role;
GRANT ALL ON payment_records TO service_role;
GRANT ALL ON insurance_claims TO service_role;
GRANT ALL ON invoice_sequences TO service_role;
GRANT USAGE, SELECT ON SEQUENCE invoice_sequences_id_seq TO service_role;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for backend services)
CREATE POLICY "Service role full access on invoices" ON invoices FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on billing_items" ON billing_items FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on payment_records" ON payment_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on insurance_claims" ON insurance_claims FOR ALL TO service_role USING (true);

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002: Normalize Billing Schema completed successfully';
  RAISE NOTICE '   - invoices table updated to match production schema';
  RAISE NOTICE '   - billing_items table created (normalized)';
  RAISE NOTICE '   - payment_records table created (normalized)';
  RAISE NOTICE '   - insurance_claims table created (normalized)';
  RAISE NOTICE '   - invoice_sequences table created';
  RAISE NOTICE '   - All ENUMs created';
  RAISE NOTICE '   - RLS policies enabled';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================