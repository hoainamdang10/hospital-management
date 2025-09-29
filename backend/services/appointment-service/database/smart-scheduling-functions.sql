-- =====================================================
-- SMART SCHEDULING DATABASE FUNCTIONS
-- Enhanced Appointment Service with AI-powered features
-- =====================================================

-- 1. FIND OPTIMAL TIME SLOTS
-- =====================================================
CREATE OR REPLACE FUNCTION find_optimal_time_slots(
  input_doctor_id TEXT,
  input_date DATE,
  duration_minutes INTEGER DEFAULT 30,
  preferences JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE (
  suggested_time TIME,
  availability_score NUMERIC,
  confidence_level TEXT,
  reasoning TEXT,
  conflict_risk TEXT
) AS $$
DECLARE
  start_hour INTEGER := 8;  -- 8 AM
  end_hour INTEGER := 17;   -- 5 PM
  slot_interval INTEGER := 30; -- 30 minutes
  current_time TIME;
  score NUMERIC;
  conflicts INTEGER;
  patient_preference TEXT;
BEGIN
  -- Extract preferences
  patient_preference := COALESCE(preferences->>'preferred_time', 'any');
  
  -- Generate time slots and calculate scores
  FOR current_time IN 
    SELECT generate_series(
      (start_hour || ':00')::TIME, 
      (end_hour || ':00')::TIME, 
      (slot_interval || ' minutes')::INTERVAL
    )::TIME
  LOOP
    -- Check for existing appointments (conflicts)
    SELECT COUNT(*) INTO conflicts
    FROM appointments
    WHERE doctor_id = input_doctor_id
      AND appointment_date = input_date
      AND appointment_time <= current_time
      AND (appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIME > current_time
      AND status NOT IN ('cancelled', 'no_show');
    
    -- Skip if there are conflicts
    IF conflicts > 0 THEN
      CONTINUE;
    END IF;
    
    -- Calculate availability score (0-100)
    score := 100;
    
    -- Reduce score for early morning (before 9 AM)
    IF current_time < '09:00'::TIME THEN
      score := score - 20;
    END IF;
    
    -- Reduce score for late afternoon (after 4 PM)
    IF current_time > '16:00'::TIME THEN
      score := score - 15;
    END IF;
    
    -- Boost score for preferred times
    IF patient_preference = 'morning' AND current_time BETWEEN '09:00'::TIME AND '12:00'::TIME THEN
      score := score + 15;
    ELSIF patient_preference = 'afternoon' AND current_time BETWEEN '13:00'::TIME AND '16:00'::TIME THEN
      score := score + 15;
    END IF;
    
    -- Check doctor's typical schedule (boost score for usual working hours)
    IF current_time BETWEEN '09:00'::TIME AND '17:00'::TIME THEN
      score := score + 10;
    END IF;
    
    -- Return the slot
    suggested_time := current_time;
    availability_score := score;
    confidence_level := CASE 
      WHEN score >= 90 THEN 'HIGH'
      WHEN score >= 70 THEN 'MEDIUM'
      ELSE 'LOW'
    END;
    reasoning := CASE 
      WHEN score >= 90 THEN 'Optimal time slot with no conflicts'
      WHEN score >= 70 THEN 'Good time slot with minor considerations'
      ELSE 'Available but not ideal timing'
    END;
    conflict_risk := 'LOW';
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 2. SMART CONFLICT DETECTION
-- =====================================================
CREATE OR REPLACE FUNCTION detect_smart_conflicts(
  input_doctor_id TEXT,
  input_date DATE,
  input_start_time TIME,
  input_end_time TIME,
  exclude_appointment_id TEXT DEFAULT NULL
) RETURNS TABLE (
  conflict_type TEXT,
  conflict_severity TEXT,
  conflicting_appointment_id TEXT,
  suggested_resolution TEXT,
  alternative_times JSONB
) AS $$
DECLARE
  conflict_count INTEGER;
  buffer_minutes INTEGER := 15; -- Buffer time between appointments
  alternative_slots JSONB := '[]'::JSONB;
BEGIN
  -- Check for direct time conflicts
  SELECT COUNT(*) INTO conflict_count
  FROM appointments
  WHERE doctor_id = input_doctor_id
    AND appointment_date = input_date
    AND (
      (appointment_time <= input_start_time AND (appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIME > input_start_time) OR
      (appointment_time < input_end_time AND (appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIME >= input_end_time) OR
      (appointment_time >= input_start_time AND (appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIME <= input_end_time)
    )
    AND status NOT IN ('cancelled', 'no_show')
    AND (exclude_appointment_id IS NULL OR appointment_id != exclude_appointment_id);
  
  -- If direct conflicts found
  IF conflict_count > 0 THEN
    -- Get conflicting appointment details
    FOR conflicting_appointment_id IN 
      SELECT appointment_id
      FROM appointments 
      WHERE doctor_id = input_doctor_id 
        AND appointment_date = input_date
        AND (
          (appointment_time <= input_start_time AND (appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIME > input_start_time) OR
          (appointment_time < input_end_time AND (appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIME >= input_end_time) OR
          (appointment_time >= input_start_time AND (appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIME <= input_end_time)
        )
        AND status NOT IN ('cancelled', 'no_show')
        AND (exclude_appointment_id IS NULL OR appointment_id != exclude_appointment_id)
    LOOP
      conflict_type := 'DIRECT_OVERLAP';
      conflict_severity := 'HIGH';
      suggested_resolution := 'Reschedule to alternative time slot';
      
      -- Generate alternative time slots
      SELECT jsonb_agg(
        jsonb_build_object(
          'time', suggested_time,
          'score', availability_score
        )
      ) INTO alternative_slots
      FROM find_optimal_time_slots(input_doctor_id, input_date, 30)
      WHERE suggested_time != input_start_time
      LIMIT 3;
      
      alternative_times := alternative_slots;
      
      RETURN NEXT;
    END LOOP;
  END IF;
  
  -- Check for buffer time conflicts (appointments too close)
  SELECT COUNT(*) INTO conflict_count
  FROM appointments 
  WHERE doctor_id = input_doctor_id 
    AND appointment_date = input_date
    AND (
      ((appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIME > (input_start_time - (buffer_minutes || ' minutes')::INTERVAL) AND
       (appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIME <= input_start_time) OR
      (appointment_time >= input_end_time AND
       appointment_time < (input_end_time + (buffer_minutes || ' minutes')::INTERVAL))
    )
    AND status NOT IN ('cancelled', 'no_show')
    AND (exclude_appointment_id IS NULL OR appointment_id != exclude_appointment_id);
  
  -- If buffer conflicts found
  IF conflict_count > 0 THEN
    conflict_type := 'INSUFFICIENT_BUFFER';
    conflict_severity := 'MEDIUM';
    conflicting_appointment_id := NULL;
    suggested_resolution := 'Consider adding buffer time between appointments';
    alternative_times := '[]'::JSONB;
    
    RETURN NEXT;
  END IF;
  
  -- If no conflicts
  IF conflict_count = 0 THEN
    conflict_type := 'NONE';
    conflict_severity := 'NONE';
    conflicting_appointment_id := NULL;
    suggested_resolution := 'Time slot is available';
    alternative_times := '[]'::JSONB;
    
    RETURN NEXT;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 3. SUGGEST RESCHEDULE OPTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION suggest_reschedule_options(
  input_appointment_id TEXT,
  preferred_date_range DATERANGE DEFAULT NULL
) RETURNS TABLE (
  suggested_date DATE,
  suggested_time TIME,
  availability_score NUMERIC,
  reason TEXT,
  doctor_preference BOOLEAN,
  patient_convenience BOOLEAN
) AS $$
DECLARE
  appointment_record RECORD;
  search_start_date DATE;
  search_end_date DATE;
  current_date DATE;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM appointments 
  WHERE appointment_id = input_appointment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found: %', input_appointment_id;
  END IF;
  
  -- Set search date range
  search_start_date := COALESCE(lower(preferred_date_range), CURRENT_DATE + 1);
  search_end_date := COALESCE(upper(preferred_date_range), CURRENT_DATE + 30);
  
  -- Search for alternative slots
  FOR current_date IN 
    SELECT generate_series(search_start_date, search_end_date, '1 day'::INTERVAL)::DATE
  LOOP
    -- Skip weekends (assuming clinic is closed)
    IF EXTRACT(DOW FROM current_date) IN (0, 6) THEN
      CONTINUE;
    END IF;
    
    -- Get optimal time slots for this date
    FOR suggested_time, availability_score IN
      SELECT s.suggested_time, s.availability_score
      FROM find_optimal_time_slots(
        appointment_record.doctor_id, 
        current_date, 
        30
      ) s
      WHERE s.availability_score >= 70
      ORDER BY s.availability_score DESC
      LIMIT 3
    LOOP
      suggested_date := current_date;
      reason := 'High availability with good timing';
      doctor_preference := availability_score >= 85;
      patient_convenience := suggested_time BETWEEN '09:00'::TIME AND '16:00'::TIME;
      
      RETURN NEXT;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 4. BATCH UPDATE APPOINTMENTS
-- =====================================================
CREATE OR REPLACE FUNCTION batch_update_appointments(
  updates JSONB
) RETURNS TABLE (
  appointment_id TEXT,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  update_item JSONB;
  current_appointment_id TEXT;
  update_data JSONB;
BEGIN
  -- Process each update in the batch
  FOR update_item IN SELECT jsonb_array_elements(updates)
  LOOP
    current_appointment_id := update_item->>'appointment_id';
    update_data := update_item->'data';
    
    BEGIN
      -- Perform the update
      UPDATE appointments 
      SET 
        appointment_date = COALESCE((update_data->>'appointment_date')::DATE, appointment_date),
        start_time = COALESCE((update_data->>'start_time')::TIME, start_time),
        end_time = COALESCE((update_data->>'end_time')::TIME, end_time),
        status = COALESCE(update_data->>'status', status),
        notes = COALESCE(update_data->>'notes', notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE appointments.appointment_id = current_appointment_id;
      
      -- Check if update was successful
      IF FOUND THEN
        appointment_id := current_appointment_id;
        success := TRUE;
        error_message := NULL;
      ELSE
        appointment_id := current_appointment_id;
        success := FALSE;
        error_message := 'Appointment not found';
      END IF;
      
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      appointment_id := current_appointment_id;
      success := FALSE;
      error_message := SQLERRM;
      
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE MATERIALIZED VIEW FOR DOCTOR AVAILABILITY
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS doctor_availability_view AS
SELECT 
  d.doctor_id,
  d.full_name as doctor_name,
  d.specialty,
  generate_series(
    CURRENT_DATE, 
    CURRENT_DATE + INTERVAL '30 days', 
    '1 day'::INTERVAL
  )::DATE as date,
  CASE 
    WHEN EXTRACT(DOW FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day'::INTERVAL)) IN (0, 6) 
    THEN FALSE 
    ELSE TRUE 
  END as is_working_day,
  COALESCE(
    (
      SELECT COUNT(*)
      FROM appointments a 
      WHERE a.doctor_id = d.doctor_id 
        AND a.appointment_date = generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day'::INTERVAL)::DATE
        AND a.status NOT IN ('cancelled', 'no_show')
    ), 0
  ) as booked_appointments,
  8 as max_appointments_per_day -- Configurable
FROM doctors d
WHERE d.availability_status = 'available';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_availability_view_doctor_date 
ON doctor_availability_view(doctor_id, date);

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_doctor_availability()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW doctor_availability_view;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES:
-- =====================================================

/*
-- Find optimal time slots for a doctor
SELECT * FROM find_optimal_time_slots('DOC-HN-001', '2025-06-21', 30);

-- Detect conflicts for a new appointment
SELECT * FROM detect_smart_conflicts('DOC-HN-001', '2025-06-21', '10:00', '10:30');

-- Suggest reschedule options
SELECT * FROM suggest_reschedule_options('APT-001');

-- Batch update appointments
SELECT * FROM batch_update_appointments('[
  {
    "appointment_id": "APT-001",
    "data": {"status": "confirmed", "notes": "Patient confirmed"}
  },
  {
    "appointment_id": "APT-002", 
    "data": {"appointment_date": "2025-06-22"}
  }
]'::JSONB);

-- Refresh doctor availability
SELECT refresh_doctor_availability();
*/
