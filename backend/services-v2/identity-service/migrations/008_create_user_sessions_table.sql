-- Migration: Create user_sessions table
-- Description: Create table to track user login sessions
-- Author: Hospital Management Team
-- Date: 2025-10-07

-- Create user_sessions table in auth_schema
CREATE TABLE IF NOT EXISTS auth_schema.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON auth_schema.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON auth_schema.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON auth_schema.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON auth_schema.user_sessions(is_active);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON auth_schema.user_sessions(user_id, is_active);

-- Add RLS policies
ALTER TABLE auth_schema.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY user_sessions_select_own ON auth_schema.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything
CREATE POLICY user_sessions_service_role ON auth_schema.user_sessions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add comment
COMMENT ON TABLE auth_schema.user_sessions IS 'Stores user login sessions for session management';
COMMENT ON COLUMN auth_schema.user_sessions.session_token IS 'JWT access token from Supabase';
COMMENT ON COLUMN auth_schema.user_sessions.device_info IS 'Device information (browser, OS, etc.)';
COMMENT ON COLUMN auth_schema.user_sessions.expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN auth_schema.user_sessions.is_active IS 'Whether the session is still active';
COMMENT ON COLUMN auth_schema.user_sessions.last_accessed_at IS 'Last time the session was accessed';

