-- Clinical EMR Service - Audit Logs Table
-- Stores security audit logs for HIPAA compliance
-- Migration: 006_create_audit_logs_table

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS clinical_schema.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action information
    action VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    success BOOLEAN NOT NULL DEFAULT true,
    
    -- User information
    user_id UUID NOT NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Resource information
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    patient_id UUID,
    
    -- Request information
    ip_address INET,
    user_agent TEXT,
    
    -- Details
    details JSONB DEFAULT '{}',
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON clinical_schema.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_id ON clinical_schema.audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON clinical_schema.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON clinical_schema.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON clinical_schema.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON clinical_schema.audit_logs(success);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp 
    ON clinical_schema.audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient_timestamp 
    ON clinical_schema.audit_logs(patient_id, timestamp DESC);

-- Add GIN index for JSONB columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON clinical_schema.audit_logs USING GIN(details);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON clinical_schema.audit_logs USING GIN(metadata);

-- Enable Row Level Security
ALTER TABLE clinical_schema.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own audit logs
CREATE POLICY audit_logs_select_own ON clinical_schema.audit_logs
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR 
        auth.jwt() ->> 'role' IN ('admin', 'SUPER_ADMIN')
    );

-- RLS Policy: Only service can insert audit logs
CREATE POLICY audit_logs_insert_service ON clinical_schema.audit_logs
    FOR INSERT
    WITH CHECK (true); -- Service role can insert

-- No UPDATE or DELETE - audit logs are immutable
-- Only DROP or TRUNCATE by superuser for data retention

-- Add comments for documentation
COMMENT ON TABLE clinical_schema.audit_logs IS 'Security audit logs for HIPAA compliance';
COMMENT ON COLUMN clinical_schema.audit_logs.action IS 'Audit action type (e.g., medical_record.accessed)';
COMMENT ON COLUMN clinical_schema.audit_logs.severity IS 'Severity level: info, warning, error, critical';
COMMENT ON COLUMN clinical_schema.audit_logs.patient_id IS 'Patient ID for PHI access tracking';
COMMENT ON COLUMN clinical_schema.audit_logs.details IS 'Additional context (JSONB)';
COMMENT ON COLUMN clinical_schema.audit_logs.timestamp IS 'When the action occurred';

-- Create function to auto-archive old audit logs (optional)
CREATE OR REPLACE FUNCTION clinical_schema.archive_old_audit_logs()
RETURNS void AS $$
BEGIN
    -- Archive audit logs older than 7 years (HIPAA requirement)
    -- This is a placeholder - implement according to your retention policy
    DELETE FROM clinical_schema.audit_logs
    WHERE timestamp < NOW() - INTERVAL '7 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON clinical_schema.audit_logs TO authenticated;
GRANT INSERT ON clinical_schema.audit_logs TO service_role;
GRANT ALL ON clinical_schema.audit_logs TO postgres;
