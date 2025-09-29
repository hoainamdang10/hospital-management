-- Receptionist Service - Database Schema Initialization
-- This script ensures all necessary tables and functions exist for receptionist service

-- ============================================
-- 1. ENSURE RECEPTIONIST TABLE EXISTS
-- ============================================

-- Create receptionist table if not exists
CREATE TABLE IF NOT EXISTS receptionist (
    receptionist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    department_id VARCHAR(20) REFERENCES departments(department_id),
    shift_schedule JSONB DEFAULT '{}',
    access_permissions JSONB DEFAULT '{
        "can_manage_appointments": true,
        "can_manage_patients": true,
        "can_view_medical_records": false
    }',
    can_manage_appointments BOOLEAN DEFAULT true,
    can_manage_patients BOOLEAN DEFAULT true,
    can_view_medical_records BOOLEAN DEFAULT false,
    languages_spoken TEXT[] DEFAULT ARRAY['Vietnamese'],
    status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES profiles(id)
);

-- ============================================
-- 2. ENSURE PATIENT CHECK-IN TABLE EXISTS
-- ============================================

-- Create patient check-ins table if not exists
CREATE TABLE IF NOT EXISTS patient_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(50) REFERENCES patients(patient_id),
    appointment_id VARCHAR(50) REFERENCES appointments(appointment_id),
    receptionist_id UUID REFERENCES receptionist(receptionist_id),
    check_in_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    insurance_verified BOOLEAN DEFAULT false,
    documents_complete BOOLEAN DEFAULT true,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'checked_in',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. ADD RECEPTIONIST FIELDS TO APPOINTMENTS
-- ============================================

-- Add receptionist-related fields to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS receptionist_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS insurance_verified BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS queue_position INTEGER;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS estimated_wait_time INTEGER;

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Receptionist table indexes
CREATE INDEX IF NOT EXISTS idx_receptionist_profile_id ON receptionist(profile_id);
CREATE INDEX IF NOT EXISTS idx_receptionist_department_id ON receptionist(department_id);
CREATE INDEX IF NOT EXISTS idx_receptionist_status ON receptionist(status);
CREATE INDEX IF NOT EXISTS idx_receptionist_is_active ON receptionist(is_active);

-- Patient check-ins indexes
CREATE INDEX IF NOT EXISTS idx_patient_check_ins_patient_id ON patient_check_ins(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_check_ins_appointment_id ON patient_check_ins(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_check_ins_receptionist_id ON patient_check_ins(receptionist_id);
CREATE INDEX IF NOT EXISTS idx_patient_check_ins_check_in_time ON patient_check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_patient_check_ins_status ON patient_check_ins(status);

-- Appointments indexes for receptionist queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_queue_position ON appointments(queue_position);

-- ============================================
-- 5. CREATE RECEPTIONIST FUNCTIONS
-- ============================================

-- Function to generate receptionist ID
CREATE OR REPLACE FUNCTION generate_receptionist_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INT;
BEGIN
    -- Get current month/year
    SELECT 
        'REC-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || 
        LPAD((COUNT(*) + 1)::TEXT, 3, '0')
    INTO new_id
    FROM receptionist 
    WHERE receptionist_id LIKE 'REC-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-%';
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create receptionist with auto-generated ID
CREATE OR REPLACE FUNCTION create_receptionist(receptionist_data JSONB)
RETURNS TABLE(
    receptionist_id UUID,
    profile_id UUID,
    full_name TEXT,
    department_id TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    new_receptionist_id UUID;
BEGIN
    -- Generate new receptionist ID
    new_receptionist_id := gen_random_uuid();
    
    -- Insert receptionist record
    INSERT INTO receptionist (
        receptionist_id,
        profile_id,
        full_name,
        department_id,
        shift_schedule,
        access_permissions,
        can_manage_appointments,
        can_manage_patients,
        can_view_medical_records,
        languages_spoken,
        status,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        new_receptionist_id,
        (receptionist_data->>'profile_id')::UUID,
        receptionist_data->>'full_name',
        receptionist_data->>'department_id',
        COALESCE(receptionist_data->'shift_schedule', '{}'),
        COALESCE(receptionist_data->'access_permissions', '{
            "can_manage_appointments": true,
            "can_manage_patients": true,
            "can_view_medical_records": false
        }'),
        COALESCE((receptionist_data->>'can_manage_appointments')::BOOLEAN, true),
        COALESCE((receptionist_data->>'can_manage_patients')::BOOLEAN, true),
        COALESCE((receptionist_data->>'can_view_medical_records')::BOOLEAN, false),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(receptionist_data->'languages_spoken')),
            ARRAY['Vietnamese']
        ),
        COALESCE(receptionist_data->>'status', 'active'),
        COALESCE((receptionist_data->>'is_active')::BOOLEAN, true),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Return the created receptionist
    RETURN QUERY
    SELECT 
        r.receptionist_id,
        r.profile_id,
        r.full_name,
        r.department_id,
        r.status,
        r.created_at
    FROM receptionist r
    WHERE r.receptionist_id = new_receptionist_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get queue for today
CREATE OR REPLACE FUNCTION get_today_queue()
RETURNS TABLE(
    appointment_id VARCHAR(50),
    patient_id VARCHAR(50),
    patient_name TEXT,
    doctor_name TEXT,
    appointment_time TIME,
    status VARCHAR(50),
    check_in_time TIMESTAMPTZ,
    queue_position INTEGER,
    estimated_wait_time INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.appointment_id,
        a.patient_id,
        p_prof.full_name as patient_name,
        d_prof.full_name as doctor_name,
        a.appointment_time,
        a.status,
        ci.check_in_time,
        a.queue_position,
        a.estimated_wait_time
    FROM appointments a
    LEFT JOIN patients pat ON a.patient_id = pat.patient_id
    LEFT JOIN profiles p_prof ON pat.profile_id = p_prof.id
    LEFT JOIN doctors doc ON a.doctor_id = doc.doctor_id
    LEFT JOIN profiles d_prof ON doc.profile_id = d_prof.id
    LEFT JOIN patient_check_ins ci ON a.appointment_id = ci.appointment_id
    WHERE a.appointment_date = CURRENT_DATE
    AND a.status IN ('scheduled', 'checked_in', 'in_progress')
    ORDER BY a.appointment_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get receptionist dashboard stats
CREATE OR REPLACE FUNCTION get_receptionist_dashboard_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'todayAppointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE appointment_date = target_date
        ),
        'checkedInPatients', (
            SELECT COUNT(*) FROM patient_check_ins 
            WHERE DATE(check_in_time) = target_date
        ),
        'pendingCheckIns', (
            SELECT COUNT(*) FROM appointments 
            WHERE appointment_date = target_date AND status = 'scheduled'
        ),
        'completedAppointments', (
            SELECT COUNT(*) FROM appointments 
            WHERE appointment_date = target_date AND status = 'completed'
        ),
        'averageWaitTime', 15, -- Mock value for now
        'totalRevenue', 0 -- Will be calculated from payments
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for receptionist table
DROP TRIGGER IF EXISTS update_receptionist_updated_at ON receptionist;
CREATE TRIGGER update_receptionist_updated_at
    BEFORE UPDATE ON receptionist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions for service role
-- Note: These should be run with appropriate database admin privileges

-- GRANT SELECT, INSERT, UPDATE, DELETE ON receptionist TO service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON patient_check_ins TO service_role;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
