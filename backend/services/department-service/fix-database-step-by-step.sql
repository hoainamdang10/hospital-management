-- =====================================================
-- FIX DATABASE SCHEMA - STEP BY STEP
-- =====================================================
-- Run each section separately to avoid errors

-- =====================================================
-- STEP 1: FIX DEPARTMENTS TABLE
-- =====================================================

-- Add parent_department_id for hierarchy
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS parent_department_id VARCHAR(20);

-- Add level for hierarchy depth  
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Add path for quick hierarchy queries
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS path VARCHAR(500);

-- Update existing departments with default values
UPDATE departments 
SET level = 1, path = '/' || department_id 
WHERE level IS NULL OR path IS NULL;

-- =====================================================
-- STEP 2: FIX SPECIALTIES TABLE  
-- =====================================================

-- Fix specialty_code null values first
UPDATE specialties 
SET specialty_code = 'SPEC' 
WHERE specialty_code IS NULL;

-- Add enhanced specialty columns
ALTER TABLE specialties 
ADD COLUMN IF NOT EXISTS average_consultation_time INTEGER DEFAULT 30;

ALTER TABLE specialties 
ADD COLUMN IF NOT EXISTS consultation_fee_min DECIMAL(10,2) DEFAULT 200000;

ALTER TABLE specialties 
ADD COLUMN IF NOT EXISTS consultation_fee_max DECIMAL(10,2) DEFAULT 500000;

ALTER TABLE specialties 
ADD COLUMN IF NOT EXISTS required_certifications TEXT[];

ALTER TABLE specialties 
ADD COLUMN IF NOT EXISTS equipment_required TEXT[];

-- =====================================================
-- STEP 3: FIX ROOMS TABLE
-- =====================================================

-- Add room management columns
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS room_type VARCHAR(20) DEFAULT 'consultation';

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS equipment_ids TEXT[];

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS location JSONB;

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================================================
-- STEP 4: FIX DOCTORS TABLE (CAREFUL!)
-- =====================================================

-- Check if doctors table exists and has records
SELECT COUNT(*) as doctor_count FROM doctors;

-- Only add if doctors table exists and has the right structure
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available';

-- Update existing doctors with default values
UPDATE doctors 
SET is_active = true, availability_status = 'available' 
WHERE is_active IS NULL OR availability_status IS NULL;

-- =====================================================
-- STEP 5: ADD SAMPLE DATA
-- =====================================================

-- Add sample sub-departments
INSERT INTO departments (
    department_id, department_name, department_code, description, 
    parent_department_id, level, path, is_active, created_at, updated_at
) VALUES 
(
    'DEPT001-01', 'Tim mạch can thiệp', 'CARD-INT', 
    'Chuyên khoa tim mạch can thiệp và phẫu thuật tim', 
    'DEPT001', 2, '/DEPT001/DEPT001-01', true, NOW(), NOW()
),
(
    'DEPT001-02', 'Siêu âm tim', 'CARD-ECHO', 
    'Chuyên khoa siêu âm tim và chẩn đoán hình ảnh tim mạch', 
    'DEPT001', 2, '/DEPT001/DEPT001-02', true, NOW(), NOW()
)
ON CONFLICT (department_id) DO NOTHING;

-- Add sample rooms
INSERT INTO rooms (
    room_id, room_number, department_id, room_type, capacity, 
    status, location, notes, is_active, created_at, updated_at
) VALUES 
(
    'CARD-ROOM-001', 'A101', 'DEPT001', 'consultation', 2, 
    'available', '{"floor": 1, "wing": "A"}', 
    'Phòng khám tim mạch chính', true, NOW(), NOW()
),
(
    'CARD-ROOM-002', 'A102', 'DEPT001', 'surgery', 4, 
    'available', '{"floor": 1, "wing": "A"}', 
    'Phòng phẫu thuật tim mạch', true, NOW(), NOW()
)
ON CONFLICT (room_id) DO NOTHING;

-- =====================================================
-- STEP 6: VERIFICATION
-- =====================================================

-- Verify departments
SELECT department_id, department_name, parent_department_id, level, path 
FROM departments 
ORDER BY level, department_name;

-- Verify specialties  
SELECT specialty_id, specialty_name, specialty_code, average_consultation_time
FROM specialties 
LIMIT 5;

-- Verify rooms
SELECT room_id, room_number, room_type, capacity, status
FROM rooms;

-- Verify doctors (if table exists)
SELECT doctor_id, department_id, is_active, availability_status
FROM doctors 
LIMIT 5;
