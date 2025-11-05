-- Migration: Create Payment Plans and Installments Tables
-- Description: Payment plans for installment payments
-- Author: Hospital Management Team
-- Date: 2025-01-11

-- =====================================================
-- PAYMENT PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_schema.payment_plans (
  plan_id VARCHAR(255) PRIMARY KEY,
  invoice_id VARCHAR(255) NOT NULL,
  patient_id VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  down_payment DECIMAL(15, 2) DEFAULT 0,
  remaining_amount DECIMAL(15, 2) NOT NULL,
  number_of_installments INTEGER NOT NULL,
  installment_amount DECIMAL(15, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL, -- monthly, weekly, biweekly
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, defaulted, cancelled, suspended
  terms TEXT,
  notes TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT payment_plans_total_amount_positive CHECK (total_amount > 0),
  CONSTRAINT payment_plans_down_payment_non_negative CHECK (down_payment >= 0),
  CONSTRAINT payment_plans_remaining_amount_non_negative CHECK (remaining_amount >= 0),
  CONSTRAINT payment_plans_installments_positive CHECK (number_of_installments > 0),
  CONSTRAINT payment_plans_installment_amount_positive CHECK (installment_amount > 0),
  CONSTRAINT payment_plans_frequency_valid CHECK (frequency IN ('monthly', 'weekly', 'biweekly')),
  CONSTRAINT payment_plans_status_valid CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled', 'suspended')),
  CONSTRAINT payment_plans_dates_valid CHECK (end_date > start_date)
);

-- =====================================================
-- INSTALLMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_schema.installments (
  installment_id VARCHAR(255) PRIMARY KEY,
  plan_id VARCHAR(255) NOT NULL REFERENCES payment_schema.payment_plans(plan_id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date TIMESTAMP NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  remaining_amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, partial, waived
  payment_method VARCHAR(50), -- cash, bank_transfer, vnpay, momo, zalopay, credit_card
  payment_date TIMESTAMP,
  transaction_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT installments_amount_positive CHECK (amount > 0),
  CONSTRAINT installments_paid_amount_non_negative CHECK (paid_amount >= 0),
  CONSTRAINT installments_remaining_amount_non_negative CHECK (remaining_amount >= 0),
  CONSTRAINT installments_status_valid CHECK (status IN ('pending', 'paid', 'overdue', 'partial', 'waived')),
  CONSTRAINT installments_payment_method_valid CHECK (
    payment_method IS NULL OR 
    payment_method IN ('cash', 'bank_transfer', 'vnpay', 'momo', 'zalopay', 'credit_card')
  ),
  CONSTRAINT installments_unique_number_per_plan UNIQUE (plan_id, installment_number)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payment_plans_invoice_id ON payment_schema.payment_plans(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_patient_id ON payment_schema.payment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_schema.payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_start_date ON payment_schema.payment_plans(start_date);
CREATE INDEX IF NOT EXISTS idx_payment_plans_end_date ON payment_schema.payment_plans(end_date);
CREATE INDEX IF NOT EXISTS idx_payment_plans_created_at ON payment_schema.payment_plans(created_at);

CREATE INDEX IF NOT EXISTS idx_installments_plan_id ON payment_schema.installments(plan_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON payment_schema.installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON payment_schema.installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_payment_date ON payment_schema.installments(payment_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE payment_schema.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schema.installments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY payment_plans_service_role_policy ON payment_schema.payment_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY installments_service_role_policy ON payment_schema.installments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to view their own payment plans
CREATE POLICY payment_plans_patient_view_policy ON payment_schema.payment_plans
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid()::text);

CREATE POLICY installments_patient_view_policy ON payment_schema.installments
  FOR SELECT
  TO authenticated
  USING (
    plan_id IN (
      SELECT plan_id FROM payment_schema.payment_plans WHERE patient_id = auth.uid()::text
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE payment_schema.payment_plans IS 'Payment plans for installment payments';
COMMENT ON TABLE payment_schema.installments IS 'Individual installments for payment plans';

COMMENT ON COLUMN payment_schema.payment_plans.frequency IS 'Payment frequency: monthly, weekly, biweekly';
COMMENT ON COLUMN payment_schema.payment_plans.status IS 'Plan status: active, completed, defaulted, cancelled, suspended';
COMMENT ON COLUMN payment_schema.installments.status IS 'Installment status: pending, paid, overdue, partial, waived';
COMMENT ON COLUMN payment_schema.installments.payment_method IS 'Vietnamese payment methods: cash, bank_transfer, vnpay, momo, zalopay, credit_card';

