-- 006_add_patient_sequence_function.sql
-- Add database function to generate unique patient IDs using sequence
-- Prevents ID collisions under high concurrency

-- Create sequence for patient IDs per month
CREATE SEQUENCE IF NOT EXISTS patient_schema.patient_id_sequence_2025_01 START 1 INCREMENT 1 MAXVALUE 999;

-- Create function to get next patient sequence
-- This function ensures thread-safe ID generation
CREATE OR REPLACE FUNCTION patient_schema.get_next_patient_sequence(year_month TEXT)
RETURNS INTEGER AS $$
DECLARE
  seq_name TEXT;
  next_val INTEGER;
BEGIN
  -- Construct sequence name: patient_id_sequence_YYYYMM
  seq_name := 'patient_id_sequence_' || year_month;
  
  -- Create sequence if it doesn't exist
  EXECUTE 'CREATE SEQUENCE IF NOT EXISTS patient_schema.' || quote_ident(seq_name) || 
          ' START 1 INCREMENT 1 MAXVALUE 999';
  
  -- Get next value from sequence
  EXECUTE 'SELECT nextval(''patient_schema.' || quote_ident(seq_name) || ''')' INTO next_val;
  
  RETURN next_val;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION patient_schema.get_next_patient_sequence(TEXT) TO service_role;

-- Create index on patient_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patient_schema.patients(patient_id);

-- Add comment
COMMENT ON FUNCTION patient_schema.get_next_patient_sequence(TEXT) IS 
'Generates next patient ID sequence number for given year-month. Thread-safe using database sequences.';
