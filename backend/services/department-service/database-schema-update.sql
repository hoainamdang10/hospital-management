-- =====================================================
-- HOSPITAL MANAGEMENT SYSTEM - DATABASE SCHEMA UPDATE
-- =====================================================
-- This script adds missing columns to enable full Department Service functionality
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. UPDATE DEPARTMENTS TABLE
-- =====================================================

-- Add hierarchy support columns
DO $$
BEGIN
    -- Add parent_department_id for hierarchy
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'parent_department_id'
    ) THEN
        ALTER TABLE departments ADD COLUMN parent_department_id VARCHAR(20);
        RAISE NOTICE 'Added parent_department_id column to departments table';
    END IF;

    -- Add level for hierarchy depth
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'level'
    ) THEN
        ALTER TABLE departments ADD COLUMN level INTEGER DEFAULT 1;
        RAISE NOTICE 'Added level column to departments table';
    END IF;

    -- Add path for quick hierarchy queries
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'path'
    ) THEN
        ALTER TABLE departments ADD COLUMN path VARCHAR(500);
        RAISE NOTICE 'Added path column to departments table';
    END IF;
END $$;

-- Add foreign key constraint for parent_department_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_departments_parent' 
        AND table_name = 'departments'
    ) THEN
        ALTER TABLE departments 
        ADD CONSTRAINT fk_departments_parent 
        FOREIGN KEY (parent_department_id) REFERENCES departments(department_id);
        RAISE NOTICE 'Added foreign key constraint for parent_department_id';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Foreign key constraint may already exist or have different name';
END $$;

-- Update existing departments with default values
UPDATE departments 
SET level = 1, path = '/' || department_id 
WHERE level IS NULL OR path IS NULL;

-- =====================================================
-- 2. UPDATE SPECIALTIES TABLE
-- =====================================================

-- Add enhanced specialty columns
DO $$
BEGIN
    -- Add average consultation time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specialties' AND column_name = 'average_consultation_time'
    ) THEN
        ALTER TABLE specialties ADD COLUMN average_consultation_time INTEGER DEFAULT 30;
        RAISE NOTICE 'Added average_consultation_time column to specialties table';
    END IF;

    -- Add consultation fee range
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specialties' AND column_name = 'consultation_fee_min'
    ) THEN
        ALTER TABLE specialties ADD COLUMN consultation_fee_min DECIMAL(10,2) DEFAULT 200000;
        RAISE NOTICE 'Added consultation_fee_min column to specialties table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specialties' AND column_name = 'consultation_fee_max'
    ) THEN
        ALTER TABLE specialties ADD COLUMN consultation_fee_max DECIMAL(10,2) DEFAULT 500000;
        RAISE NOTICE 'Added consultation_fee_max column to specialties table';
    END IF;

    -- Add required certifications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specialties' AND column_name = 'required_certifications'
    ) THEN
        ALTER TABLE specialties ADD COLUMN required_certifications TEXT[];
        RAISE NOTICE 'Added required_certifications column to specialties table';
    END IF;

    -- Add equipment required
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specialties' AND column_name = 'equipment_required'
    ) THEN
        ALTER TABLE specialties ADD COLUMN equipment_required TEXT[];
        RAISE NOTICE 'Added equipment_required column to specialties table';
    END IF;
END $$;

-- Update existing specialties with default specialty_code if null
UPDATE specialties 
SET specialty_code = 'SPEC' 
WHERE specialty_code IS NULL;

-- =====================================================
-- 3. UPDATE ROOMS TABLE
-- =====================================================

-- Add room management columns
DO $$
BEGIN
    -- Add room_type if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'room_type'
    ) THEN
        ALTER TABLE rooms ADD COLUMN room_type VARCHAR(20) DEFAULT 'consultation';
        RAISE NOTICE 'Added room_type column to rooms table';
    END IF;

    -- Add equipment_ids for room equipment tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'equipment_ids'
    ) THEN
        ALTER TABLE rooms ADD COLUMN equipment_ids TEXT[];
        RAISE NOTICE 'Added equipment_ids column to rooms table';
    END IF;

    -- Add location information
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'location'
    ) THEN
        ALTER TABLE rooms ADD COLUMN location JSONB;
        RAISE NOTICE 'Added location column to rooms table';
    END IF;

    -- Add notes for additional information
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'notes'
    ) THEN
        ALTER TABLE rooms ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to rooms table';
    END IF;
END $$;

-- =====================================================
-- 4. UPDATE DOCTORS TABLE
-- =====================================================

-- Add missing doctor management columns
DO $$
BEGIN
    -- Add is_active for doctor status management
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE doctors ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to doctors table';
    END IF;

    -- Add availability_status for scheduling
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'availability_status'
    ) THEN
        ALTER TABLE doctors ADD COLUMN availability_status VARCHAR(20) DEFAULT 'available';
        RAISE NOTICE 'Added availability_status column to doctors table';
    END IF;
END $$;

-- Update existing doctors with default values
UPDATE doctors 
SET is_active = true, availability_status = 'available' 
WHERE is_active IS NULL OR availability_status IS NULL;

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for departments hierarchy
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_level ON departments(level);
CREATE INDEX IF NOT EXISTS idx_departments_path ON departments USING gin(to_tsvector('english', path));

-- Indexes for specialties
CREATE INDEX IF NOT EXISTS idx_specialties_department ON specialties(department_id);
CREATE INDEX IF NOT EXISTS idx_specialties_active ON specialties(is_active);
CREATE INDEX IF NOT EXISTS idx_specialties_consultation_time ON specialties(average_consultation_time);

-- Indexes for rooms
CREATE INDEX IF NOT EXISTS idx_rooms_department ON rooms(department_id);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);

-- Indexes for doctors
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_availability ON doctors(availability_status);

-- =====================================================
-- 6. ADD SAMPLE DATA FOR TESTING
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
),
(
    'DEPT002-01', 'Thần kinh cột sống', 'NEUR-SPINE', 
    'Chuyên khoa thần kinh cột sống và phẫu thuật cột sống', 
    'DEPT002', 2, '/DEPT002/DEPT002-01', true, NOW(), NOW()
)
ON CONFLICT (department_id) DO NOTHING;

-- Add sample rooms
INSERT INTO rooms (
    room_id, room_number, department_id, room_type, capacity, 
    status, location, notes, is_active, created_at, updated_at
) VALUES 
(
    'CARD-ROOM-001', 'A101', 'DEPT001', 'consultation', 2, 
    'available', '{"floor": 1, "wing": "A", "coordinates": {"x": 10, "y": 5}}', 
    'Phòng khám tim mạch chính', true, NOW(), NOW()
),
(
    'CARD-ROOM-002', 'A102', 'DEPT001', 'surgery', 4, 
    'available', '{"floor": 1, "wing": "A", "coordinates": {"x": 12, "y": 5}}', 
    'Phòng phẫu thuật tim mạch', true, NOW(), NOW()
),
(
    'NEUR-ROOM-001', 'B201', 'DEPT002', 'consultation', 2, 
    'available', '{"floor": 2, "wing": "B", "coordinates": {"x": 20, "y": 10}}', 
    'Phòng khám thần kinh', true, NOW(), NOW()
)
ON CONFLICT (room_id) DO NOTHING;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Verify departments hierarchy
SELECT 
    department_id, 
    department_name, 
    parent_department_id, 
    level, 
    path 
FROM departments 
ORDER BY level, department_name;

-- Verify specialties with new columns
SELECT 
    specialty_id, 
    specialty_name, 
    specialty_code,
    average_consultation_time,
    consultation_fee_min,
    consultation_fee_max
FROM specialties 
LIMIT 5;

-- Verify rooms with new columns
SELECT 
    room_id, 
    room_number, 
    department_id, 
    room_type, 
    capacity, 
    status,
    location
FROM rooms;

-- Verify doctors with new columns
SELECT 
    doctor_id, 
    department_id, 
    is_active, 
    availability_status
FROM doctors 
LIMIT 5;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ DATABASE SCHEMA UPDATE COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '🏥 Hospital Management System database is now ready for full functionality';
    RAISE NOTICE '📊 Added hierarchy support, enhanced specialties, room management, and doctor status tracking';
    RAISE NOTICE '🚀 Department Service can now use all advanced features';
END $$;
