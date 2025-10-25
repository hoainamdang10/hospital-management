-- =====================================================
-- Notifications Service - Notification Audit Log
-- =====================================================
-- Purpose: HIPAA-compliant audit trail for notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications_schema.notification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Audit Event
  event_type TEXT NOT NULL CHECK (event_type IN (
    'NOTIFICATION_CREATED',
    'NOTIFICATION_SENT',
    'NOTIFICATION_DELIVERED',
    'NOTIFICATION_FAILED',
    'NOTIFICATION_CANCELLED',
    'NOTIFICATION_VIEWED',
    'NOTIFICATION_CLICKED',
    'PREFERENCES_UPDATED',
    'OPT_OUT',
    'OPT_IN',
    'TEMPLATE_APPLIED',
    'DELIVERY_RETRIED'
  )),
  
  -- References
  notification_id TEXT,
  user_id TEXT,
  
  -- Actor (who performed the action)
  actor_id TEXT,
  actor_type TEXT,
  
  -- Action Details
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  
  -- HIPAA Context
  healthcare_context JSONB, -- {patientId, doctorId, appointmentId, etc.}
  phi_accessed BOOLEAN DEFAULT FALSE, -- Protected Health Information
  
  -- Request Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_notification_id ON notifications_schema.notification_audit_log(notification_id);
CREATE INDEX idx_audit_user_id ON notifications_schema.notification_audit_log(user_id);
CREATE INDEX idx_audit_event_type ON notifications_schema.notification_audit_log(event_type);
CREATE INDEX idx_audit_created_at ON notifications_schema.notification_audit_log(created_at DESC);
CREATE INDEX idx_audit_phi_accessed ON notifications_schema.notification_audit_log(phi_accessed) WHERE phi_accessed = TRUE;

ALTER TABLE notifications_schema.notification_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to audit log"
  ON notifications_schema.notification_audit_log
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE notifications_schema.notification_audit_log IS 
'HIPAA-compliant audit log for all notification-related actions';

