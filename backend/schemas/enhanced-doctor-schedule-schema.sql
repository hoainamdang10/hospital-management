-- =====================================================
-- ENHANCED DOCTOR SCHEDULE SYSTEM SCHEMA
-- Comprehensive work schedule system for hospital management
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SCHEDULE TEMPLATES TABLE
-- Predefined schedule templates for different roles/departments
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_schedule_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL,
    department_id VARCHAR(20), -- Reference to departments
    description TEXT,
    default_start_time TIME NOT NULL DEFAULT '08:00',
    default_end_time TIME NOT NULL DEFAULT '17:00',
    default_break_start TIME DEFAULT '12:00',
    default_break_end TIME DEFAULT '13:00',
    default_slot_duration INTEGER DEFAULT 30, -- minutes
    default_buffer_time INTEGER DEFAULT 5, -- minutes between appointments
    max_appointments_per_day INTEGER DEFAULT 16,
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Monday to Friday
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ENHANCED DOCTOR WORK SCHEDULES TABLE
-- Main recurring schedule table with enhanced features
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_work_schedules_enhanced (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id VARCHAR(20) NOT NULL, -- Reference to doctors table
    template_id UUID REFERENCES doctor_schedule_templates(template_id),
    
    -- Schedule Details
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Break Times (can have multiple breaks)
    break_periods JSONB DEFAULT '[]'::JSONB, -- Array of {start_time, end_time, break_type}
    
    -- Appointment Configuration
    slot_duration INTEGER DEFAULT 30, -- minutes per appointment
    buffer_time INTEGER DEFAULT 5, -- minutes between appointments
    max_appointments INTEGER DEFAULT 16,
    
    -- Availability Settings
    is_available BOOLEAN DEFAULT true,
    availability_type VARCHAR(20) DEFAULT 'regular' CHECK (availability_type IN ('regular', 'emergency', 'consultation', 'surgery')),
    
    -- Department Specific Rules
    department_rules JSONB DEFAULT '{}'::JSONB, -- Department-specific scheduling rules
    
    -- Effective Period
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE, -- NULL means indefinite
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    CONSTRAINT valid_effective_period CHECK (effective_to IS NULL OR effective_from <= effective_to),
    UNIQUE(doctor_id, day_of_week, effective_from) -- One schedule per doctor per day per period
);

-- =====================================================
-- 3. SCHEDULE EXCEPTIONS TABLE
-- Handle holidays, leaves, special schedules
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_schedule_exceptions (
    exception_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id VARCHAR(20) NOT NULL,
    exception_date DATE NOT NULL,
    exception_type VARCHAR(20) NOT NULL CHECK (exception_type IN ('holiday', 'leave', 'sick_leave', 'special_schedule', 'emergency_duty')),
    
    -- Override Schedule (if special_schedule)
    override_start_time TIME,
    override_end_time TIME,
    override_break_periods JSONB DEFAULT '[]'::JSONB,
    override_max_appointments INTEGER,
    
    -- Status
    is_available BOOLEAN DEFAULT false, -- Most exceptions make doctor unavailable
    reason TEXT,
    approved_by UUID, -- Reference to admin who approved
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(doctor_id, exception_date)
);

-- =====================================================
-- 4. GENERATED APPOINTMENT SLOTS TABLE
-- Pre-generated available slots for efficient booking
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_appointment_slots (
    slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id VARCHAR(20) NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Slot Configuration
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    slot_type VARCHAR(20) DEFAULT 'regular' CHECK (slot_type IN ('regular', 'emergency', 'follow_up', 'consultation')),
    
    -- Availability Status
    is_available BOOLEAN DEFAULT true,
    is_blocked BOOLEAN DEFAULT false, -- Manually blocked by admin
    block_reason TEXT,
    
    -- Booking Information
    max_bookings INTEGER DEFAULT 1, -- Usually 1, but can be more for group sessions
    current_bookings INTEGER DEFAULT 0,
    
    -- Generated From
    generated_from_schedule_id UUID REFERENCES doctor_work_schedules_enhanced(schedule_id),
    generation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_slot_time CHECK (start_time < end_time),
    CONSTRAINT valid_bookings CHECK (current_bookings <= max_bookings),
    UNIQUE(doctor_id, slot_date, start_time) -- No overlapping slots
);

-- =====================================================
-- 5. DEPARTMENT SCHEDULING RULES TABLE
-- Department-specific scheduling configurations
-- =====================================================
CREATE TABLE IF NOT EXISTS department_scheduling_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id VARCHAR(20) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    
    -- Time Constraints
    min_appointment_duration INTEGER DEFAULT 15, -- minutes
    max_appointment_duration INTEGER DEFAULT 120, -- minutes
    default_appointment_duration INTEGER DEFAULT 30,
    buffer_time_between_appointments INTEGER DEFAULT 5,
    
    -- Daily Limits
    max_appointments_per_day INTEGER DEFAULT 20,
    max_emergency_slots_per_day INTEGER DEFAULT 5,
    
    -- Working Hours
    earliest_start_time TIME DEFAULT '07:00',
    latest_end_time TIME DEFAULT '20:00',
    
    -- Break Requirements
    mandatory_lunch_break BOOLEAN DEFAULT true,
    min_lunch_duration INTEGER DEFAULT 60, -- minutes
    max_continuous_work_hours INTEGER DEFAULT 6, -- hours before break required
    
    -- Special Rules
    allow_weekend_appointments BOOLEAN DEFAULT false,
    allow_holiday_appointments BOOLEAN DEFAULT false,
    emergency_coverage_required BOOLEAN DEFAULT true,
    
    -- Configuration
    rules_config JSONB DEFAULT '{}'::JSONB, -- Additional flexible rules
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(department_id, rule_name)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Schedule Templates
CREATE INDEX IF NOT EXISTS idx_schedule_templates_department ON doctor_schedule_templates(department_id);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_active ON doctor_schedule_templates(is_active);

-- Enhanced Work Schedules
CREATE INDEX IF NOT EXISTS idx_work_schedules_doctor ON doctor_work_schedules_enhanced(doctor_id);
CREATE INDEX IF NOT EXISTS idx_work_schedules_day ON doctor_work_schedules_enhanced(day_of_week);
CREATE INDEX IF NOT EXISTS idx_work_schedules_effective ON doctor_work_schedules_enhanced(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_work_schedules_active ON doctor_work_schedules_enhanced(is_active);

-- Schedule Exceptions
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_doctor ON doctor_schedule_exceptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_date ON doctor_schedule_exceptions(exception_date);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_type ON doctor_schedule_exceptions(exception_type);

-- Appointment Slots
CREATE INDEX IF NOT EXISTS idx_appointment_slots_doctor_date ON doctor_appointment_slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_available ON doctor_appointment_slots(is_available, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_time ON doctor_appointment_slots(slot_date, start_time);

-- Department Rules
CREATE INDEX IF NOT EXISTS idx_department_rules_dept ON department_scheduling_rules(department_id);
CREATE INDEX IF NOT EXISTS idx_department_rules_active ON department_scheduling_rules(is_active);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER trigger_schedule_templates_updated_at
    BEFORE UPDATE ON doctor_schedule_templates
    FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at();

CREATE TRIGGER trigger_work_schedules_updated_at
    BEFORE UPDATE ON doctor_work_schedules_enhanced
    FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at();

CREATE TRIGGER trigger_schedule_exceptions_updated_at
    BEFORE UPDATE ON doctor_schedule_exceptions
    FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at();

CREATE TRIGGER trigger_appointment_slots_updated_at
    BEFORE UPDATE ON doctor_appointment_slots
    FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at();

CREATE TRIGGER trigger_department_rules_updated_at
    BEFORE UPDATE ON department_scheduling_rules
    FOR EACH ROW EXECUTE FUNCTION update_schedule_updated_at();

-- =====================================================
-- DATABASE FUNCTIONS FOR SCHEDULE MANAGEMENT
-- =====================================================

-- Function to generate appointment slots for a doctor's schedule
CREATE OR REPLACE FUNCTION generate_doctor_appointment_slots(
    input_doctor_id VARCHAR(20),
    start_date DATE,
    end_date DATE
) RETURNS INTEGER AS $$
DECLARE
    current_date DATE;
    day_of_week INTEGER;
    schedule_record RECORD;
    exception_record RECORD;
    slot_start_time TIME;
    slot_end_time TIME;
    break_period JSONB;
    slots_generated INTEGER := 0;
BEGIN
    -- Loop through each date in the range
    FOR current_date IN SELECT generate_series(start_date, end_date, '1 day'::INTERVAL)::DATE
    LOOP
        day_of_week := EXTRACT(DOW FROM current_date); -- 0=Sunday, 6=Saturday

        -- Check for schedule exceptions first
        SELECT * INTO exception_record
        FROM doctor_schedule_exceptions
        WHERE doctor_id = input_doctor_id
        AND exception_date = current_date;

        -- If there's an exception and doctor is not available, skip this date
        IF FOUND AND NOT exception_record.is_available THEN
            CONTINUE;
        END IF;

        -- Get the doctor's regular schedule for this day
        SELECT * INTO schedule_record
        FROM doctor_work_schedules_enhanced
        WHERE doctor_id = input_doctor_id
        AND day_of_week = day_of_week
        AND is_active = true
        AND is_available = true
        AND (effective_from <= current_date)
        AND (effective_to IS NULL OR effective_to >= current_date);

        -- Skip if no schedule found for this day
        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        -- Use exception override times if available
        IF FOUND AND exception_record.exception_type = 'special_schedule' THEN
            slot_start_time := COALESCE(exception_record.override_start_time, schedule_record.start_time);
            slot_end_time := COALESCE(exception_record.override_end_time, schedule_record.end_time);
        ELSE
            slot_start_time := schedule_record.start_time;
            slot_end_time := schedule_record.end_time;
        END IF;

        -- Generate slots for this day
        WHILE slot_start_time + (schedule_record.slot_duration || ' minutes')::INTERVAL <= slot_end_time
        LOOP
            -- Check if this time conflicts with break periods
            DECLARE
                is_break_time BOOLEAN := false;
            BEGIN
                -- Check regular break periods
                FOR break_period IN SELECT jsonb_array_elements(schedule_record.break_periods)
                LOOP
                    IF slot_start_time >= (break_period->>'start_time')::TIME
                    AND slot_start_time < (break_period->>'end_time')::TIME THEN
                        is_break_time := true;
                        EXIT;
                    END IF;
                END LOOP;

                -- If not break time, insert the slot
                IF NOT is_break_time THEN
                    INSERT INTO doctor_appointment_slots (
                        doctor_id,
                        slot_date,
                        start_time,
                        end_time,
                        duration_minutes,
                        generated_from_schedule_id
                    ) VALUES (
                        input_doctor_id,
                        current_date,
                        slot_start_time,
                        slot_start_time + (schedule_record.slot_duration || ' minutes')::INTERVAL,
                        schedule_record.slot_duration,
                        schedule_record.schedule_id
                    )
                    ON CONFLICT (doctor_id, slot_date, start_time) DO NOTHING;

                    slots_generated := slots_generated + 1;
                END IF;
            END;

            -- Move to next slot (including buffer time)
            slot_start_time := slot_start_time +
                ((schedule_record.slot_duration + COALESCE(schedule_record.buffer_time, 0)) || ' minutes')::INTERVAL;
        END LOOP;
    END LOOP;

    RETURN slots_generated;
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots for a doctor on a specific date
CREATE OR REPLACE FUNCTION get_doctor_available_slots(
    input_doctor_id VARCHAR(20),
    input_date DATE
) RETURNS TABLE (
    slot_id UUID,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    is_available BOOLEAN,
    current_bookings INTEGER,
    max_bookings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.slot_id,
        s.start_time,
        s.end_time,
        s.duration_minutes,
        s.is_available AND NOT s.is_blocked AS is_available,
        s.current_bookings,
        s.max_bookings
    FROM doctor_appointment_slots s
    WHERE s.doctor_id = input_doctor_id
    AND s.slot_date = input_date
    AND s.is_available = true
    AND s.is_blocked = false
    AND s.current_bookings < s.max_bookings
    ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to check doctor availability for a specific date and time
CREATE OR REPLACE FUNCTION check_doctor_availability(
    input_doctor_id VARCHAR(20),
    input_date DATE,
    input_start_time TIME,
    input_duration INTEGER DEFAULT 30
) RETURNS BOOLEAN AS $$
DECLARE
    slot_count INTEGER;
    input_end_time TIME;
BEGIN
    input_end_time := input_start_time + (input_duration || ' minutes')::INTERVAL;

    -- Check if there's an available slot that covers the requested time
    SELECT COUNT(*) INTO slot_count
    FROM doctor_appointment_slots
    WHERE doctor_id = input_doctor_id
    AND slot_date = input_date
    AND start_time <= input_start_time
    AND end_time >= input_end_time
    AND is_available = true
    AND is_blocked = false
    AND current_bookings < max_bookings;

    RETURN slot_count > 0;
END;
$$ LANGUAGE plpgsql;
