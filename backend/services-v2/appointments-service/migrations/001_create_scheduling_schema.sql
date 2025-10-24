-- =====================================================================================
-- SCHEDULING SERVICE DATABASE SCHEMA
-- V3 Clean Architecture + DDD Implementation
-- Schema-per-Service Pattern
-- =====================================================================================
-- Author: Hospital Management Team
-- Version: 3.0.0
-- Compliance: HIPAA, Vietnamese Healthcare Standards
-- =====================================================================================

-- =====================================================================================
-- 1. CREATE SCHEMA
-- =====================================================================================
CREATE SCHEMA IF NOT EXISTS scheduling_schema;

-- =====================================================================================
-- 2. CREATE APPOINTMENTS TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.appointments (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Foreign Keys (Soft References)
  patient_id VARCHAR(50) NOT NULL,
  doctor_id VARCHAR(50) NOT NULL,
  
  -- Appointment Time
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  
  -- Appointment Type & Priority
  type VARCHAR(50) NOT NULL CHECK (type IN ('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE_CHECKUP', 'VACCINATION', 'SURGERY', 'DIAGNOSTIC', 'THERAPY')),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('ROUTINE', 'URGENT', 'EMERGENCY')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  
  -- Appointment Details
  reason TEXT,
  chief_complaint TEXT,
  symptoms TEXT[],
  notes TEXT,
  special_instructions TEXT,
  
  -- Location
  room_id VARCHAR(50),
  department_id VARCHAR(50),
  required_equipment TEXT[],
  
  -- Financial
  consultation_fee DECIMAL(10,2) NOT NULL CHECK (consultation_fee >= 0),
  additional_fees DECIMAL(10,2) DEFAULT 0 CHECK (additional_fees >= 0),
  payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'CANCELLED')),
  payment_method VARCHAR(50),
  
  -- Status Timestamps
  checked_in_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  cancelled_by VARCHAR(50),
  
  -- Relationships
  follow_up_appointment_id UUID,
  parent_appointment_id UUID,
  series_id VARCHAR(50),
  
  -- Reminders & Confirmations
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  confirmation_required BOOLEAN DEFAULT TRUE,
  confirmed_at TIMESTAMP,
  confirmed_by VARCHAR(50),
  
  -- Audit Fields
  created_by VARCHAR(50) NOT NULL,
  last_modified_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  
  -- Constraints
  CONSTRAINT fk_follow_up FOREIGN KEY (follow_up_appointment_id) REFERENCES scheduling_schema.appointments(id) ON DELETE SET NULL,
  CONSTRAINT fk_parent FOREIGN KEY (parent_appointment_id) REFERENCES scheduling_schema.appointments(id) ON DELETE SET NULL
);

-- =====================================================================================
-- 3. CREATE APPOINTMENT READ MODELS TABLE (CQRS)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.appointment_read_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Denormalized Patient Data
  patient_id VARCHAR(50) NOT NULL,
  patient_name VARCHAR(255),
  patient_phone VARCHAR(20),
  patient_email VARCHAR(255),
  patient_date_of_birth DATE,
  patient_gender VARCHAR(20),
  
  -- Denormalized Doctor Data
  doctor_id VARCHAR(50) NOT NULL,
  doctor_name VARCHAR(255),
  doctor_specialization VARCHAR(100),
  doctor_phone VARCHAR(20),
  doctor_email VARCHAR(255),
  
  -- Appointment Data
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  reason TEXT,
  consultation_fee DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================================
-- 4. CREATE QUEUE ENTRIES TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id VARCHAR(50) UNIQUE NOT NULL,
  appointment_id VARCHAR(50) NOT NULL,
  patient_id VARCHAR(50) NOT NULL,
  doctor_id VARCHAR(50) NOT NULL,
  department_id VARCHAR(50),
  
  -- Queue Position
  queue_number INTEGER NOT NULL,
  priority_level INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) NOT NULL CHECK (status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED')),
  
  -- Timestamps
  joined_at TIMESTAMP DEFAULT NOW(),
  called_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_wait_time INTEGER,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================================
-- 5. CREATE RECURRING APPOINTMENTS TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS scheduling_schema.recurring_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id VARCHAR(50) UNIQUE NOT NULL,
  patient_id VARCHAR(50) NOT NULL,
  doctor_id VARCHAR(50) NOT NULL,
  
  -- Recurrence Pattern
  recurrence_type VARCHAR(50) NOT NULL CHECK (recurrence_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_days_of_week INTEGER[],
  recurrence_day_of_month INTEGER,
  
  -- Duration
  start_date DATE NOT NULL,
  end_date DATE,
  max_occurrences INTEGER,
  
  -- Template
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  reason TEXT,
  consultation_fee DECIMAL(10,2) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================================================
-- 6. CREATE INDEXES
-- =====================================================================================

-- Appointments Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON scheduling_schema.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON scheduling_schema.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON scheduling_schema.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON scheduling_schema.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_id ON scheduling_schema.appointments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_series_id ON scheduling_schema.appointments(series_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON scheduling_schema.appointments(created_at);

-- Read Models Indexes
CREATE INDEX IF NOT EXISTS idx_read_models_patient_id ON scheduling_schema.appointment_read_models(patient_id);
CREATE INDEX IF NOT EXISTS idx_read_models_doctor_id ON scheduling_schema.appointment_read_models(doctor_id);
CREATE INDEX IF NOT EXISTS idx_read_models_date ON scheduling_schema.appointment_read_models(appointment_date);
CREATE INDEX IF NOT EXISTS idx_read_models_status ON scheduling_schema.appointment_read_models(status);

-- Queue Indexes
CREATE INDEX IF NOT EXISTS idx_queue_appointment_id ON scheduling_schema.queue_entries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_queue_patient_id ON scheduling_schema.queue_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_doctor_id ON scheduling_schema.queue_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON scheduling_schema.queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_joined_at ON scheduling_schema.queue_entries(joined_at);

-- Recurring Appointments Indexes
CREATE INDEX IF NOT EXISTS idx_recurring_patient_id ON scheduling_schema.recurring_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_recurring_doctor_id ON scheduling_schema.recurring_appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_series_id ON scheduling_schema.recurring_appointments(series_id);
CREATE INDEX IF NOT EXISTS idx_recurring_is_active ON scheduling_schema.recurring_appointments(is_active);

-- =====================================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================================================
ALTER TABLE scheduling_schema.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_schema.appointment_read_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_schema.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_schema.recurring_appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- 8. CREATE RLS POLICIES
-- =====================================================================================

-- Service Role can do everything
CREATE POLICY "Service role has full access to appointments"
  ON scheduling_schema.appointments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to read models"
  ON scheduling_schema.appointment_read_models
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to queue"
  ON scheduling_schema.queue_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to recurring"
  ON scheduling_schema.recurring_appointments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================================================
-- 9. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================================================
CREATE OR REPLACE FUNCTION scheduling_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- 10. CREATE TRIGGERS
-- =====================================================================================
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON scheduling_schema.appointments
  FOR EACH ROW
  EXECUTE FUNCTION scheduling_schema.update_updated_at_column();

CREATE TRIGGER update_read_models_updated_at
  BEFORE UPDATE ON scheduling_schema.appointment_read_models
  FOR EACH ROW
  EXECUTE FUNCTION scheduling_schema.update_updated_at_column();

CREATE TRIGGER update_queue_updated_at
  BEFORE UPDATE ON scheduling_schema.queue_entries
  FOR EACH ROW
  EXECUTE FUNCTION scheduling_schema.update_updated_at_column();

CREATE TRIGGER update_recurring_updated_at
  BEFORE UPDATE ON scheduling_schema.recurring_appointments
  FOR EACH ROW
  EXECUTE FUNCTION scheduling_schema.update_updated_at_column();

-- =====================================================================================
-- END OF MIGRATION
-- =====================================================================================

