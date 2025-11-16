/**
 * Migration: Create Appointment Reminders Table
 * Description: Table for storing appointment reminder schedules in notifications_schema
 *
 * Purpose:
 * - Store reminder schedules for appointments (24H, 2H, 30M before)
 * - Enable cron job to query and send reminders
 * - Maintain bounded context separation (no cross-schema queries)
 *
 * Data Source: appointment.scheduled events from Appointments Service
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @date 2025-01-14
 */

-- =====================================================
-- Create appointment_reminders table
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications_schema.appointment_reminders (
  -- Primary Key
  reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Appointment Information (from event payload)
  appointment_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'hospital-1',

  -- Patient Information (denormalized from event)
  patient_id TEXT NOT NULL,
  patient_name TEXT,
  patient_phone TEXT,
  patient_email TEXT,
  patient_language TEXT DEFAULT 'vi' CHECK (patient_language IN ('vi', 'en')),

  -- Doctor Information (denormalized from event)
  doctor_id TEXT,
  doctor_name TEXT,
  doctor_specialization TEXT,

  -- Appointment Details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_type TEXT,
  reason TEXT,

  -- Reminder Configuration
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24H_BEFORE', '2H_BEFORE', '30M_BEFORE', 'CUSTOM')),

  -- Scheduled send time (calculated from appointment datetime - offset)
  scheduled_send_time TIMESTAMPTZ NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED', 'EXPIRED')),

  -- Notification channels to use
  channels JSONB DEFAULT '["SMS", "EMAIL"]'::jsonb,
  preferred_channel TEXT DEFAULT 'SMS' CHECK (preferred_channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),

  -- Delivery tracking
  notification_id TEXT, -- Reference to notifications.notification_id after sending
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Template information
  template_id TEXT DEFAULT 'APPOINTMENT_REMINDER',
  template_data JSONB DEFAULT '{}'::jsonb, -- Additional template variables

  -- Custom message override
  custom_message TEXT,

  -- Cancellation tracking
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,
  cancellation_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT DEFAULT 'system',

  -- Composite indexes for query performance
  CONSTRAINT unique_appointment_reminder_type UNIQUE (appointment_id, reminder_type)
);

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

-- Index for cron job query (most important)
CREATE INDEX IF NOT EXISTS idx_reminders_pending_scheduled
ON notifications_schema.appointment_reminders (status, scheduled_send_time)
WHERE status = 'PENDING';

-- Index for appointment lookup
CREATE INDEX IF NOT EXISTS idx_reminders_appointment
ON notifications_schema.appointment_reminders (appointment_id);

-- Index for patient lookup
CREATE INDEX IF NOT EXISTS idx_reminders_patient
ON notifications_schema.appointment_reminders (patient_id);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_reminders_appointment_date
ON notifications_schema.appointment_reminders (appointment_date);

-- Index for status tracking
CREATE INDEX IF NOT EXISTS idx_reminders_status
ON notifications_schema.appointment_reminders (status, created_at);

-- Index for tenant isolation
CREATE INDEX IF NOT EXISTS idx_reminders_tenant
ON notifications_schema.appointment_reminders (tenant_id);

-- Composite index for retry logic
CREATE INDEX IF NOT EXISTS idx_reminders_retry
ON notifications_schema.appointment_reminders (status, next_retry_at)
WHERE status = 'FAILED' AND retry_count < max_retries;

-- =====================================================
-- Create Updated Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION notifications_schema.update_appointment_reminder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointment_reminder_timestamp
  BEFORE UPDATE ON notifications_schema.appointment_reminders
  FOR EACH ROW
  EXECUTE FUNCTION notifications_schema.update_appointment_reminder_updated_at();

-- =====================================================
-- Create Helper Functions
-- =====================================================

-- Function to calculate scheduled send time based on reminder type
CREATE OR REPLACE FUNCTION notifications_schema.calculate_reminder_send_time(
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_reminder_type TEXT,
  p_timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh'
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_appointment_datetime TIMESTAMPTZ;
  v_send_time TIMESTAMPTZ;
BEGIN
  -- Combine date and time with timezone
  v_appointment_datetime := (p_appointment_date || ' ' || p_appointment_time)::TIMESTAMP AT TIME ZONE p_timezone;

  -- Calculate send time based on reminder type
  CASE p_reminder_type
    WHEN '24H_BEFORE' THEN
      v_send_time := v_appointment_datetime - INTERVAL '24 hours';
    WHEN '2H_BEFORE' THEN
      v_send_time := v_appointment_datetime - INTERVAL '2 hours';
    WHEN '30M_BEFORE' THEN
      v_send_time := v_appointment_datetime - INTERVAL '30 minutes';
    ELSE
      v_send_time := v_appointment_datetime - INTERVAL '1 hour'; -- Default
  END CASE;

  RETURN v_send_time;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-cancel reminders for past appointments
CREATE OR REPLACE FUNCTION notifications_schema.auto_expire_old_reminders()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE notifications_schema.appointment_reminders
  SET
    status = 'EXPIRED',
    updated_at = NOW()
  WHERE
    status = 'PENDING'
    AND appointment_date < CURRENT_DATE
    AND appointment_time < CURRENT_TIME;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE notifications_schema.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY service_role_all_appointment_reminders
  ON notifications_schema.appointment_reminders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can view their own reminders
CREATE POLICY users_view_own_appointment_reminders
  ON notifications_schema.appointment_reminders
  FOR SELECT
  TO authenticated
  USING (
    patient_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE notifications_schema.appointment_reminders IS
'Appointment reminder schedules for notifications service.
Data sourced from appointment.scheduled events via event-driven architecture.
Enables bounded context separation - no cross-schema queries to appointments_schema.
Cron job queries this table every 5 minutes to send due reminders.';

COMMENT ON COLUMN notifications_schema.appointment_reminders.reminder_id IS 'Unique identifier for reminder';
COMMENT ON COLUMN notifications_schema.appointment_reminders.appointment_id IS 'Soft reference to appointments_schema.appointments.appointment_id';
COMMENT ON COLUMN notifications_schema.appointment_reminders.scheduled_send_time IS 'When to send this reminder (calculated as appointment_datetime - offset)';
COMMENT ON COLUMN notifications_schema.appointment_reminders.reminder_type IS 'Type of reminder: 24H_BEFORE, 2H_BEFORE, 30M_BEFORE, or CUSTOM';
COMMENT ON COLUMN notifications_schema.appointment_reminders.status IS 'PENDING: Not sent yet, PROCESSING: Being sent, SENT: Successfully sent, FAILED: Send failed, CANCELLED: Appointment cancelled, EXPIRED: Past appointment';
COMMENT ON COLUMN notifications_schema.appointment_reminders.notification_id IS 'Reference to notifications.notification_id after reminder is sent';

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON notifications_schema.appointment_reminders TO service_role;
GRANT SELECT ON notifications_schema.appointment_reminders TO authenticated;

-- =====================================================
-- Sample Data for Testing (Optional)
-- =====================================================

-- Uncomment to insert sample reminders for testing
/*
INSERT INTO notifications_schema.appointment_reminders
  (appointment_id, patient_id, patient_name, patient_phone, patient_email,
   doctor_id, doctor_name, appointment_date, appointment_time,
   reminder_type, scheduled_send_time)
VALUES
  -- 24H reminder (tomorrow 10:00 AM appointment)
  ('2025-APT-000001-001', 'PAT-202501-001', 'Nguyễn Văn A', '+84901234567', 'nguyen.vana@example.com',
   'DEPT-DOC-202501-001', 'Dr. Trần Thị B', CURRENT_DATE + INTERVAL '1 day', '10:00:00',
   '24H_BEFORE',
   notifications_schema.calculate_reminder_send_time(CURRENT_DATE + INTERVAL '1 day', '10:00:00', '24H_BEFORE')),

  -- 2H reminder (tomorrow 10:00 AM appointment)
  ('2025-APT-000001-001', 'PAT-202501-001', 'Nguyễn Văn A', '+84901234567', 'nguyen.vana@example.com',
   'DEPT-DOC-202501-001', 'Dr. Trần Thị B', CURRENT_DATE + INTERVAL '1 day', '10:00:00',
   '2H_BEFORE',
   notifications_schema.calculate_reminder_send_time(CURRENT_DATE + INTERVAL '1 day', '10:00:00', '2H_BEFORE')),

  -- 30M reminder (tomorrow 10:00 AM appointment)
  ('2025-APT-000001-001', 'PAT-202501-001', 'Nguyễn Văn A', '+84901234567', 'nguyen.vana@example.com',
   'DEPT-DOC-202501-001', 'Dr. Trần Thị B', CURRENT_DATE + INTERVAL '1 day', '10:00:00',
   '30M_BEFORE',
   notifications_schema.calculate_reminder_send_time(CURRENT_DATE + INTERVAL '1 day', '10:00:00', '30M_BEFORE'));
*/

-- =====================================================
-- Migration Complete
-- =====================================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'notifications_schema'
    AND table_name = 'appointment_reminders'
  ) THEN
    RAISE NOTICE '✅ Migration 013: appointment_reminders table created successfully';
  ELSE
    RAISE EXCEPTION '❌ Migration 013: Failed to create appointment_reminders table';
  END IF;
END $$;
