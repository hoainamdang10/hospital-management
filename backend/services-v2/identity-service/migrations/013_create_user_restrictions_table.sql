/**
 * Migration: Create User Restrictions Table
 * Purpose: Store user account restrictions (booking limits, deposit requirements, etc.)
 * 
 * This table tracks restrictions applied to user accounts based on behavior
 * patterns detected by event handlers (e.g., frequent no-shows, payment issues)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Business Rules, Abuse Prevention
 */

-- Create user_restrictions table in auth_schema
CREATE TABLE IF NOT EXISTS auth_schema.user_restrictions (
  -- Primary key
  restriction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL,
  
  -- Restriction type
  restriction_type TEXT NOT NULL CHECK (restriction_type IN (
    'REQUIRE_DEPOSIT_FOR_BOOKING',
    'MAX_ADVANCE_BOOKING_DAYS',
    'MAX_CONCURRENT_BOOKINGS',
    'BOOKING_DISABLED',
    'PAYMENT_REQUIRED',
    'ACCOUNT_SUSPENDED'
  )),
  
  -- Restriction value (JSON for flexibility)
  restriction_value JSONB NOT NULL,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  applied_by TEXT NOT NULL, -- 'SYSTEM_AUTO' or user ID
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Removal
  removed_at TIMESTAMPTZ,
  removed_by UUID,
  removal_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Source
  source_event_id TEXT,
  source_service TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_restrictions_user_id ON auth_schema.user_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_active ON auth_schema.user_restrictions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_restrictions_type ON auth_schema.user_restrictions(restriction_type);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_expires ON auth_schema.user_restrictions(expires_at) WHERE expires_at IS NOT NULL;

-- Create updated_at trigger
CREATE TRIGGER trigger_update_user_restrictions_updated_at
  BEFORE UPDATE ON auth_schema.user_restrictions
  FOR EACH ROW
  EXECUTE FUNCTION auth_schema.update_event_inbox_updated_at();

-- Add comments
COMMENT ON TABLE auth_schema.user_restrictions IS 'User account restrictions for abuse prevention and business rule enforcement';
COMMENT ON COLUMN auth_schema.user_restrictions.restriction_type IS 'Type of restriction applied to user account';
COMMENT ON COLUMN auth_schema.user_restrictions.restriction_value IS 'Restriction configuration (e.g., {"maxDays": 7, "requireDeposit": true})';
COMMENT ON COLUMN auth_schema.user_restrictions.expires_at IS 'When restriction automatically expires (NULL = permanent)';

-- Enable RLS
ALTER TABLE auth_schema.user_restrictions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY user_restrictions_service_role_policy ON auth_schema.user_restrictions
  FOR ALL
  USING (true)
  WITH CHECK (true);
