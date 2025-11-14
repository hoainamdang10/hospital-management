-- =====================================================
-- Migration: Add read_at column to notifications table
-- Version: 006
-- Description: Add read_at timestamp for mark as read functionality
-- Author: Hospital Management Team
-- Date: 2025-01-11
-- =====================================================

-- Add read_at column to notifications table
ALTER TABLE notifications_schema.notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Add index for filtering read/unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_read_at 
ON notifications_schema.notifications(recipient_id, read_at) 
WHERE is_deleted = false;

-- Add index for unread notifications count
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications_schema.notifications(recipient_id) 
WHERE read_at IS NULL AND is_deleted = false;

-- Add comment
COMMENT ON COLUMN notifications_schema.notifications.read_at IS 'Timestamp when notification was marked as read by recipient';
