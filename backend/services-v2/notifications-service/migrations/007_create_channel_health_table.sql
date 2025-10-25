-- =====================================================
-- Notifications Service - Channel Health Monitoring
-- =====================================================
-- Purpose: Monitor health status of delivery channels
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications_schema.channel_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'VOICE')),
  
  -- Health Status
  is_healthy BOOLEAN NOT NULL DEFAULT TRUE,
  health_status TEXT NOT NULL DEFAULT 'HEALTHY' CHECK (health_status IN ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'DOWN')),
  
  -- Metrics (last 24h)
  success_rate DECIMAL(5,2),
  avg_delivery_time_ms INTEGER,
  total_sent_24h BIGINT DEFAULT 0,
  total_failed_24h BIGINT DEFAULT 0,
  
  -- Rate Limiting
  current_load INTEGER DEFAULT 0,
  max_capacity INTEGER DEFAULT 10000,
  rate_limit_max_requests INTEGER DEFAULT 1000,
  rate_limit_window_ms INTEGER DEFAULT 60000,
  rate_limit_remaining INTEGER,
  rate_limit_reset_at TIMESTAMPTZ,
  
  -- Provider Status
  provider_id TEXT,
  provider_status TEXT,
  provider_last_check_at TIMESTAMPTZ,
  
  -- Last Events
  last_successful_delivery TIMESTAMPTZ,
  last_failure TIMESTAMPTZ,
  last_error_message TEXT,
  
  -- Alerts
  alert_threshold_failure_rate DECIMAL(5,2) DEFAULT 10.00,
  alert_threshold_avg_time_ms INTEGER DEFAULT 5000,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  paused_at TIMESTAMPTZ,
  paused_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_channel UNIQUE (channel)
);

CREATE INDEX idx_channel_health_channel ON notifications_schema.channel_health(channel);
CREATE INDEX idx_channel_health_status ON notifications_schema.channel_health(health_status);
CREATE INDEX idx_channel_health_paused ON notifications_schema.channel_health(is_paused) WHERE is_paused = TRUE;

ALTER TABLE notifications_schema.channel_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to channel health"
  ON notifications_schema.channel_health
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Initialize default channels
INSERT INTO notifications_schema.channel_health (channel, provider_id) VALUES
  ('EMAIL', 'sendgrid'),
  ('SMS', 'twilio'),
  ('PUSH', 'firebase'),
  ('IN_APP', 'internal'),
  ('VOICE', 'twilio')
ON CONFLICT (channel) DO NOTHING;

COMMENT ON TABLE notifications_schema.channel_health IS 
'Real-time health monitoring for notification channels';

