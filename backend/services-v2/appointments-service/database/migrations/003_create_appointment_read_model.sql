/**
 * Migration: Create Appointment Read Model Table
 * CQRS Read Model for denormalized appointment data with patient/doctor info
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @date 2025-01-12
 * @compliance Clean Architecture, CQRS, Event-Driven Architecture
 */

-- =====================================================
-- CREATE APPOINTMENT READ MODEL TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduling_schema.appointment_read_model (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT NOT NULL UNIQUE,
  
  -- Appointment Core Data (from Appointment aggregate)
  patient_id VARCHAR(20) NOT NULL,
  doctor_id VARCHAR(30) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  room_id VARCHAR(50),
  department_id VARCHAR(50),
  consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  additional_fees DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Denormalized Patient Data (from Patient Service events)
  patient_full_name VARCHAR(255),
  patient_phone VARCHAR(20),
  patient_email VARCHAR(255),
  patient_date_of_birth DATE,
  patient_gender VARCHAR(20),
  patient_national_id VARCHAR(20),
  patient_insurance_number VARCHAR(50),
  patient_insurance_type VARCHAR(20),
  patient_address TEXT,
  
  -- Denormalized Doctor Data (from Provider Service events)
  doctor_full_name VARCHAR(255),
  doctor_specialization VARCHAR(255),
  doctor_department VARCHAR(255),
  doctor_license_number VARCHAR(50),
  doctor_phone VARCHAR(20),
  doctor_email VARCHAR(255),
  
  -- Appointment Details
  reason TEXT,
  chief_complaint TEXT,
  symptoms JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  special_instructions TEXT,
  required_equipment JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  checked_in_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT appointment_read_model_patient_id_format 
    CHECK (patient_id ~ '^PAT-[0-9]{6}-[0-9]{3}$'),
  CONSTRAINT appointment_read_model_doctor_id_format 
    CHECK (doctor_id ~ '^[A-Z]{2,4}-DOC-[0-9]{6}-[0-9]{3}$'),
  CONSTRAINT appointment_read_model_duration_positive 
    CHECK (duration_minutes > 0),
  CONSTRAINT appointment_read_model_consultation_fee_non_negative 
    CHECK (consultation_fee >= 0)
);

-- =====================================================
-- CREATE INDEXES FOR FAST QUERIES
-- =====================================================

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_appointment_read_model_patient_id 
  ON scheduling_schema.appointment_read_model(patient_id);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_doctor_id 
  ON scheduling_schema.appointment_read_model(doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_appointment_date 
  ON scheduling_schema.appointment_read_model(appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_status 
  ON scheduling_schema.appointment_read_model(status);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_created_at 
  ON scheduling_schema.appointment_read_model(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_type 
  ON scheduling_schema.appointment_read_model(type);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_priority 
  ON scheduling_schema.appointment_read_model(priority);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_appointment_read_model_doctor_date 
  ON scheduling_schema.appointment_read_model(doctor_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_patient_date 
  ON scheduling_schema.appointment_read_model(patient_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_date_status 
  ON scheduling_schema.appointment_read_model(appointment_date, status);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_doctor_date_status 
  ON scheduling_schema.appointment_read_model(doctor_id, appointment_date, status);

-- JSONB indexes for symptoms and equipment
CREATE INDEX IF NOT EXISTS idx_appointment_read_model_symptoms_gin 
  ON scheduling_schema.appointment_read_model USING GIN (symptoms);

CREATE INDEX IF NOT EXISTS idx_appointment_read_model_equipment_gin 
  ON scheduling_schema.appointment_read_model USING GIN (required_equipment);

-- =====================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION scheduling_schema.update_appointment_read_model_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointment_read_model_updated_at
  BEFORE UPDATE ON scheduling_schema.appointment_read_model
  FOR EACH ROW
  EXECUTE FUNCTION scheduling_schema.update_appointment_read_model_updated_at();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE scheduling_schema.appointment_read_model IS 
  'CQRS Read Model: Denormalized view of appointments with patient and doctor information for fast queries. Updated via event handlers.';

COMMENT ON COLUMN scheduling_schema.appointment_read_model.appointment_id IS 
  'Business ID in format YYYY-APT-MMDDSS-NNN';

COMMENT ON COLUMN scheduling_schema.appointment_read_model.patient_id IS 
  'Soft reference to Patient Service (PAT-YYYYMM-XXX)';

COMMENT ON COLUMN scheduling_schema.appointment_read_model.doctor_id IS 
  'Soft reference to Provider Service (DEPT-DOC-YYYYMM-XXX)';

COMMENT ON COLUMN scheduling_schema.appointment_read_model.patient_full_name IS 
  'Denormalized from Patient Service - updated via PatientUpdatedEvent';

COMMENT ON COLUMN scheduling_schema.appointment_read_model.doctor_full_name IS 
  'Denormalized from Provider Service - updated via StaffUpdatedEvent';

COMMENT ON COLUMN scheduling_schema.appointment_read_model.synced_at IS 
  'Last time patient/doctor data was synced from source services';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to service role
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduling_schema.appointment_read_model TO service_role;
GRANT USAGE ON SCHEMA scheduling_schema TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table creation
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'scheduling_schema'
  AND table_name = 'appointment_read_model';

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'scheduling_schema'
  AND tablename = 'appointment_read_model'
ORDER BY indexname;

-- Verify constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'scheduling_schema'
  AND table_name = 'appointment_read_model'
ORDER BY constraint_type, constraint_name;

-- =====================================================
-- ROLLBACK SCRIPT (for reference)
-- =====================================================

/*
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_appointment_read_model_updated_at 
  ON scheduling_schema.appointment_read_model;

-- Drop function
DROP FUNCTION IF EXISTS scheduling_schema.update_appointment_read_model_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_patient_id;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_doctor_id;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_appointment_date;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_status;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_created_at;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_type;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_priority;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_doctor_date;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_patient_date;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_date_status;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_doctor_date_status;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_symptoms_gin;
DROP INDEX IF EXISTS scheduling_schema.idx_appointment_read_model_equipment_gin;

-- Drop table
DROP TABLE IF EXISTS scheduling_schema.appointment_read_model;
*/

