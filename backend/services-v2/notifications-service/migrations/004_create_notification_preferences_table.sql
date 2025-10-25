-- =====================================================
-- Notifications Service - User Notification Preferences
-- =====================================================
-- Purpose: Store user preferences for notifications
-- Compliance: GDPR, HIPAA opt-out requirements
-- =====================================================

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notifications_schema.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Identifier
  user_id TEXT NOT NULL UNIQUE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'STAFF')),
  
  -- Contact Information
  email TEXT,
  phone_number TEXT,
  push_token TEXT,
  
  -- Preferred Channels
  preferred_channels TEXT[] NOT NULL DEFAULT ARRAY['EMAIL']::TEXT[],
  enabled_channels TEXT[] NOT NULL DEFAULT ARRAY['EMAIL', 'SMS', 'PUSH', 'IN_APP']::TEXT[],
  disabled_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Channel-specific settings
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  voice_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Opt-out Settings (GDPR Compliance)
  opt_out_all BOOLEAN NOT NULL DEFAULT FALSE,
  opt_out_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  opt_out_reminders BOOLEAN NOT NULL DEFAULT FALSE,
  opt_out_emergency BOOLEAN NOT NULL DEFAULT FALSE, -- Cannot opt-out for true emergencies
  opt_out_transactional BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Category Preferences
  appointment_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  billing_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  medical_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  emergency_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  promotional_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Language & Timezone
  preferred_language TEXT NOT NULL DEFAULT 'vi' CHECK (preferred_language IN ('vi', 'en')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  
  -- Quiet Hours (Do Not Disturb)
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME,   -- e.g., '07:00'
  quiet_hours_exceptions TEXT[] DEFAULT ARRAY['URGENT', 'EMERGENCY']::TEXT[], -- Always send these
  
  -- Frequency Limits (Rate Limiting)
  max_notifications_per_day INTEGER,
  max_notifications_per_hour INTEGER,
  max_sms_per_day INTEGER DEFAULT 5,
  max_emails_per_day INTEGER DEFAULT 20,
  
  -- Delivery Preferences
  batch_notifications BOOLEAN NOT NULL DEFAULT FALSE, -- Combine notifications
  immediate_delivery BOOLEAN NOT NULL DEFAULT TRUE,
  digest_frequency TEXT CHECK (digest_frequency IN ('NONE', 'HOURLY', 'DAILY', 'WEEKLY')),
  digest_time TIME, -- e.g., '09:00' for daily digest
  
  -- Channel Priority (for multi-channel delivery)
  channel_priority JSONB DEFAULT '[
    {"channel": "PUSH", "priority": 1},
    {"channel": "SMS", "priority": 2},
    {"channel": "EMAIL", "priority": 3},
    {"channel": "IN_APP", "priority": 4}
  ]'::JSONB,
  
  -- Template Preferences
  preferred_template_version TEXT,
  custom_templates JSONB DEFAULT '{}'::JSONB,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notification_at TIMESTAMPTZ,
  
  -- Soft Delete
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Primary lookup
CREATE INDEX idx_preferences_user_id ON notifications_schema.notification_preferences(user_id);
CREATE INDEX idx_preferences_recipient_type ON notifications_schema.notification_preferences(recipient_type);

-- Active preferences
CREATE INDEX idx_preferences_active ON notifications_schema.notification_preferences(is_active)
WHERE is_active = TRUE;

-- Opt-out queries
CREATE INDEX idx_preferences_opt_out_all ON notifications_schema.notification_preferences(opt_out_all)
WHERE opt_out_all = TRUE;

-- Channel queries
CREATE INDEX idx_preferences_enabled_channels ON notifications_schema.notification_preferences USING GIN (enabled_channels);

-- Language queries
CREATE INDEX idx_preferences_language ON notifications_schema.notification_preferences(preferred_language);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE notifications_schema.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Service role has full access
-- NOTE: Preference management is done through API Gateway with service authentication
CREATE POLICY "Service role has full access to preferences"
  ON notifications_schema.notification_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Trigger for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION notifications_schema.update_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_preferences_updated_at
  BEFORE UPDATE ON notifications_schema.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION notifications_schema.update_preferences_updated_at();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to check if user can receive notification
CREATE OR REPLACE FUNCTION notifications_schema.can_user_receive_notification(
  p_user_id TEXT,
  p_channel TEXT,
  p_category TEXT,
  p_priority TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_prefs RECORD;
  v_current_time TIME;
  v_can_receive BOOLEAN;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM notifications_schema.notification_preferences
  WHERE user_id = p_user_id AND is_active = TRUE;
  
  -- If no preferences found, allow by default
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  -- Check global opt-out
  IF v_prefs.opt_out_all THEN
    -- Emergency notifications bypass opt-out
    IF p_priority = 'URGENT' OR p_category = 'emergency' THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;
  
  -- Check channel enabled
  IF p_channel = 'EMAIL' AND NOT v_prefs.email_enabled THEN
    RETURN FALSE;
  ELSIF p_channel = 'SMS' AND NOT v_prefs.sms_enabled THEN
    RETURN FALSE;
  ELSIF p_channel = 'PUSH' AND NOT v_prefs.push_enabled THEN
    RETURN FALSE;
  ELSIF p_channel = 'IN_APP' AND NOT v_prefs.in_app_enabled THEN
    RETURN FALSE;
  ELSIF p_channel = 'VOICE' AND NOT v_prefs.voice_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Check category preferences
  IF p_category = 'appointment' AND NOT v_prefs.appointment_notifications THEN
    RETURN FALSE;
  ELSIF p_category = 'billing' AND NOT v_prefs.billing_notifications THEN
    RETURN FALSE;
  ELSIF p_category = 'medical' AND NOT v_prefs.medical_notifications THEN
    RETURN FALSE;
  ELSIF p_category = 'promotional' AND NOT v_prefs.promotional_notifications THEN
    RETURN FALSE;
  END IF;
  
  -- Check quiet hours
  IF v_prefs.quiet_hours_enabled THEN
    v_current_time = CURRENT_TIME;
    
    -- Check if priority bypasses quiet hours
    IF p_priority = ANY(v_prefs.quiet_hours_exceptions) THEN
      RETURN TRUE;
    END IF;
    
    -- Check if current time is in quiet hours
    IF v_prefs.quiet_hours_start <= v_prefs.quiet_hours_end THEN
      -- Same-day range (e.g., 09:00 - 17:00)
      IF v_current_time >= v_prefs.quiet_hours_start AND v_current_time < v_prefs.quiet_hours_end THEN
        RETURN FALSE;
      END IF;
    ELSE
      -- Overnight range (e.g., 22:00 - 07:00 next day)
      IF v_current_time >= v_prefs.quiet_hours_start OR v_current_time < v_prefs.quiet_hours_end THEN
        RETURN FALSE;
      END IF;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's preferred channels
CREATE OR REPLACE FUNCTION notifications_schema.get_user_preferred_channels(
  p_user_id TEXT
)
RETURNS TEXT[] AS $$
DECLARE
  v_channels TEXT[];
BEGIN
  SELECT preferred_channels INTO v_channels
  FROM notifications_schema.notification_preferences
  WHERE user_id = p_user_id AND is_active = TRUE;
  
  -- Default to EMAIL if no preferences
  RETURN COALESCE(v_channels, ARRAY['EMAIL']::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- Function to create default preferences for new user
CREATE OR REPLACE FUNCTION notifications_schema.create_default_preferences(
  p_user_id TEXT,
  p_recipient_type TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_pref_id UUID;
BEGIN
  INSERT INTO notifications_schema.notification_preferences (
    user_id,
    recipient_type,
    email,
    phone_number,
    preferred_channels,
    enabled_channels,
    preferred_language,
    timezone
  ) VALUES (
    p_user_id,
    p_recipient_type,
    p_email,
    p_phone_number,
    ARRAY['EMAIL', 'SMS']::TEXT[],
    ARRAY['EMAIL', 'SMS', 'PUSH', 'IN_APP']::TEXT[],
    'vi',
    'Asia/Ho_Chi_Minh'
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_pref_id;
  
  RETURN v_pref_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update last notification timestamp
CREATE OR REPLACE FUNCTION notifications_schema.update_last_notification_timestamp(
  p_user_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications_schema.notification_preferences
  SET 
    last_notification_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION notifications_schema.check_rate_limit(
  p_user_id TEXT,
  p_channel TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_prefs RECORD;
  v_count_today INTEGER;
  v_count_hour INTEGER;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM notifications_schema.notification_preferences
  WHERE user_id = p_user_id AND is_active = TRUE;
  
  -- If no preferences, no limit
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  -- Count notifications sent today
  SELECT COUNT(*) INTO v_count_today
  FROM notifications_schema.notifications
  WHERE 
    recipient_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND status IN ('SENT', 'DELIVERED');
  
  -- Check daily limit
  IF v_prefs.max_notifications_per_day IS NOT NULL 
     AND v_count_today >= v_prefs.max_notifications_per_day THEN
    RETURN FALSE;
  END IF;
  
  -- Count notifications sent in last hour
  SELECT COUNT(*) INTO v_count_hour
  FROM notifications_schema.notifications
  WHERE 
    recipient_id = p_user_id
    AND created_at >= NOW() - INTERVAL '1 hour'
    AND status IN ('SENT', 'DELIVERED');
  
  -- Check hourly limit
  IF v_prefs.max_notifications_per_hour IS NOT NULL 
     AND v_count_hour >= v_prefs.max_notifications_per_hour THEN
    RETURN FALSE;
  END IF;
  
  -- Check channel-specific limits
  IF p_channel = 'SMS' AND v_prefs.max_sms_per_day IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count_today
    FROM notifications_schema.notifications
    WHERE 
      recipient_id = p_user_id
      AND created_at >= CURRENT_DATE
      AND 'SMS' = ANY(successful_channels)
      AND status IN ('SENT', 'DELIVERED');
    
    IF v_count_today >= v_prefs.max_sms_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  IF p_channel = 'EMAIL' AND v_prefs.max_emails_per_day IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count_today
    FROM notifications_schema.notifications
    WHERE 
      recipient_id = p_user_id
      AND created_at >= CURRENT_DATE
      AND 'EMAIL' = ANY(successful_channels)
      AND status IN ('SENT', 'DELIVERED');
    
    IF v_count_today >= v_prefs.max_emails_per_day THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON notifications_schema.notification_preferences TO service_role;
GRANT SELECT, UPDATE ON notifications_schema.notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION notifications_schema.can_user_receive_notification TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.get_user_preferred_channels TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.create_default_preferences TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.update_last_notification_timestamp TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.check_rate_limit TO service_role;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE notifications_schema.notification_preferences IS 
'User notification preferences. GDPR-compliant with opt-out support and quiet hours.';

COMMENT ON COLUMN notifications_schema.notification_preferences.opt_out_emergency IS 
'Cannot fully opt-out of true emergency notifications (URGENT priority)';

COMMENT ON COLUMN notifications_schema.notification_preferences.quiet_hours_enabled IS 
'Do Not Disturb mode - respects quiet_hours_exceptions for urgent notifications';

COMMENT ON FUNCTION notifications_schema.can_user_receive_notification IS 
'Check if user can receive notification based on preferences, opt-outs, quiet hours, and rate limits';

COMMENT ON FUNCTION notifications_schema.check_rate_limit IS 
'Check if sending notification would exceed user rate limits (daily, hourly, per-channel)';

COMMENT ON FUNCTION notifications_schema.get_user_preferred_channels IS 
'Get user preferred channels array. Returns [EMAIL] as default if no preferences found.';

COMMENT ON FUNCTION notifications_schema.create_default_preferences IS 
'Create default notification preferences for new user. Returns preference UUID on success.';

