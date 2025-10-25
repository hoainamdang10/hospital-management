-- =====================================================
-- Notifications Service - Cleanup & Maintenance Jobs
-- =====================================================
-- Purpose: Automated cleanup and maintenance tasks
-- =====================================================

-- =====================================================
-- Cleanup Functions
-- =====================================================

-- Cleanup old completed notifications (soft delete)
CREATE OR REPLACE FUNCTION notifications_schema.cleanup_old_completed_notifications(
  p_days_retention INTEGER DEFAULT 90
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
      deleted_by = 'system_cleanup'
    WHERE 
      status IN ('SENT', 'DELIVERED', 'CANCELLED')
      AND created_at < NOW() - (p_days_retention || ' days')::INTERVAL
      AND is_deleted = FALSE
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  -- Log cleanup action
  INSERT INTO notifications_schema.notification_audit_log (
    event_type, action, success, metadata
  ) VALUES (
    'NOTIFICATION_CANCELLED',
    'automated_cleanup',
    TRUE,
    jsonb_build_object('deleted_count', v_deleted_count, 'retention_days', p_days_retention)
  );
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old delivery results
CREATE OR REPLACE FUNCTION notifications_schema.cleanup_old_delivery_results(
  p_days_retention INTEGER DEFAULT 180
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM notifications_schema.notification_delivery_results
    WHERE created_at < NOW() - (p_days_retention || ' days')::INTERVAL
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old audit logs
CREATE OR REPLACE FUNCTION notifications_schema.cleanup_old_audit_logs(
  p_days_retention INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM notifications_schema.notification_audit_log
    WHERE 
      created_at < NOW() - (p_days_retention || ' days')::INTERVAL
      AND phi_accessed = FALSE -- Keep PHI audit logs longer
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Archive old analytics data
CREATE OR REPLACE FUNCTION notifications_schema.archive_old_analytics(
  p_days_retention INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  -- In production, this would move data to an archive table
  -- For now, just delete old data
  WITH archived AS (
    DELETE FROM notifications_schema.notification_analytics
    WHERE date < CURRENT_DATE - p_days_retention
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_archived_count FROM archived;
  
  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Maintenance Functions
-- =====================================================

-- Update template statistics
CREATE OR REPLACE FUNCTION notifications_schema.update_template_statistics()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications_schema.notification_templates t
  SET 
    avg_success_rate = stats.success_rate,
    avg_delivery_time_ms = stats.avg_delivery_time
  FROM (
    SELECT 
      n.template_type,
      ROUND(
        (COUNT(*) FILTER (WHERE n.status = 'DELIVERED')::DECIMAL / NULLIF(COUNT(*), 0) * 100),
        2
      ) AS success_rate,
      AVG(dr.delivery_time_ms)::INTEGER AS avg_delivery_time
    FROM notifications_schema.notifications n
    LEFT JOIN notifications_schema.notification_delivery_results dr 
      ON n.notification_id = dr.notification_id
    WHERE n.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY n.template_type
  ) stats
  WHERE t.template_type = stats.template_type;
END;
$$ LANGUAGE plpgsql;

-- Update channel health status
CREATE OR REPLACE FUNCTION notifications_schema.update_channel_health_status()
RETURNS VOID AS $$
BEGIN
  -- Update health metrics for each channel
  UPDATE notifications_schema.channel_health ch
  SET 
    success_rate = stats.success_rate,
    avg_delivery_time_ms = stats.avg_delivery_time,
    total_sent_24h = stats.total_sent,
    total_failed_24h = stats.total_failed,
    health_status = CASE 
      WHEN stats.success_rate >= 95 THEN 'HEALTHY'
      WHEN stats.success_rate >= 85 THEN 'DEGRADED'
      WHEN stats.success_rate >= 70 THEN 'UNHEALTHY'
      ELSE 'DOWN'
    END,
    is_healthy = stats.success_rate >= 95,
    last_successful_delivery = stats.last_success,
    last_failure = stats.last_failure,
    updated_at = NOW()
  FROM (
    SELECT 
      dr.channel,
      ROUND(
        (COUNT(*) FILTER (WHERE dr.success = TRUE)::DECIMAL / NULLIF(COUNT(*), 0) * 100),
        2
      ) AS success_rate,
      AVG(dr.delivery_time_ms) FILTER (WHERE dr.success = TRUE)::INTEGER AS avg_delivery_time,
      COUNT(*) AS total_sent,
      COUNT(*) FILTER (WHERE dr.success = FALSE) AS total_failed,
      MAX(dr.delivered_at) FILTER (WHERE dr.success = TRUE) AS last_success,
      MAX(dr.created_at) FILTER (WHERE dr.success = FALSE) AS last_failure
    FROM notifications_schema.notification_delivery_results dr
    WHERE dr.created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY dr.channel
  ) stats
  WHERE ch.channel = stats.channel;
END;
$$ LANGUAGE plpgsql;

-- Expire old scheduled notifications
CREATE OR REPLACE FUNCTION notifications_schema.expire_old_scheduled_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE notifications_schema.notifications
    SET 
      status = 'EXPIRED',
      updated_at = NOW()
    WHERE 
      status = 'SCHEDULED'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
      AND is_deleted = FALSE
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_expired_count FROM expired;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Scheduled Job Wrapper
-- =====================================================

-- Master maintenance job (run daily)
CREATE OR REPLACE FUNCTION notifications_schema.run_daily_maintenance()
RETURNS TABLE (
  task TEXT,
  result INTEGER,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_result INTEGER;
  v_error TEXT;
BEGIN
  -- Cleanup old notifications (90 days)
  BEGIN
    v_result := notifications_schema.cleanup_old_completed_notifications(90);
    RETURN QUERY SELECT 
      'cleanup_notifications'::TEXT, 
      v_result, 
      TRUE, 
      format('Cleaned up %s old notifications', v_result);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN QUERY SELECT 
      'cleanup_notifications'::TEXT, 
      0, 
      FALSE, 
      v_error;
  END;
  
  -- Cleanup old delivery results (180 days)
  BEGIN
    v_result := notifications_schema.cleanup_old_delivery_results(180);
    RETURN QUERY SELECT 
      'cleanup_delivery_results'::TEXT, 
      v_result, 
      TRUE, 
      format('Cleaned up %s old delivery results', v_result);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN QUERY SELECT 
      'cleanup_delivery_results'::TEXT, 
      0, 
      FALSE, 
      v_error;
  END;
  
  -- Cleanup old audit logs (365 days for non-PHI)
  BEGIN
    v_result := notifications_schema.cleanup_old_audit_logs(365);
    RETURN QUERY SELECT 
      'cleanup_audit_logs'::TEXT, 
      v_result, 
      TRUE, 
      format('Cleaned up %s old audit logs', v_result);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN QUERY SELECT 
      'cleanup_audit_logs'::TEXT, 
      0, 
      FALSE, 
      v_error;
  END;
  
  -- Update template statistics
  BEGIN
    PERFORM notifications_schema.update_template_statistics();
    RETURN QUERY SELECT 
      'update_template_stats'::TEXT, 
      1, 
      TRUE, 
      'Updated template statistics';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN QUERY SELECT 
      'update_template_stats'::TEXT, 
      0, 
      FALSE, 
      v_error;
  END;
  
  -- Update channel health
  BEGIN
    PERFORM notifications_schema.update_channel_health_status();
    RETURN QUERY SELECT 
      'update_channel_health'::TEXT, 
      1, 
      TRUE, 
      'Updated channel health status';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN QUERY SELECT 
      'update_channel_health'::TEXT, 
      0, 
      FALSE, 
      v_error;
  END;
  
  -- Expire old scheduled notifications
  BEGIN
    v_result := notifications_schema.expire_old_scheduled_notifications();
    RETURN QUERY SELECT 
      'expire_scheduled'::TEXT, 
      v_result, 
      TRUE, 
      format('Expired %s old scheduled notifications', v_result);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN QUERY SELECT 
      'expire_scheduled'::TEXT, 
      0, 
      FALSE, 
      v_error;
  END;
  
  -- Aggregate yesterday's analytics
  BEGIN
    PERFORM notifications_schema.aggregate_analytics(CURRENT_DATE - 1);
    RETURN QUERY SELECT 
      'aggregate_analytics'::TEXT, 
      1, 
      TRUE, 
      'Aggregated yesterday analytics';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN QUERY SELECT 
      'aggregate_analytics'::TEXT, 
      0, 
      FALSE, 
      v_error;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION notifications_schema.cleanup_old_completed_notifications TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.cleanup_old_delivery_results TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.cleanup_old_audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.archive_old_analytics TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.update_template_statistics TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.update_channel_health_status TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.expire_old_scheduled_notifications TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.run_daily_maintenance TO service_role;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION notifications_schema.run_daily_maintenance IS 
'Master maintenance job - run daily via cron or scheduler. Handles cleanup, aggregation, and health updates.';

-- =====================================================
-- Usage Example
-- =====================================================

-- To run maintenance manually:
-- SELECT * FROM notifications_schema.run_daily_maintenance();

-- To schedule via pg_cron (if available):
-- SELECT cron.schedule('notifications-daily-maintenance', '0 2 * * *', 
--   'SELECT notifications_schema.run_daily_maintenance();');

