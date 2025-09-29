-- =====================================================
-- CONSOLIDATE DUPLICATE TABLES MIGRATION
-- =====================================================
-- This migration consolidates duplicate tables to improve
-- database consistency and eliminate redundancy
-- 
-- Changes:
-- 1. Remove embedded emergency contact from patient_profiles
-- 2. Ensure all emergency contacts use emergency_contacts table
-- 3. Standardize address handling
-- 4. Clean up inconsistent schemas
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. MIGRATE EMBEDDED EMERGENCY CONTACTS TO SEPARATE TABLE
-- =====================================================

-- First, migrate existing embedded emergency contacts to emergency_contacts table
INSERT INTO emergency_contacts (
    user_id,
    name,
    relation,
    phone,
    email,
    is_primary,
    created_at,
    updated_at
)
SELECT 
    pp.user_id,
    pp.emergency_contact_name,
    pp.emergency_contact_relation,
    pp.emergency_contact_phone,
    pp.emergency_contact_email,
    true, -- Set as primary since it was the only one
    pp.created_at,
    NOW()
FROM patient_profiles pp
WHERE pp.emergency_contact_name IS NOT NULL
  AND pp.emergency_contact_phone IS NOT NULL
  AND NOT EXISTS (
    -- Don't duplicate if emergency contact already exists
    SELECT 1 FROM emergency_contacts ec 
    WHERE ec.user_id = pp.user_id 
    AND ec.name = pp.emergency_contact_name
  );

-- =====================================================
-- 2. REMOVE EMBEDDED EMERGENCY CONTACT COLUMNS
-- =====================================================

-- Remove embedded emergency contact columns from patient_profiles
ALTER TABLE patient_profiles 
DROP COLUMN IF EXISTS emergency_contact_name,
DROP COLUMN IF EXISTS emergency_contact_relation,
DROP COLUMN IF EXISTS emergency_contact_phone,
DROP COLUMN IF EXISTS emergency_contact_email;

-- =====================================================
-- 3. CONSOLIDATE INSURANCE INFORMATION
-- =====================================================

-- Create insurances table if it doesn't exist
CREATE TABLE IF NOT EXISTS insurances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    insurance_number TEXT NOT NULL,
    valid_from DATE,
    valid_to DATE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, insurance_number)
);

-- Migrate embedded insurance data to insurances table
INSERT INTO insurances (
    user_id,
    provider,
    insurance_number,
    valid_from,
    valid_to,
    is_primary,
    created_at,
    updated_at
)
SELECT 
    pp.user_id,
    pp.insurance_provider,
    pp.insurance_number,
    pp.insurance_valid_from,
    pp.insurance_valid_to,
    true, -- Set as primary since it was the only one
    pp.created_at,
    NOW()
FROM patient_profiles pp
WHERE pp.insurance_number IS NOT NULL
  AND pp.insurance_provider IS NOT NULL
  AND NOT EXISTS (
    -- Don't duplicate if insurance already exists
    SELECT 1 FROM insurances i 
    WHERE i.user_id = pp.user_id 
    AND i.insurance_number = pp.insurance_number
  );

-- Remove embedded insurance columns from patient_profiles
ALTER TABLE patient_profiles 
DROP COLUMN IF EXISTS insurance_number,
DROP COLUMN IF EXISTS insurance_provider,
DROP COLUMN IF EXISTS insurance_valid_from,
DROP COLUMN IF EXISTS insurance_valid_to;

-- =====================================================
-- 4. STANDARDIZE ADDRESSES TABLE
-- =====================================================

-- Ensure addresses table exists with consistent structure
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('home', 'work', 'billing', 'emergency')) DEFAULT 'home',
    line1 TEXT NOT NULL,
    line2 TEXT,
    ward TEXT,
    district TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT,
    country TEXT DEFAULT 'Vietnam',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ADD MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- Emergency contacts indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_primary ON emergency_contacts(user_id, is_primary) WHERE is_primary = true;

-- Insurances indexes
CREATE INDEX IF NOT EXISTS idx_insurances_user_id ON insurances(user_id);
CREATE INDEX IF NOT EXISTS idx_insurances_primary ON insurances(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_insurances_number ON insurances(insurance_number);

-- Addresses indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_primary ON addresses(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(type);

-- =====================================================
-- 6. CREATE CONSOLIDATED VIEWS
-- =====================================================

-- Create view for complete patient information
CREATE OR REPLACE VIEW patient_complete_view AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.date_of_birth,
    p.gender,
    p.phone,
    p.preferred_language,
    p.is_active,
    p.email_verified,
    pp.patient_id,
    pp.blood_type,
    pp.allergies,
    pp.chronic_conditions,
    pp.medications,
    pp.medical_notes,
    pp.onboarding_completed,
    -- Primary address
    a.line1 as address_line1,
    a.line2 as address_line2,
    a.ward,
    a.district,
    a.city,
    a.postal_code,
    -- Primary emergency contact
    ec.name as emergency_contact_name,
    ec.relation as emergency_contact_relation,
    ec.phone as emergency_contact_phone,
    ec.email as emergency_contact_email,
    -- Primary insurance
    i.provider as insurance_provider,
    i.insurance_number,
    i.valid_from as insurance_valid_from,
    i.valid_to as insurance_valid_to,
    -- Timestamps
    p.created_at,
    p.updated_at
FROM profiles p
LEFT JOIN patient_profiles pp ON p.id = pp.user_id
LEFT JOIN addresses a ON p.id = a.user_id AND a.is_primary = true
LEFT JOIN emergency_contacts ec ON p.id = ec.user_id AND ec.is_primary = true
LEFT JOIN insurances i ON p.id = i.user_id AND i.is_primary = true
WHERE p.role = 'patient';

-- =====================================================
-- 7. ADD CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Ensure only one primary emergency contact per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_emergency_contacts_user_primary 
ON emergency_contacts(user_id) WHERE is_primary = true;

-- Ensure only one primary insurance per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_insurances_user_primary 
ON insurances(user_id) WHERE is_primary = true;

-- Ensure only one primary address per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_user_primary 
ON addresses(user_id) WHERE is_primary = true;

-- =====================================================
-- 8. UPDATE COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE patient_profiles IS 'Core patient medical information - emergency contacts and insurance moved to separate tables';
COMMENT ON TABLE emergency_contacts IS 'Emergency contacts for all users - supports multiple contacts per user';
COMMENT ON TABLE insurances IS 'Insurance information for users - supports multiple insurance policies';
COMMENT ON TABLE addresses IS 'Address information for users - supports multiple addresses per user';
COMMENT ON VIEW patient_complete_view IS 'Consolidated view of patient information with primary emergency contact, insurance, and address';

-- Commit transaction
COMMIT;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Verify the migration
SELECT 
    'patient_profiles' as table_name,
    COUNT(*) as record_count
FROM patient_profiles
UNION ALL
SELECT 
    'emergency_contacts' as table_name,
    COUNT(*) as record_count
FROM emergency_contacts
UNION ALL
SELECT 
    'insurances' as table_name,
    COUNT(*) as record_count
FROM insurances
UNION ALL
SELECT 
    'addresses' as table_name,
    COUNT(*) as record_count
FROM addresses;

-- Check for any orphaned records
SELECT 
    'Orphaned emergency contacts' as check_type,
    COUNT(*) as count
FROM emergency_contacts ec
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ec.user_id)
UNION ALL
SELECT 
    'Orphaned insurances' as check_type,
    COUNT(*) as count
FROM insurances i
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = i.user_id)
UNION ALL
SELECT 
    'Orphaned addresses' as check_type,
    COUNT(*) as count
FROM addresses a
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = a.user_id);
