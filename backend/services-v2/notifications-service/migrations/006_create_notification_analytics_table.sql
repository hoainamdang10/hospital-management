-- =====================================================
-- Notifications Service - Notification Analytics
-- =====================================================
-- Purpose: Store aggregated analytics data
-- Compliance: Performance monitoring, business intelligence
-- =====================================================

-- Create notification analytics table
CREATE TABLE IF NOT EXISTS notifications_schema.notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time Dimension
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour < 24),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week < 7), -- 0 = Sunday
  
  -- Dimensions
  channel TEXT CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'VOICE', 'ALL')),
  template_type TEXT,
  recipient_type TEXT CHECK (recipient_type IN ('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'STAFF', 'ALL')),
  priority TEXT CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'ALL')),
  status TEXT CHECK (status IN ('SENT', 'DELIVERED', 'FAILED', 'ALL')),
  
  -- Metrics
  total_sent BIGINT NOT NULL DEFAULT 0,
  total_delivered BIGINT NOT NULL DEFAULT 0,
  total_failed BIGINT NOT NULL DEFAULT 0,
  total_bounced BIGINT NOT NULL DEFAULT 0,
  total_cancelled BIGINT NOT NULL DEFAULT 0,
  
  -- Rates
  delivery_rate DECIMAL(5,2),
  failure_rate DECIMAL(5,2),
  bounce_rate DECIMAL(5,2),
  
  -- Performance
  avg_delivery_time_ms INTEGER,
  min_delivery_time_ms INTEGER,
  max_delivery_time_ms INTEGER,
  p50_delivery_time_ms INTEGER,
  p95_delivery_time_ms INTEGER,
  p99_delivery_time_ms INTEGER,
  
  -- Costs
  total_cost DECIMAL(10,2),
  avg_cost_per_notification DECIMAL(10,4),
  
  -- Engagement (for email/push)
  total_opened BIGINT DEFAULT 0,
  total_clicked BIGINT DEFAULT 0,
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_analytics_dimensions UNIQUE (date, hour, channel, template_type, recipient_type, priority, status)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_analytics_date ON notifications_schema.notification_analytics(date DESC);
CREATE INDEX idx_analytics_date_hour ON notifications_schema.notification_analytics(date DESC, hour);
CREATE INDEX idx_analytics_channel ON notifications_schema.notification_analytics(channel);
CREATE INDEX idx_analytics_template_type ON notifications_schema.notification_analytics(template_type);
CREATE INDEX idx_analytics_recipient_type ON notifications_schema.notification_analytics(recipient_type);

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE notifications_schema.notification_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to analytics"
  ON notifications_schema.notification_analytics
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- Aggregation Function
-- =====================================================

CREATE OR REPLACE FUNCTION notifications_schema.aggregate_analytics(
  p_date DATE DEFAULT CURRENT_DATE - 1
)
RETURNS VOID AS $$
BEGIN
  -- Aggregate by hour, channel, template_type
  INSERT INTO notifications_schema.notification_analytics (
    date, hour, channel, template_type, recipient_type, priority, status,
    total_sent, total_delivered, total_failed,
    delivery_rate, avg_delivery_time_ms, total_cost
  )
  SELECT 
    DATE(n.created_at) AS date,
    EXTRACT(HOUR FROM n.created_at)::INTEGER AS hour,
    COALESCE(dr.channel, 'ALL') AS channel,
    n.template_type,
    n.recipient_type,
    n.priority,
    COALESCE(dr.status, 'ALL') AS status,
    COUNT(*) AS total_sent,
    COUNT(*) FILTER (WHERE dr.status = 'DELIVERED') AS total_delivered,
    COUNT(*) FILTER (WHERE dr.status = 'FAILED') AS total_failed,
    ROUND((COUNT(*) FILTER (WHERE dr.status = 'DELIVERED')::DECIMAL / NULLIF(COUNT(*), 0) * 100), 2) AS delivery_rate,
    AVG(dr.delivery_time_ms)::INTEGER AS avg_delivery_time_ms,
    SUM(dr.cost_amount)::DECIMAL(10,2) AS total_cost
  FROM notifications_schema.notifications n
  LEFT JOIN notifications_schema.notification_delivery_results dr ON n.notification_id = dr.notification_id
  WHERE DATE(n.created_at) = p_date
  GROUP BY date, hour, channel, n.template_type, n.recipient_type, n.priority, status
  ON CONFLICT (date, hour, channel, template_type, recipient_type, priority, status)
  DO UPDATE SET
    total_sent = EXCLUDED.total_sent,
    total_delivered = EXCLUDED.total_delivered,
    total_failed = EXCLUDED.total_failed,
    delivery_rate = EXCLUDED.delivery_rate,
    avg_delivery_time_ms = EXCLUDED.avg_delivery_time_ms,
    total_cost = EXCLUDED.total_cost,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION notifications_schema.aggregate_analytics TO service_role;

COMMENT ON TABLE notifications_schema.notification_analytics IS 
'Aggregated analytics for notifications. Updated daily via aggregate_analytics()';

