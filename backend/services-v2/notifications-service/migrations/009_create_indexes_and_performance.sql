-- =====================================================
-- Notifications Service - Performance Indexes
-- =====================================================
-- Purpose: Additional indexes for optimal query performance
-- =====================================================

-- =====================================================
-- Composite Indexes for Common Query Patterns
-- =====================================================

-- Dashboard queries (recent notifications by recipient)
CREATE INDEX IF NOT EXISTS idx_notifications_dashboard 
ON notifications_schema.notifications(recipient_id, status, created_at DESC)
WHERE is_deleted = FALSE;

-- Failed notifications needing retry
CREATE INDEX IF NOT EXISTS idx_notifications_failed_retry
ON notifications_schema.notifications(status, retry_count, next_retry_at)
WHERE status = 'FAILED' AND retry_count < max_retries AND is_deleted = FALSE;

-- Scheduled notifications due
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_due
ON notifications_schema.notifications(status, scheduled_at, priority DESC)
WHERE status = 'SCHEDULED' AND is_deleted = FALSE;

-- Template usage analysis
CREATE INDEX IF NOT EXISTS idx_notifications_template_analysis
ON notifications_schema.notifications(template_type, status, created_at DESC)
WHERE is_deleted = FALSE;

-- Healthcare context lookups
CREATE INDEX IF NOT EXISTS idx_notifications_patient_context
ON notifications_schema.notifications((healthcare_context->>'patientId'), created_at DESC)
WHERE (healthcare_context->>'patientId') IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_appointment_context
ON notifications_schema.notifications((healthcare_context->>'appointmentId'), created_at DESC)
WHERE (healthcare_context->>'appointmentId') IS NOT NULL AND is_deleted = FALSE;

-- =====================================================
-- Delivery Results Performance Indexes
-- =====================================================

-- Notification + channel lookup (for getting all results for a notification)
CREATE INDEX IF NOT EXISTS idx_delivery_notification_channel
ON notifications_schema.notification_delivery_results(notification_id, channel);

-- Channel performance analysis
CREATE INDEX IF NOT EXISTS idx_delivery_channel_performance
ON notifications_schema.notification_delivery_results(channel, status, success, created_at DESC);

-- Provider performance
CREATE INDEX IF NOT EXISTS idx_delivery_provider_performance
ON notifications_schema.notification_delivery_results(provider_id, success, created_at DESC);

-- Cost analysis
CREATE INDEX IF NOT EXISTS idx_delivery_cost_analysis
ON notifications_schema.notification_delivery_results(channel, cost_amount, created_at DESC)
WHERE cost_amount IS NOT NULL;

-- =====================================================
-- Partitioning Setup (for large tables)
-- =====================================================

-- Note: Partitioning can be added later when tables grow large
-- Recommended: Partition notifications by created_at (monthly)
-- Recommended: Partition delivery_results by created_at (monthly)
-- Recommended: Partition audit_log by created_at (monthly)

-- =====================================================
-- Vacuum and Analyze Settings
-- =====================================================

-- Set autovacuum settings for high-write tables
ALTER TABLE notifications_schema.notifications 
SET (autovacuum_vacuum_scale_factor = 0.05);

ALTER TABLE notifications_schema.notification_delivery_results 
SET (autovacuum_vacuum_scale_factor = 0.05);

ALTER TABLE notifications_schema.notification_audit_log 
SET (autovacuum_vacuum_scale_factor = 0.02);

-- =====================================================
-- Statistics Collection
-- =====================================================

-- Update statistics for better query planning
ANALYZE notifications_schema.notifications;
ANALYZE notifications_schema.notification_delivery_results;
ANALYZE notifications_schema.notification_templates;
ANALYZE notifications_schema.notification_preferences;
ANALYZE notifications_schema.notification_analytics;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON INDEX notifications_schema.idx_notifications_dashboard IS 
'Optimized for dashboard queries showing recent notifications per recipient';

COMMENT ON INDEX notifications_schema.idx_delivery_channel_performance IS 
'Optimized for channel performance analytics and monitoring';

