/**
 * Migration: Create User Flags Table
 * Purpose: Store user account flags for fraud detection, abuse prevention, etc.
 * 
 * This table tracks various flags on user accounts triggered by events from
 * other services (e.g., payment fraud, appointment no-shows, etc.)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Security Monitoring
 */

-- Create user_flags table in auth_schema
CREATE TABLE IF NOT EXISTS auth_schema.user_flags (
  -- Primary key
  flag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL,
  
  -- Flag details
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'PAYMENT_FRAUD_RISK',
    'FREQUENT_NO_SHOW',
    'PAYMENT_OVERDUE',
    'SUSPICIOUS_ACTIVITY',
    'HIGH_RISK_PATIENT',
    'CREDENTIAL_EXPIRED',
    'CONTACT_INFO_INVALID',
    'ACCOUNT_REVIEW_REQUIRED'
  )),
  
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  -- Flag status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  flagged_by TEXT NOT NULL, -- 'SYSTEM_AUTO' or user ID
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Source event
  source_event_id TEXT,
  source_service TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_flags_user_id ON auth_schema.user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_active ON auth_schema.user_flags(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_flags_type ON auth_schema.user_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_user_flags_severity ON auth_schema.user_flags(severity);

-- Create updated_at trigger
CREATE TRIGGER trigger_update_user_flags_updated_at
  BEFORE UPDATE ON auth_schema.user_flags
  FOR EACH ROW
  EXECUTE FUNCTION auth_schema.update_event_inbox_updated_at();

-- Add comments
COMMENT ON TABLE auth_schema.user_flags IS 'User account flags for fraud detection, abuse prevention, and risk management';
COMMENT ON COLUMN auth_schema.user_flags.flag_type IS 'Type of flag: PAYMENT_FRAUD_RISK, FREQUENT_NO_SHOW, etc.';
COMMENT ON COLUMN auth_schema.user_flags.severity IS 'Flag severity: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN auth_schema.user_flags.metadata IS 'Additional context (e.g., failure count, invoice ID, etc.)';

-- Enable RLS
ALTER TABLE auth_schema.user_flags ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY user_flags_service_role_policy ON auth_schema.user_flags
  FOR ALL
  USING (true)
  WITH CHECK (true);
