-- =====================================================
-- Scheduling Service V2 - Database Schema
-- Clean Architecture + DDD + Schema Per Service Pattern
-- =====================================================
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Compliance: HIPAA, Vietnamese Healthcare Standards, Schema Per Service

-- Create scheduling schema if not exists
CREATE SCHEMA IF NOT EXISTS scheduling_schema;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. APPOINTMENTS TABLE (Main aggregate root)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.appointments (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id TEXT UNIQUE NOT NULL,  -- YYYY-APT-MMDDSS-NNN

  -- Soft References (Business IDs - NO FKs to other schemas)
  patient_id VARCHAR(20) NOT NULL,  -- PAT-YYYYMM-XXX (soft reference to patient_schema)
  doctor_id VARCHAR(30) NOT NULL,   -- DEPT-DOC-YYYYMM-XXX (soft reference to provider_schema)

  -- Time Slot
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,

  -- Appointment Type & Priority
  type TEXT NOT NULL DEFAULT 'CONSULTATION',  -- CONSULTATION, FOLLOW_UP, EMERGENCY, SURGERY, CHECKUP
  priority TEXT NOT NULL DEFAULT 'NORMAL',    -- EMERGENCY, URGENT, NORMAL, LOW
  status TEXT NOT NULL DEFAULT 'SCHEDULED',   -- SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

  -- Appointment Details (PHI - Protected Health Information)
  reason TEXT,
  chief_complaint TEXT,
  symptoms JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  special_instructions TEXT,

  -- Location
  room_id UUID,
  department_id UUID,
  required_equipment JSONB DEFAULT '[]'::jsonb,

  -- Financial
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  additional_fees NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'PENDING',  -- PENDING, PAID, PARTIALLY_PAID, REFUNDED
  payment_method TEXT,

  -- Workflow Timestamps
  checked_in_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by TEXT,

  -- Follow-up & Series
  follow_up_appointment_id TEXT,
  parent_appointment_id TEXT,
  series_id TEXT,

  -- Reminders & Confirmation
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  confirmation_required BOOLEAN DEFAULT TRUE,
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,

  -- Audit Fields
  created_by TEXT NOT NULL,
  last_modified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_patient_id_format CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$'),
  CONSTRAINT chk_doctor_id_format CHECK (doctor_id ~ '^[A-Z]{2,4}-DOC-\d{6}-\d{3}$'),
  CONSTRAINT chk_appointment_id_format CHECK (appointment_id ~ '^\d{4}-APT-\d{6}-\d{3}$'),
  CONSTRAINT chk_duration_positive CHECK (duration_minutes > 0),
  CONSTRAINT chk_consultation_fee_non_negative CHECK (consultation_fee >= 0),
  CONSTRAINT chk_type CHECK (type IN ('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'SURGERY', 'CHECKUP', 'VACCINATION', 'THERAPY')),
  CONSTRAINT chk_priority CHECK (priority IN ('EMERGENCY', 'URGENT', 'NORMAL', 'LOW')),
  CONSTRAINT chk_status CHECK (
    status IN (
      'SCHEDULED',
      'PENDING_PAYMENT',
      'CONFIRMED',
      'ARRIVED',
      'CHECKED_IN',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'RESCHEDULED'
    )
  ),
  CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED'))
);

-- Indexes for Performance
CREATE INDEX idx_appointments_patient_id ON scheduling_schema.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON scheduling_schema.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON scheduling_schema.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON scheduling_schema.appointments(status);
CREATE INDEX idx_appointments_type ON scheduling_schema.appointments(type);
CREATE INDEX idx_appointments_priority ON scheduling_schema.appointments(priority);
CREATE INDEX idx_appointments_created_at ON scheduling_schema.appointments(created_at DESC);
CREATE INDEX idx_appointments_room_id ON scheduling_schema.appointments(room_id) WHERE room_id IS NOT NULL;

-- =====================================================
-- 2. APPOINTMENT_AUDIT_LOGS TABLE (HIPAA Compliance)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.appointment_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'CANCEL', 'RESCHEDULE', 'CONFIRM', 'CHECK_IN', 'COMPLETE')),
  user_id UUID NOT NULL,
  user_role TEXT,
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign Key within same schema
  CONSTRAINT fk_audit_appointment FOREIGN KEY (appointment_id)
    REFERENCES scheduling_schema.appointments(appointment_id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_appointment_id ON scheduling_schema.appointment_audit_logs(appointment_id);
CREATE INDEX idx_audit_timestamp ON scheduling_schema.appointment_audit_logs(timestamp DESC);
CREATE INDEX idx_audit_user_id ON scheduling_schema.appointment_audit_logs(user_id);
CREATE INDEX idx_audit_action ON scheduling_schema.appointment_audit_logs(action);

-- =====================================================
-- 3. PHI_ACCESS_LOGS TABLE (HIPAA Compliance)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.phi_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('READ', 'WRITE', 'EXPORT', 'PRINT', 'DELETE')),
  accessed_fields TEXT[],
  reason TEXT,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign Key within same schema
  CONSTRAINT fk_phi_access_appointment FOREIGN KEY (appointment_id)
    REFERENCES scheduling_schema.appointments(appointment_id) ON DELETE CASCADE
);

CREATE INDEX idx_phi_access_appointment ON scheduling_schema.phi_access_logs(appointment_id);
CREATE INDEX idx_phi_access_timestamp ON scheduling_schema.phi_access_logs(timestamp DESC);
CREATE INDEX idx_phi_access_user_id ON scheduling_schema.phi_access_logs(user_id);

-- =====================================================
-- 4. APPOINTMENT_TYPES TABLE (Reference data)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.appointment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER DEFAULT 30,
  color_code VARCHAR(7),  -- Hex color for UI
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointment_types_code ON scheduling_schema.appointment_types(code);
CREATE INDEX idx_appointment_types_active ON scheduling_schema.appointment_types(is_active);

-- =====================================================
-- 5. APPOINTMENT_TEMPLATES TABLE (For recurring appointments)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.appointment_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name VARCHAR(255) NOT NULL,
  appointment_type_id UUID NOT NULL,
  default_duration_minutes INTEGER DEFAULT 30,
  default_priority TEXT DEFAULT 'NORMAL',
  recurrence_pattern JSONB,  -- {frequency: 'DAILY|WEEKLY|MONTHLY', interval: 1, daysOfWeek: [1,2,3]}
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign Key within same schema
  CONSTRAINT fk_template_appointment_type FOREIGN KEY (appointment_type_id)
    REFERENCES scheduling_schema.appointment_types(id) ON DELETE CASCADE
);

CREATE INDEX idx_appointment_templates_active ON scheduling_schema.appointment_templates(is_active);

-- =====================================================
-- 6. APPOINTMENT_SLOTS TABLE (Available time slots)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.appointment_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id VARCHAR(30) NOT NULL,  -- Soft reference to provider_schema
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  max_appointments INTEGER DEFAULT 1,
  current_appointments INTEGER DEFAULT 0,
  room_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_slot_doctor_id_format CHECK (doctor_id ~ '^[A-Z]{2,4}-DOC-\d{6}-\d{3}$'),
  CONSTRAINT chk_slot_time_valid CHECK (end_time > start_time),
  CONSTRAINT chk_slot_appointments CHECK (current_appointments <= max_appointments),
  CONSTRAINT unique_slot UNIQUE (doctor_id, slot_date, start_time)
);

CREATE INDEX idx_slots_doctor_date ON scheduling_schema.appointment_slots(doctor_id, slot_date);
CREATE INDEX idx_slots_available ON scheduling_schema.appointment_slots(is_available) WHERE is_available = TRUE;

-- =====================================================
-- 7. WAITING_QUEUE TABLE (Queue management)
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.waiting_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(20) NOT NULL,  -- Soft reference
  doctor_id VARCHAR(30) NOT NULL,   -- Soft reference
  appointment_id TEXT,
  queue_number INTEGER NOT NULL,
  priority TEXT DEFAULT 'NORMAL',
  status TEXT DEFAULT 'WAITING',  -- WAITING, CALLED, IN_PROGRESS, COMPLETED, CANCELLED
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  called_time TIMESTAMPTZ,
  completed_time TIMESTAMPTZ,
  estimated_wait_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_queue_patient_id_format CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$'),
  CONSTRAINT chk_queue_doctor_id_format CHECK (doctor_id ~ '^[A-Z]{2,4}-DOC-\d{6}-\d{3}$'),
  CONSTRAINT chk_queue_status CHECK (status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT fk_queue_appointment FOREIGN KEY (appointment_id)
    REFERENCES scheduling_schema.appointments(appointment_id) ON DELETE SET NULL
);

CREATE INDEX idx_queue_doctor_status ON scheduling_schema.waiting_queue(doctor_id, status);
CREATE INDEX idx_queue_patient ON scheduling_schema.waiting_queue(patient_id);
CREATE INDEX idx_queue_number ON scheduling_schema.waiting_queue(queue_number);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on appointments table
ALTER TABLE scheduling_schema.appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own appointments (as patient)
CREATE POLICY "patients_view_own_appointments"
  ON scheduling_schema.appointments FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM patient_schema.patients
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Doctors can view their appointments
CREATE POLICY "doctors_view_own_appointments"
  ON scheduling_schema.appointments FOR SELECT
  USING (
    doctor_id IN (
      SELECT staff_id FROM provider_schema.staff_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all appointments
CREATE POLICY "admins_view_all_appointments"
  ON scheduling_schema.appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth_schema.user_roles ur
      JOIN auth_schema.healthcare_roles hr ON ur.role_id = hr.id
      WHERE ur.user_id = auth.uid()
      AND hr.role_name IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA scheduling_schema IS 'Scheduling Service V2 - Clean Architecture + Schema Per Service Pattern';
COMMENT ON TABLE scheduling_schema.appointments IS 'Main appointment records with soft references to patient and provider services';
COMMENT ON COLUMN scheduling_schema.appointments.patient_id IS 'Soft reference to patient_schema.patients.patient_id (PAT-YYYYMM-XXX)';
COMMENT ON COLUMN scheduling_schema.appointments.doctor_id IS 'Soft reference to provider_schema.staff_profiles.staff_id (DEPT-DOC-YYYYMM-XXX)';
COMMENT ON TABLE scheduling_schema.appointment_audit_logs IS 'HIPAA-compliant audit trail for all appointment operations';
COMMENT ON TABLE scheduling_schema.phi_access_logs IS 'HIPAA-compliant PHI access logging';
