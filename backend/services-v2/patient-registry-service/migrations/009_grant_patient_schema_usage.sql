-- 009_grant_patient_schema_usage.sql
-- Ensure service_role can use patient_schema and execute patient ID sequence function

-- Grant usage on schema so RPC/function calls work
GRANT USAGE ON SCHEMA patient_schema TO service_role;

-- Grant privileges on sequences in schema for patient ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA patient_schema TO service_role;

-- Future sequences should automatically grant to service_role
ALTER DEFAULT PRIVILEGES IN SCHEMA patient_schema
GRANT USAGE, SELECT ON SEQUENCES TO service_role;
