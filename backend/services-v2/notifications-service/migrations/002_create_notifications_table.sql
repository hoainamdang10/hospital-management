-- =====================================================
-- Notifications Service - Main Notifications Table
-- =====================================================
-- Purpose: Store all notification records
-- Compliance: HIPAA, Vietnamese Healthcare Standards
-- =====================================================

-- =====================================================
-- Enable Required Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Create Main Notifications Table
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications_schema.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Identifier
  notification_id TEXT NOT NULL UNIQUE,
  
  -- Recipient Information
  recipient_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'FAMILY', 'STAFF')),
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  
  -- Template & Content
  template_type TEXT NOT NULL,
  template_id TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  html_body TEXT,
  
  -- Channel Configuration
  channels JSONB NOT NULL DEFAULT '[]'::JSONB, -- ['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'VOICE']
  
  -- Status & Priority
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'DRAFT',
    'PENDING',
    'SCHEDULED',
    'PROCESSING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'CANCELLED',
    'EXPIRED'
  )),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Delivery Results Summary
  delivery_results JSONB DEFAULT '[]'::JSONB, -- Array of {channel, success, status, deliveredAt, failureReason}
  successful_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  failed_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Retry Management
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  -- Healthcare Context (HIPAA Compliance)
  healthcare_context JSONB DEFAULT '{}'::JSONB, -- {patientId, doctorId, appointmentId, medicalRecordId, invoiceId}
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB, -- {correlationId, userId, sessionId, source, tags}
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  
  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Primary lookup indexes
CREATE INDEX idx_notifications_notification_id ON notifications_schema.notifications(notification_id);
CREATE INDEX idx_notifications_recipient_id ON notifications_schema.notifications(recipient_id);
CREATE INDEX idx_notifications_recipient_type ON notifications_schema.notifications(recipient_type);

-- Status and priority queries
CREATE INDEX idx_notifications_status ON notifications_schema.notifications(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_notifications_priority ON notifications_schema.notifications(priority) WHERE is_deleted = FALSE;
CREATE INDEX idx_notifications_status_priority ON notifications_schema.notifications(status, priority) WHERE is_deleted = FALSE;

-- Scheduling queries
CREATE INDEX idx_notifications_scheduled_pending ON notifications_schema.notifications(scheduled_at)
WHERE status = 'SCHEDULED' AND is_deleted = FALSE;

CREATE INDEX idx_notifications_retry_pending ON notifications_schema.notifications(next_retry_at)
WHERE status = 'FAILED' AND retry_count < max_retries AND is_deleted = FALSE;

-- Template queries
CREATE INDEX idx_notifications_template_type ON notifications_schema.notifications(template_type);

-- Date range queries
CREATE INDEX idx_notifications_created_at ON notifications_schema.notifications(created_at DESC);
CREATE INDEX idx_notifications_sent_at ON notifications_schema.notifications(sent_at DESC);

-- Healthcare context queries (JSONB GIN index)
CREATE INDEX idx_notifications_healthcare_context ON notifications_schema.notifications USING GIN (healthcare_context);

-- Metadata queries (JSONB GIN index)
CREATE INDEX idx_notifications_metadata ON notifications_schema.notifications USING GIN (metadata);

-- Composite index for common queries
CREATE INDEX idx_notifications_recipient_status_created ON notifications_schema.notifications(
  recipient_id, status, created_at DESC
) WHERE is_deleted = FALSE;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE notifications_schema.notifications ENABLE ROW LEVEL SECURITY;

-- Service role has full access
-- NOTE: Notifications service is an internal service accessed only via service_role
-- Users get notifications through API Gateway with proper authentication
CREATE POLICY "Service role has full access to notifications"
  ON notifications_schema.notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Trigger for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION notifications_schema.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications_schema.notifications
  FOR EACH ROW
  EXECUTE FUNCTION notifications_schema.update_notifications_updated_at();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to mark notification as sent
CREATE OR REPLACE FUNCTION notifications_schema.mark_notification_as_sent(
  p_notification_id TEXT,
  p_delivery_results JSONB
)
RETURNS VOID AS $$
DECLARE
  v_successful_channels TEXT[];
  v_failed_channels TEXT[];
BEGIN
  -- Extract successful and failed channels
  SELECT 
    ARRAY_AGG(r->>'channel') FILTER (WHERE (r->>'success')::BOOLEAN = TRUE),
    ARRAY_AGG(r->>'channel') FILTER (WHERE (r->>'success')::BOOLEAN = FALSE)
  INTO v_successful_channels, v_failed_channels
  FROM jsonb_array_elements(p_delivery_results) AS r;
  
  -- Update notification
  UPDATE notifications_schema.notifications
  SET 
    status = CASE 
      WHEN CARDINALITY(v_successful_channels) > 0 THEN 'SENT'
      ELSE 'FAILED'
    END,
    sent_at = NOW(),
    delivery_results = p_delivery_results,
    successful_channels = COALESCE(v_successful_channels, ARRAY[]::TEXT[]),
    failed_channels = COALESCE(v_failed_channels, ARRAY[]::TEXT[]),
    updated_at = NOW()
  WHERE notification_id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as failed
CREATE OR REPLACE FUNCTION notifications_schema.mark_notification_as_failed(
  p_notification_id TEXT,
  p_delivery_results JSONB,
  p_should_retry BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
DECLARE
  v_notification RECORD;
  v_next_retry_delay INTERVAL;
BEGIN
  SELECT retry_count, max_retries INTO v_notification
  FROM notifications_schema.notifications
  WHERE notification_id = p_notification_id;
  
  -- Calculate exponential backoff: 2^retry_count minutes
  v_next_retry_delay = (POWER(2, v_notification.retry_count) || ' minutes')::INTERVAL;
  
  UPDATE notifications_schema.notifications
  SET 
    status = 'FAILED',
    delivery_results = p_delivery_results,
    retry_count = retry_count + 1,
    last_retry_at = NOW(),
    next_retry_at = CASE 
      WHEN p_should_retry AND retry_count < max_retries 
      THEN NOW() + v_next_retry_delay
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE notification_id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get notifications due for retry
CREATE OR REPLACE FUNCTION notifications_schema.get_notifications_for_retry(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  notification_id TEXT,
  recipient_id TEXT,
  template_type TEXT,
  channels JSONB,
  retry_count INTEGER,
  last_retry_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.notification_id,
    n.recipient_id,
    n.template_type,
    n.channels,
    n.retry_count,
    n.last_retry_at
  FROM notifications_schema.notifications n
  WHERE 
    n.status = 'FAILED'
    AND n.retry_count < n.max_retries
    AND n.next_retry_at IS NOT NULL
    AND n.next_retry_at <= NOW()
    AND n.is_deleted = FALSE
  ORDER BY n.priority DESC, n.next_retry_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get scheduled notifications due for sending
CREATE OR REPLACE FUNCTION notifications_schema.get_scheduled_notifications_due(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  notification_id TEXT,
  recipient_id TEXT,
  template_type TEXT,
  channels JSONB,
  priority TEXT,
  scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.notification_id,
    n.recipient_id,
    n.template_type,
    n.channels,
    n.priority,
    n.scheduled_at
  FROM notifications_schema.notifications n
  WHERE 
    n.status = 'SCHEDULED'
    AND n.scheduled_at <= NOW()
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND n.is_deleted = FALSE
  ORDER BY n.priority DESC, n.scheduled_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old notifications
CREATE OR REPLACE FUNCTION notifications_schema.cleanup_old_notifications(
  p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    UPDATE notifications_schema.notifications
    SET 
      is_deleted = TRUE,
      deleted_at = NOW(),
      deleted_by = 'system'
    WHERE 
      created_at < NOW() - (p_days_old || ' days')::INTERVAL
      AND status IN ('SENT', 'DELIVERED', 'FAILED', 'EXPIRED', 'CANCELLED')
      AND is_deleted = FALSE
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON notifications_schema.notifications TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.mark_notification_as_sent TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.mark_notification_as_failed TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.get_notifications_for_retry TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.get_scheduled_notifications_due TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.cleanup_old_notifications TO service_role;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE notifications_schema.notifications IS 
'Main notifications table. Stores all notification records with delivery tracking and retry management.';

COMMENT ON COLUMN notifications_schema.notifications.notification_id IS 
'Unique business identifier for the notification';

COMMENT ON COLUMN notifications_schema.notifications.healthcare_context IS 
'HIPAA-compliant healthcare context (patientId, doctorId, appointmentId, etc.)';

COMMENT ON FUNCTION notifications_schema.mark_notification_as_sent IS 
'Mark notification as sent with delivery results';

COMMENT ON FUNCTION notifications_schema.mark_notification_as_failed IS 
'Mark notification as failed and schedule retry with exponential backoff';

COMMENT ON FUNCTION notifications_schema.get_notifications_for_retry IS 
'Get notifications that are due for retry (failed with retry_count < max_retries)';

COMMENT ON FUNCTION notifications_schema.get_scheduled_notifications_due IS 
'Get scheduled notifications that are due for sending';

COMMENT ON FUNCTION notifications_schema.cleanup_old_notifications IS 
'Soft delete old notifications (default: 90 days old)';

