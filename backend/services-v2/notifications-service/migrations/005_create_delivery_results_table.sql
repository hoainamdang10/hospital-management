-- =====================================================
-- Notifications Service - Notification Delivery Results
-- =====================================================
-- Purpose: Track delivery results per channel
-- Compliance: Delivery tracking, audit trail
-- =====================================================

-- Create delivery results table
CREATE TABLE IF NOT EXISTS notifications_schema.notification_delivery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notification Reference
  notification_id TEXT NOT NULL,
  
  -- Channel Information
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'VOICE')),
  
  -- Delivery Status
  status TEXT NOT NULL CHECK (status IN (
    'PENDING',
    'PROCESSING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'BOUNCED',
    'REJECTED',
    'CANCELLED'
  )),
  
  -- Result Details
  success BOOLEAN NOT NULL DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  failure_reason TEXT,
  error_code TEXT,
  error_message TEXT,
  
  -- Provider Information
  provider_id TEXT, -- 'sendgrid', 'twilio', 'firebase', etc.
  provider_message_id TEXT,
  provider_response JSONB,
  
  -- Performance Metrics
  delivery_time_ms INTEGER, -- Milliseconds to deliver
  queue_time_ms INTEGER, -- Time spent in queue
  processing_time_ms INTEGER, -- Time spent processing
  
  -- Cost Tracking
  cost_amount DECIMAL(10,4),
  cost_currency TEXT DEFAULT 'VND',
  
  -- Retry Information
  is_retry BOOLEAN NOT NULL DEFAULT FALSE,
  retry_attempt INTEGER DEFAULT 0,
  retryable BOOLEAN NOT NULL DEFAULT TRUE,
  next_retry_at TIMESTAMPTZ,
  
  -- Recipient Information (for quick lookup)
  recipient_id TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  
  -- Engagement Tracking (for email/push)
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  clicked_links TEXT[],
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Primary lookups
CREATE INDEX idx_delivery_results_notification_id ON notifications_schema.notification_delivery_results(notification_id);
CREATE INDEX idx_delivery_results_recipient_id ON notifications_schema.notification_delivery_results(recipient_id);

-- Channel queries
CREATE INDEX idx_delivery_results_channel ON notifications_schema.notification_delivery_results(channel);
CREATE INDEX idx_delivery_results_channel_status ON notifications_schema.notification_delivery_results(channel, status);

-- Status queries
CREATE INDEX idx_delivery_results_status ON notifications_schema.notification_delivery_results(status);
CREATE INDEX idx_delivery_results_success ON notifications_schema.notification_delivery_results(success);

-- Failed deliveries for retry
CREATE INDEX idx_delivery_results_retry_pending ON notifications_schema.notification_delivery_results(next_retry_at)
WHERE status = 'FAILED' AND retryable = TRUE AND next_retry_at IS NOT NULL;

-- Provider queries
CREATE INDEX idx_delivery_results_provider_id ON notifications_schema.notification_delivery_results(provider_id);
CREATE INDEX idx_delivery_results_provider_message_id ON notifications_schema.notification_delivery_results(provider_message_id);

-- Performance analysis
CREATE INDEX idx_delivery_results_delivery_time ON notifications_schema.notification_delivery_results(delivery_time_ms);
CREATE INDEX idx_delivery_results_delivered_at ON notifications_schema.notification_delivery_results(delivered_at DESC);

-- Cost tracking
CREATE INDEX idx_delivery_results_cost ON notifications_schema.notification_delivery_results(cost_amount);

-- Date range queries
CREATE INDEX idx_delivery_results_created_at ON notifications_schema.notification_delivery_results(created_at DESC);

-- Composite index for analytics
CREATE INDEX idx_delivery_results_analytics ON notifications_schema.notification_delivery_results(
  channel, status, created_at DESC
);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE notifications_schema.notification_delivery_results ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to delivery results"
  ON notifications_schema.notification_delivery_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Trigger for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION notifications_schema.update_delivery_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delivery_results_updated_at
  BEFORE UPDATE ON notifications_schema.notification_delivery_results
  FOR EACH ROW
  EXECUTE FUNCTION notifications_schema.update_delivery_results_updated_at();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get delivery results for notification
CREATE OR REPLACE FUNCTION notifications_schema.get_delivery_results(
  p_notification_id TEXT
)
RETURNS TABLE (
  channel TEXT,
  status TEXT,
  success BOOLEAN,
  delivered_at TIMESTAMPTZ,
  failure_reason TEXT,
  provider_id TEXT,
  delivery_time_ms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.channel,
    dr.status,
    dr.success,
    dr.delivered_at,
    dr.failure_reason,
    dr.provider_id,
    dr.delivery_time_ms
  FROM notifications_schema.notification_delivery_results dr
  WHERE dr.notification_id = p_notification_id
  ORDER BY dr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get delivery statistics by channel
CREATE OR REPLACE FUNCTION notifications_schema.get_delivery_stats_by_channel(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  channel TEXT,
  total_sent BIGINT,
  total_delivered BIGINT,
  total_failed BIGINT,
  delivery_rate DECIMAL(5,2),
  avg_delivery_time_ms DECIMAL(10,2),
  total_cost DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.channel,
    COUNT(*) AS total_sent,
    COUNT(*) FILTER (WHERE dr.status = 'DELIVERED') AS total_delivered,
    COUNT(*) FILTER (WHERE dr.status = 'FAILED') AS total_failed,
    ROUND(
      (COUNT(*) FILTER (WHERE dr.status = 'DELIVERED')::DECIMAL / NULLIF(COUNT(*), 0) * 100),
      2
    ) AS delivery_rate,
    ROUND(AVG(dr.delivery_time_ms), 2) AS avg_delivery_time_ms,
    ROUND(SUM(dr.cost_amount), 2) AS total_cost
  FROM notifications_schema.notification_delivery_results dr
  WHERE dr.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY dr.channel
  ORDER BY total_sent DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get failed deliveries requiring attention
CREATE OR REPLACE FUNCTION notifications_schema.get_failed_deliveries_for_review(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  notification_id TEXT,
  recipient_id TEXT,
  channel TEXT,
  failure_reason TEXT,
  retry_attempt INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.notification_id,
    dr.recipient_id,
    dr.channel,
    dr.failure_reason,
    dr.retry_attempt,
    dr.created_at
  FROM notifications_schema.notification_delivery_results dr
  WHERE 
    dr.status = 'FAILED'
    AND dr.retryable = FALSE
  ORDER BY dr.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate channel health
CREATE OR REPLACE FUNCTION notifications_schema.calculate_channel_health(
  p_channel TEXT,
  p_lookback_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  channel TEXT,
  is_healthy BOOLEAN,
  success_rate DECIMAL(5,2),
  avg_delivery_time_ms INTEGER,
  total_sent BIGINT,
  last_successful_delivery TIMESTAMPTZ,
  last_failure TIMESTAMPTZ
) AS $$
DECLARE
  v_success_rate DECIMAL(5,2);
  v_is_healthy BOOLEAN;
BEGIN
  -- Calculate success rate
  SELECT 
    ROUND(
      (COUNT(*) FILTER (WHERE dr.success = TRUE)::DECIMAL / NULLIF(COUNT(*), 0) * 100),
      2
    )
  INTO v_success_rate
  FROM notifications_schema.notification_delivery_results dr
  WHERE 
    dr.channel = p_channel
    AND dr.created_at >= NOW() - (p_lookback_hours || ' hours')::INTERVAL;
  
  -- Determine health (>95% success rate = healthy)
  v_is_healthy = COALESCE(v_success_rate, 0) >= 95.0;
  
  RETURN QUERY
  SELECT 
    p_channel AS channel,
    v_is_healthy AS is_healthy,
    COALESCE(v_success_rate, 0.00) AS success_rate,
    COALESCE(
      (SELECT AVG(dr2.delivery_time_ms)::INTEGER
       FROM notifications_schema.notification_delivery_results dr2
       WHERE dr2.channel = p_channel
         AND dr2.created_at >= NOW() - (p_lookback_hours || ' hours')::INTERVAL
         AND dr2.success = TRUE),
      0
    ) AS avg_delivery_time_ms,
    COALESCE(
      (SELECT COUNT(*)
       FROM notifications_schema.notification_delivery_results dr3
       WHERE dr3.channel = p_channel
         AND dr3.created_at >= NOW() - (p_lookback_hours || ' hours')::INTERVAL),
      0
    ) AS total_sent,
    (SELECT MAX(dr4.delivered_at)
     FROM notifications_schema.notification_delivery_results dr4
     WHERE dr4.channel = p_channel AND dr4.success = TRUE
    ) AS last_successful_delivery,
    (SELECT MAX(dr5.created_at)
     FROM notifications_schema.notification_delivery_results dr5
     WHERE dr5.channel = p_channel AND dr5.success = FALSE
    ) AS last_failure;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON notifications_schema.notification_delivery_results TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.get_delivery_results TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.get_delivery_stats_by_channel TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.get_failed_deliveries_for_review TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.calculate_channel_health TO service_role;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE notifications_schema.notification_delivery_results IS 
'Delivery results for each channel. Tracks success/failure, provider responses, performance metrics, and costs.';

COMMENT ON COLUMN notifications_schema.notification_delivery_results.delivery_time_ms IS 
'Total time from send to delivery confirmation (milliseconds)';

COMMENT ON COLUMN notifications_schema.notification_delivery_results.retryable IS 
'Indicates if this failure can be retried (false for permanent failures like invalid email)';

COMMENT ON FUNCTION notifications_schema.calculate_channel_health IS 
'Calculate health metrics for a channel based on recent delivery success rate';

