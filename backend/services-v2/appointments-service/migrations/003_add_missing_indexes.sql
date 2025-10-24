-- =====================================================================================
-- SCHEDULING SERVICE - PERFORMANCE OPTIMIZATION
-- Migration 003: Add Missing Indexes
-- =====================================================================================
-- Author: Hospital Management Team
-- Version: 3.0.2
-- Date: 2025-01-07
-- Purpose: Add missing indexes for common queries
-- =====================================================================================

-- =====================================================================================
-- 1. ADD MISSING INDEXES FOR WAITING_QUEUE
-- =====================================================================================

-- Index for date-based queue queries
CREATE INDEX IF NOT EXISTS idx_queue_date_status
  ON scheduling_schema.waiting_queue(
    (check_in_time::date), 
    status
  );

-- Index for department-based queries
CREATE INDEX IF NOT EXISTS idx_queue_department
  ON scheduling_schema.waiting_queue(department_id)
  WHERE department_id IS NOT NULL;

-- =====================================================================================
-- 2. ADD MISSING INDEXES FOR APPOINTMENT_SLOTS
-- =====================================================================================

-- Index for room-based queries
CREATE INDEX IF NOT EXISTS idx_slots_room_id
  ON scheduling_schema.appointment_slots(room_id)
  WHERE room_id IS NOT NULL;

-- Index for department-based queries
CREATE INDEX IF NOT EXISTS idx_slots_department
  ON scheduling_schema.appointment_slots(department_id)
  WHERE department_id IS NOT NULL;

-- =====================================================================================
-- 3. ADD MISSING INDEXES FOR APPOINTMENT_READ_MODEL
-- =====================================================================================

-- Index for department-based queries
CREATE INDEX IF NOT EXISTS idx_appointment_read_model_department_id
  ON scheduling_schema.appointment_read_model(department_id)
  WHERE department_id IS NOT NULL;

-- Index for room-based queries
CREATE INDEX IF NOT EXISTS idx_appointment_read_model_room_id
  ON scheduling_schema.appointment_read_model(room_id)
  WHERE room_id IS NOT NULL;

-- =====================================================================================
-- 4. ADD COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================================================

-- Appointments: doctor + status (for doctor dashboard)
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_status
  ON scheduling_schema.appointments(doctor_id, status);

-- Appointments: patient + status (for patient portal)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_status
  ON scheduling_schema.appointments(patient_id, status);

-- Appointments: date range queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_time
  ON scheduling_schema.appointments(appointment_date, appointment_time);

-- Appointments: department + date (for department scheduling)
CREATE INDEX IF NOT EXISTS idx_appointments_department_date
  ON scheduling_schema.appointments(department_id, appointment_date)
  WHERE department_id IS NOT NULL;

-- =====================================================================================
-- 5. ADD COVERING INDEXES FOR PERFORMANCE
-- =====================================================================================

-- Covering index for patient appointment list
CREATE INDEX IF NOT EXISTS idx_appointments_patient_covering
  ON scheduling_schema.appointments(
    patient_id, 
    appointment_date, 
    status
  ) INCLUDE (
    appointment_id, 
    doctor_id, 
    appointment_time,
    type,
    consultation_fee
  );

-- Covering index for doctor appointment list
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_covering
  ON scheduling_schema.appointments(
    doctor_id, 
    appointment_date, 
    status
  ) INCLUDE (
    appointment_id, 
    patient_id, 
    appointment_time,
    type,
    room_id
  );

-- =====================================================================================
-- 6. ADD INDEXES FOR APPOINTMENT_TEMPLATES
-- =====================================================================================

-- Index for template name search
CREATE INDEX IF NOT EXISTS idx_appointment_templates_name
  ON scheduling_schema.appointment_templates(template_name);

-- Index for doctor templates
CREATE INDEX IF NOT EXISTS idx_appointment_templates_doctor
  ON scheduling_schema.appointment_templates(doctor_id)
  WHERE doctor_id IS NOT NULL;

-- =====================================================================================
-- 7. ADD UNIQUE CONSTRAINT FOR QUEUE NUMBER
-- =====================================================================================

-- Prevent duplicate queue numbers for same doctor/date
CREATE UNIQUE INDEX IF NOT EXISTS unique_queue_number_per_doctor_date
  ON scheduling_schema.waiting_queue(
    doctor_id, 
    (check_in_time::date), 
    queue_number
  );

-- =====================================================================================
-- 8. ADD PARTIAL INDEXES FOR FILTERED QUERIES
-- =====================================================================================

-- Index for active appointments only
CREATE INDEX IF NOT EXISTS idx_appointments_active
  ON scheduling_schema.appointments(appointment_date, doctor_id)
  WHERE status IN ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS');

-- Index for pending payments
CREATE INDEX IF NOT EXISTS idx_appointments_pending_payment
  ON scheduling_schema.appointments(patient_id, payment_status)
  WHERE payment_status IN ('PENDING', 'PARTIALLY_PAID');

-- Index for today's queue
CREATE INDEX IF NOT EXISTS idx_queue_today
  ON scheduling_schema.waiting_queue(doctor_id, queue_number, status)
  WHERE (check_in_time::date) = CURRENT_DATE;

-- =====================================================================================
-- 9. ADD GIN INDEXES FOR ARRAY SEARCHES
-- =====================================================================================

-- Index for symptoms search in appointments
CREATE INDEX IF NOT EXISTS idx_appointments_symptoms_gin
  ON scheduling_schema.appointments USING gin(symptoms)
  WHERE symptoms IS NOT NULL;

-- Index for equipment search in appointments
CREATE INDEX IF NOT EXISTS idx_appointments_equipment_gin
  ON scheduling_schema.appointments USING gin(required_equipment)
  WHERE required_equipment IS NOT NULL;

-- =====================================================================================
-- 10. ADD INDEXES FOR AUDIT QUERIES
-- =====================================================================================

-- Index for audit log queries by date range
CREATE INDEX IF NOT EXISTS idx_audit_timestamp_user
  ON scheduling_schema.appointment_audit_logs(timestamp DESC, user_id);

-- Index for PHI access log queries
CREATE INDEX IF NOT EXISTS idx_phi_access_timestamp_user
  ON scheduling_schema.phi_access_logs(timestamp DESC, user_id);

-- Index for audit by appointment
CREATE INDEX IF NOT EXISTS idx_audit_appointment_timestamp
  ON scheduling_schema.appointment_audit_logs(appointment_id, timestamp DESC);

-- =====================================================================================
-- END OF MIGRATION 003
-- =====================================================================================

