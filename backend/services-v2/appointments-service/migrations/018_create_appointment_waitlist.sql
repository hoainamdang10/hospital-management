/**
 * Migration: Create Appointment Waitlist Table
 * 
 * Purpose: Manage patients waiting for appointment slots
 * 
 * CONTEXT:
 * Waitlist is different from Queue:
 * - Queue: Same-day waiting (patients who checked in, waiting to see doctor)
 * - Waitlist: Future appointment waiting (patients waiting for available slots)
 * 
 * USE CASES:
 * - Patient wants appointment but no slots available
 * - Patient has preferred doctor/time but flexible
 * - Automatic matching when slots become available
 * - Priority-based slot allocation
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @date 2025-01-11
 */

-- Create waitlist table
CREATE TABLE IF NOT EXISTS appointments_schema.appointment_waitlist (
  -- Primary Key
  waitlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Patient Information
  patient_id TEXT NOT NULL,
  
  -- Preferences
  preferred_doctor_id TEXT,
  preferred_department_id TEXT,
  preferred_date DATE,
  preferred_time_slot TEXT, -- e.g., "morning", "afternoon", "evening", or specific time "14:00-15:00"
  appointment_type TEXT NOT NULL, -- CONSULTATION, FOLLOW_UP, EMERGENCY, etc.
  
  -- Priority & Status
  priority TEXT NOT NULL DEFAULT 'NORMAL', -- EMERGENCY, URGENT, NORMAL, LOW
  status TEXT NOT NULL DEFAULT 'WAITING', -- WAITING, MATCHED, CONVERTED, CANCELLED, EXPIRED
  
  -- Additional Information
  notes TEXT,
  reason TEXT, -- Reason for appointment
  
  -- Flexibility
  is_flexible_date BOOLEAN DEFAULT true, -- Can accept other dates
  is_flexible_time BOOLEAN DEFAULT true, -- Can accept other time slots
  is_flexible_doctor BOOLEAN DEFAULT true, -- Can accept other doctors in same department
  
  -- Matching Information
  matched_appointment_id UUID, -- Reference to created appointment (if converted)
  matched_at TIMESTAMPTZ,
  matched_by TEXT, -- User who matched/converted
  
  -- Cancellation/Expiration
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,
  cancellation_reason TEXT,
  expires_at TIMESTAMPTZ, -- Auto-expire if not matched by this date
  
  -- Contact Information (for notifications)
  contact_phone TEXT,
  contact_email TEXT,
  preferred_contact_method TEXT DEFAULT 'SMS', -- SMS, EMAIL, PUSH, CALL
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  
  -- Constraints
  CONSTRAINT valid_priority CHECK (priority IN ('EMERGENCY', 'URGENT', 'NORMAL', 'LOW')),
  CONSTRAINT valid_status CHECK (status IN ('WAITING', 'MATCHED', 'CONVERTED', 'CANCELLED', 'EXPIRED')),
  CONSTRAINT valid_contact_method CHECK (preferred_contact_method IN ('SMS', 'EMAIL', 'PUSH', 'CALL')),
  CONSTRAINT valid_time_slot CHECK (
    preferred_time_slot IS NULL OR 
    preferred_time_slot IN ('morning', 'afternoon', 'evening') OR
    preferred_time_slot ~ '^\d{2}:\d{2}-\d{2}:\d{2}$'
  ),
  CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX idx_waitlist_patient_id ON appointments_schema.appointment_waitlist(patient_id);
CREATE INDEX idx_waitlist_status ON appointments_schema.appointment_waitlist(status) WHERE status = 'WAITING';
CREATE INDEX idx_waitlist_priority ON appointments_schema.appointment_waitlist(priority, created_at);
CREATE INDEX idx_waitlist_preferred_doctor ON appointments_schema.appointment_waitlist(preferred_doctor_id) WHERE status = 'WAITING';
CREATE INDEX idx_waitlist_preferred_date ON appointments_schema.appointment_waitlist(preferred_date) WHERE status = 'WAITING';
CREATE INDEX idx_waitlist_matching ON appointments_schema.appointment_waitlist(status, priority, created_at) 
  WHERE status = 'WAITING';
CREATE INDEX idx_waitlist_expiration ON appointments_schema.appointment_waitlist(expires_at) 
  WHERE status = 'WAITING' AND expires_at IS NOT NULL;

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION appointments_schema.update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_waitlist_timestamp
  BEFORE UPDATE ON appointments_schema.appointment_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION appointments_schema.update_waitlist_updated_at();

-- Row Level Security (RLS)
ALTER TABLE appointments_schema.appointment_waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own waitlist entries
CREATE POLICY waitlist_select_own ON appointments_schema.appointment_waitlist
  FOR SELECT
  USING (
    patient_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) IN ('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')
  );

-- Policy: Patients can insert their own entries, staff can insert any
CREATE POLICY waitlist_insert ON appointments_schema.appointment_waitlist
  FOR INSERT
  WITH CHECK (
    patient_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) IN ('ADMIN', 'RECEPTIONIST')
  );

-- Policy: Patients can update their own entries, staff can update any
CREATE POLICY waitlist_update ON appointments_schema.appointment_waitlist
  FOR UPDATE
  USING (
    patient_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_role', true) IN ('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')
  );

-- Policy: Only staff can delete
CREATE POLICY waitlist_delete ON appointments_schema.appointment_waitlist
  FOR DELETE
  USING (
    current_setting('app.current_user_role', true) IN ('ADMIN', 'RECEPTIONIST')
  );

-- Comments
COMMENT ON TABLE appointments_schema.appointment_waitlist IS 'Waitlist for patients waiting for appointment slots';
COMMENT ON COLUMN appointments_schema.appointment_waitlist.waitlist_id IS 'Unique identifier for waitlist entry';
COMMENT ON COLUMN appointments_schema.appointment_waitlist.status IS 'WAITING: In waitlist, MATCHED: Slot found, CONVERTED: Appointment created, CANCELLED: Cancelled by user, EXPIRED: Auto-expired';
COMMENT ON COLUMN appointments_schema.appointment_waitlist.priority IS 'Priority level for slot allocation';
COMMENT ON COLUMN appointments_schema.appointment_waitlist.expires_at IS 'Auto-expire waitlist entry if not matched by this date';

