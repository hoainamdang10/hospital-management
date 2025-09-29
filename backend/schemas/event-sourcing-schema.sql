-- =====================================================
-- Event Sourcing Schema for Hospital Management System
-- Supports DDD, CQRS, and Event-Driven Architecture
-- =====================================================
-- @author Hospital Management Team
-- @version 1.0.0
-- @compliance HIPAA, Event Sourcing, CQRS

-- Create event sourcing schema
CREATE SCHEMA IF NOT EXISTS event_sourcing_schema;

-- Set search path for this schema
SET search_path TO event_sourcing_schema, public;

-- =====================================================
-- EVENT STREAMS TABLE
-- Stores all domain events for event sourcing
-- =====================================================
CREATE TABLE IF NOT EXISTS event_sourcing_schema.event_streams (
    -- Primary identification
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id VARCHAR(255) NOT NULL, -- Aggregate ID (patient_id, doctor_id, etc.)
    stream_type VARCHAR(100) NOT NULL, -- Aggregate type (Patient, Doctor, Appointment)
    
    -- Event metadata
    event_type VARCHAR(100) NOT NULL, -- Domain event type
    event_version INTEGER NOT NULL DEFAULT 1,
    sequence_number BIGSERIAL NOT NULL, -- Global sequence for ordering
    stream_sequence INTEGER NOT NULL, -- Sequence within stream
    
    -- Event data
    event_data JSONB NOT NULL, -- Event payload
    metadata JSONB DEFAULT '{}', -- Additional metadata
    
    -- Audit and compliance
    correlation_id UUID, -- For tracking related events
    causation_id UUID, -- Event that caused this event
    user_id UUID, -- User who triggered the event
    service_name VARCHAR(100) NOT NULL, -- Originating service
    
    -- HIPAA compliance fields
    patient_id UUID, -- For healthcare data tracking
    access_reason TEXT, -- Reason for data access
    phi_accessed BOOLEAN DEFAULT FALSE, -- Protected Health Information flag
    
    -- Timestamps
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(stream_id, stream_sequence),
    CHECK (sequence_number > 0),
    CHECK (stream_sequence > 0),
    CHECK (event_version > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_streams_stream_id ON event_sourcing_schema.event_streams(stream_id);
CREATE INDEX IF NOT EXISTS idx_event_streams_stream_type ON event_sourcing_schema.event_streams(stream_type);
CREATE INDEX IF NOT EXISTS idx_event_streams_event_type ON event_sourcing_schema.event_streams(event_type);
CREATE INDEX IF NOT EXISTS idx_event_streams_occurred_at ON event_sourcing_schema.event_streams(occurred_at);
CREATE INDEX IF NOT EXISTS idx_event_streams_patient_id ON event_sourcing_schema.event_streams(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_streams_correlation_id ON event_sourcing_schema.event_streams(correlation_id) WHERE correlation_id IS NOT NULL;

-- =====================================================
-- AGGREGATE SNAPSHOTS TABLE
-- Stores aggregate state snapshots for performance
-- =====================================================
CREATE TABLE IF NOT EXISTS event_sourcing_schema.aggregate_snapshots (
    -- Primary identification
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_id VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    
    -- Snapshot metadata
    version INTEGER NOT NULL,
    last_event_sequence INTEGER NOT NULL,
    
    -- Snapshot data
    snapshot_data JSONB NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    
    -- Constraints
    UNIQUE(aggregate_id, version),
    CHECK (version > 0),
    CHECK (last_event_sequence > 0)
);

-- Indexes for snapshots
CREATE INDEX IF NOT EXISTS idx_snapshots_aggregate_id ON event_sourcing_schema.aggregate_snapshots(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_aggregate_type ON event_sourcing_schema.aggregate_snapshots(aggregate_type);
CREATE INDEX IF NOT EXISTS idx_snapshots_version ON event_sourcing_schema.aggregate_snapshots(aggregate_id, version DESC);

-- =====================================================
-- SAGA INSTANCES TABLE
-- Manages long-running business processes
-- =====================================================
CREATE TABLE IF NOT EXISTS event_sourcing_schema.saga_instances (
    -- Primary identification
    saga_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saga_type VARCHAR(100) NOT NULL,
    
    -- Saga state
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL,
    
    -- Saga data
    saga_data JSONB NOT NULL DEFAULT '{}',
    compensation_data JSONB DEFAULT '{}',
    
    -- Timing and timeouts
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timeout_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Error handling
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    
    -- Correlation
    correlation_id UUID,
    initiating_user_id UUID,
    
    -- Healthcare context
    patient_id UUID, -- For healthcare workflows
    appointment_id UUID, -- For appointment-related sagas
    
    -- Constraints
    CHECK (status IN ('running', 'completed', 'failed', 'compensating', 'compensated')),
    CHECK (current_step > 0),
    CHECK (total_steps > 0),
    CHECK (current_step <= total_steps),
    CHECK (retry_count >= 0),
    CHECK (max_retries >= 0)
);

-- Indexes for saga management
CREATE INDEX IF NOT EXISTS idx_saga_instances_type ON event_sourcing_schema.saga_instances(saga_type);
CREATE INDEX IF NOT EXISTS idx_saga_instances_status ON event_sourcing_schema.saga_instances(status);
CREATE INDEX IF NOT EXISTS idx_saga_instances_timeout ON event_sourcing_schema.saga_instances(timeout_at) WHERE timeout_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saga_instances_patient ON event_sourcing_schema.saga_instances(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saga_instances_correlation ON event_sourcing_schema.saga_instances(correlation_id) WHERE correlation_id IS NOT NULL;

-- =====================================================
-- PROJECTION CHECKPOINTS TABLE
-- Tracks read model projection progress
-- =====================================================
CREATE TABLE IF NOT EXISTS event_sourcing_schema.projection_checkpoints (
    -- Primary identification
    projection_name VARCHAR(100) PRIMARY KEY,
    
    -- Checkpoint data
    last_processed_sequence BIGINT NOT NULL DEFAULT 0,
    last_processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    error_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CHECK (status IN ('active', 'paused', 'error', 'rebuilding')),
    CHECK (last_processed_sequence >= 0),
    CHECK (error_count >= 0)
);

-- =====================================================
-- DOMAIN EVENT TYPES TABLE
-- Registry of all domain event types
-- =====================================================
CREATE TABLE IF NOT EXISTS event_sourcing_schema.domain_event_types (
    -- Primary identification
    event_type VARCHAR(100) PRIMARY KEY,
    
    -- Event metadata
    aggregate_type VARCHAR(100) NOT NULL,
    description TEXT,
    schema_version INTEGER NOT NULL DEFAULT 1,
    
    -- Event schema (JSON Schema)
    event_schema JSONB,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Constraints
    CHECK (schema_version > 0)
);

-- Insert initial domain event types for healthcare
INSERT INTO event_sourcing_schema.domain_event_types (event_type, aggregate_type, description) VALUES
('PatientRegistered', 'Patient', 'Patient was registered in the system'),
('PatientUpdated', 'Patient', 'Patient information was updated'),
('PatientDeactivated', 'Patient', 'Patient account was deactivated'),
('DoctorRegistered', 'Doctor', 'Doctor was registered in the system'),
('DoctorScheduleUpdated', 'Doctor', 'Doctor schedule was modified'),
('AppointmentScheduled', 'Appointment', 'New appointment was scheduled'),
('AppointmentCancelled', 'Appointment', 'Appointment was cancelled'),
('AppointmentCompleted', 'Appointment', 'Appointment was completed'),
('MedicalRecordCreated', 'MedicalRecord', 'New medical record was created'),
('DiagnosisAdded', 'MedicalRecord', 'Diagnosis was added to medical record'),
('PaymentProcessed', 'Payment', 'Payment was successfully processed'),
('PaymentFailed', 'Payment', 'Payment processing failed')
ON CONFLICT (event_type) DO NOTHING;

-- =====================================================
-- RLS POLICIES FOR HIPAA COMPLIANCE
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE event_sourcing_schema.event_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sourcing_schema.aggregate_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sourcing_schema.saga_instances ENABLE ROW LEVEL SECURITY;

-- Event streams policies
CREATE POLICY "event_streams_service_isolation" ON event_sourcing_schema.event_streams
    FOR ALL USING (
        service_name = current_setting('app.service_name', true) OR
        current_setting('app.service_name', true) = 'admin-orchestrator'
    );

-- Healthcare data access policy
CREATE POLICY "event_streams_healthcare_access" ON event_sourcing_schema.event_streams
    FOR SELECT USING (
        patient_id IS NULL OR
        patient_id::text = current_setting('app.patient_id', true) OR
        current_setting('app.role', true) IN ('doctor', 'admin', 'receptionist')
    );

-- Saga instances policies
CREATE POLICY "saga_instances_service_access" ON event_sourcing_schema.saga_instances
    FOR ALL USING (
        current_setting('app.service_name', true) IN ('admin-orchestrator', 'appointment-service', 'patient-service', 'doctor-service')
    );

-- Comments for documentation
COMMENT ON SCHEMA event_sourcing_schema IS 'Event Sourcing schema for Hospital Management System - supports DDD, CQRS, and Event-Driven Architecture with HIPAA compliance';
COMMENT ON TABLE event_sourcing_schema.event_streams IS 'Stores all domain events for event sourcing with healthcare compliance';
COMMENT ON TABLE event_sourcing_schema.aggregate_snapshots IS 'Performance optimization through aggregate state snapshots';
COMMENT ON TABLE event_sourcing_schema.saga_instances IS 'Manages long-running healthcare business processes';
COMMENT ON TABLE event_sourcing_schema.projection_checkpoints IS 'Tracks read model projection progress for CQRS';
COMMENT ON TABLE event_sourcing_schema.domain_event_types IS 'Registry of all domain event types with schemas';
