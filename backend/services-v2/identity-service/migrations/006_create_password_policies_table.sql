-- Migration: Create password_policies table
-- Description: Store password policy configurations with history
-- Author: Hospital Management Team
-- Version: 2.0.0

-- Create password_policies table
CREATE TABLE IF NOT EXISTS auth_schema.password_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Policy settings
  min_length INTEGER NOT NULL DEFAULT 8 CHECK (min_length >= 6 AND min_length <= 128),
  require_uppercase BOOLEAN NOT NULL DEFAULT true,
  require_lowercase BOOLEAN NOT NULL DEFAULT true,
  require_numbers BOOLEAN NOT NULL DEFAULT true,
  require_special_chars BOOLEAN NOT NULL DEFAULT false,
  expiration_days INTEGER CHECK (expiration_days IS NULL OR (expiration_days >= 1 AND expiration_days <= 365)),
  prevent_reuse INTEGER NOT NULL DEFAULT 3 CHECK (prevent_reuse >= 0 AND prevent_reuse <= 24),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(255) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_policy_settings CHECK (
    min_length >= 6 AND
    prevent_reuse >= 0
  )
);

-- Create index on is_active for fast lookup of current policy
CREATE INDEX IF NOT EXISTS idx_password_policies_active 
ON auth_schema.password_policies(is_active, updated_at DESC) 
WHERE is_active = true;

-- Create index on updated_at for history queries
CREATE INDEX IF NOT EXISTS idx_password_policies_updated_at 
ON auth_schema.password_policies(updated_at DESC);

-- Add comment to table
COMMENT ON TABLE auth_schema.password_policies IS 'Password policy configurations with history tracking';

-- Add comments to columns
COMMENT ON COLUMN auth_schema.password_policies.min_length IS 'Minimum password length (6-128 characters)';
COMMENT ON COLUMN auth_schema.password_policies.require_uppercase IS 'Require at least one uppercase letter';
COMMENT ON COLUMN auth_schema.password_policies.require_lowercase IS 'Require at least one lowercase letter';
COMMENT ON COLUMN auth_schema.password_policies.require_numbers IS 'Require at least one number';
COMMENT ON COLUMN auth_schema.password_policies.require_special_chars IS 'Require at least one special character';
COMMENT ON COLUMN auth_schema.password_policies.expiration_days IS 'Password expiration in days (NULL = no expiration)';
COMMENT ON COLUMN auth_schema.password_policies.prevent_reuse IS 'Number of previous passwords that cannot be reused';
COMMENT ON COLUMN auth_schema.password_policies.is_active IS 'Whether this is the currently active policy';
COMMENT ON COLUMN auth_schema.password_policies.updated_by IS 'User ID who last updated this policy';

-- Insert default password policy
INSERT INTO auth_schema.password_policies (
  min_length,
  require_uppercase,
  require_lowercase,
  require_numbers,
  require_special_chars,
  expiration_days,
  prevent_reuse,
  is_active,
  updated_by
) VALUES (
  8,
  true,
  true,
  true,
  false,
  NULL,
  3,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE auth_schema.password_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access to password_policies"
ON auth_schema.password_policies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to read active policy
CREATE POLICY "Authenticated users can read active password policy"
ON auth_schema.password_policies
FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Only admins can update password policies
-- Note: This will be enforced at application level through permission middleware
CREATE POLICY "Only admins can modify password policies"
ON auth_schema.password_policies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth_schema.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth_schema.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name = 'admin'
  )
);

