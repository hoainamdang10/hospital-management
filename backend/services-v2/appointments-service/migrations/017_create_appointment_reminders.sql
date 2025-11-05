/**
 * Migration: Create Appointment Reminders Table (OPTIONAL)
 *
 * ⚠️ IMPORTANT: READ BEFORE RUNNING THIS MIGRATION ⚠️
 *
 * This migration is OPTIONAL and creates a local reminder storage table.
 *
 * CONTEXT:
 * Appointments Service ALREADY has full integration with Scheduler Service via:
 * - Event-driven architecture (AppointmentScheduledSchedulerHandler)
 * - Outbox pattern (OutboxPublisherWorker + RemoteSchedulerAdapter)
 * - Automatic reminder scheduling when appointments are created
 * - Reminder policy configuration (src/config/reminder-policy.json)
 *
 * WHY THIS TABLE EXISTS:
 * This table provides an ALTERNATIVE approach for manual reminder management:
 * - Manual creation of reminders outside auto-scheduling
 * - Local storage of reminder metadata for querying
 * - Override or supplement auto-generated reminders
 * - Custom reminder workflows not covered by policy
 *
 * WHEN TO USE:
 * - You need manual control over individual reminders
 * - You want to store reminder metadata locally (not just in Scheduler Service)
 * - You need custom reminder logic beyond the policy-based auto-scheduling
 * - You want to query reminder history without calling Scheduler Service API
 *
 * WHEN NOT TO USE:
 * - For standard appointment reminders → Use existing Scheduler Service integration
 * - For policy-based reminders → Already handled by AppointmentScheduledSchedulerHandler
 * - For automatic scheduling → Already implemented via Outbox pattern
 *
 * DEFAULT RECOMMENDATION:
 * DO NOT run this migration unless you have a specific use case for manual reminder management.
 * The existing Scheduler Service integration is production-ready and handles 99% of use cases.
 *
 * ARCHITECTURE DECISION:
 * - Auto-generated reminders: Managed by Scheduler Service (scheduler.schedules table)
 * - Manual reminders: Managed by this table (appointments_schema.appointment_reminders)
 * - Both can coexist, but auto-generated reminders are preferred for consistency
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @date 2025-01-11
 * @status OPTIONAL - Only run if manual reminder management is required
 */

-- Create appointment_reminders table
CREATE TABLE IF NOT EXISTS scheduling_schema.appointment_reminders (
  -- Primary Key
  reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  appointment_id UUID NOT NULL REFERENCES scheduling_schema.appointments(appointment_id) ON DELETE CASCADE,
  tenant_id VARCHAR(50) NOT NULL,
  
  -- Reminder Details
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push', 'in_app')),
  reminder_channel VARCHAR(50) NOT NULL CHECK (reminder_channel IN ('email', 'sms', 'push_notification', 'in_app_notification')),
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  send_before_minutes INTEGER NOT NULL CHECK (send_before_minutes > 0),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Message Content
  subject VARCHAR(255),
  message TEXT NOT NULL,
  template_id VARCHAR(100),
  template_data JSONB,
  
  -- Recipient Info (denormalized for performance)
  recipient_id VARCHAR(50) NOT NULL,
  recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('patient', 'doctor', 'both')),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  
  -- Metadata
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  metadata JSONB,
  
  -- Audit Fields
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_scheduled_time CHECK (scheduled_at > created_at),
  CONSTRAINT valid_recipient_contact CHECK (
    (reminder_channel = 'email' AND recipient_email IS NOT NULL) OR
    (reminder_channel = 'sms' AND recipient_phone IS NOT NULL) OR
    (reminder_channel IN ('push_notification', 'in_app_notification'))
  )
);

-- Indexes for performance
CREATE INDEX idx_appointment_reminders_appointment_id ON scheduling_schema.appointment_reminders(appointment_id);
CREATE INDEX idx_appointment_reminders_tenant_id ON scheduling_schema.appointment_reminders(tenant_id);
CREATE INDEX idx_appointment_reminders_status ON scheduling_schema.appointment_reminders(status);
CREATE INDEX idx_appointment_reminders_scheduled_at ON scheduling_schema.appointment_reminders(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_appointment_reminders_recipient ON scheduling_schema.appointment_reminders(recipient_id, recipient_type);

-- Composite index for reminder processing
CREATE INDEX idx_appointment_reminders_processing ON scheduling_schema.appointment_reminders(status, scheduled_at) 
  WHERE status = 'pending';

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION scheduling_schema.update_appointment_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointment_reminders_updated_at
  BEFORE UPDATE ON scheduling_schema.appointment_reminders
  FOR EACH ROW
  EXECUTE FUNCTION scheduling_schema.update_appointment_reminders_updated_at();

-- Row Level Security (RLS)
ALTER TABLE scheduling_schema.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access reminders for their tenant
CREATE POLICY appointment_reminders_tenant_isolation ON scheduling_schema.appointment_reminders
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE));

-- Policy: Service role can access all reminders
CREATE POLICY appointment_reminders_service_role ON scheduling_schema.appointment_reminders
  FOR ALL
  TO service_role
  USING (TRUE);

-- Comments for documentation
COMMENT ON TABLE scheduling_schema.appointment_reminders IS 'Stores appointment reminders with multi-channel support';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.reminder_id IS 'Unique identifier for the reminder';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.appointment_id IS 'Reference to the appointment';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.reminder_type IS 'Type of reminder (email, sms, push, in_app)';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.reminder_channel IS 'Delivery channel for the reminder';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.scheduled_at IS 'When the reminder should be sent';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.send_before_minutes IS 'Minutes before appointment to send reminder';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.status IS 'Current status of the reminder';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.template_id IS 'Reference to notification template';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.recipient_type IS 'Who should receive the reminder (patient, doctor, both)';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.priority IS 'Priority level for reminder delivery';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.retry_count IS 'Number of delivery attempts';
COMMENT ON COLUMN scheduling_schema.appointment_reminders.metadata IS 'Additional metadata in JSON format';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduling_schema.appointment_reminders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduling_schema.appointment_reminders TO service_role;

