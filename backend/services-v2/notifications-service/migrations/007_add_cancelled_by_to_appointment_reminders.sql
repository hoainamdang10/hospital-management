-- Migration: 007_add_cancelled_by_to_appointment_reminders
-- Adds cancelled_by column to support cancellation flows

ALTER TABLE notifications_schema.appointment_reminders
ADD COLUMN IF NOT EXISTS cancelled_by UUID;

COMMENT ON COLUMN notifications_schema.appointment_reminders.cancelled_by IS
'User who cancelled the appointment (for reminder cleanup)';
