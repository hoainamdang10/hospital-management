-- Migration: Create Performance Indexes for Patient Schema
-- Description: Add B-tree indexes on foreign keys and GIN indexes on JSONB columns
-- Author: Hospital Management System V2 Team
-- Date: 2025-01-07
-- Version: 1.0.0

-- ============================================================================
-- PATIENTS TABLE INDEXES
-- ============================================================================

-- B-tree indexes for foreign keys and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patient_schema.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patient_schema.patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patient_schema.patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_merged_into ON patient_schema.patients(merged_into) WHERE merged_into IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patient_schema.patients(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_updated_at ON patient_schema.patients(updated_at);

-- GIN indexes for JSONB columns (for fast JSON queries)
CREATE INDEX IF NOT EXISTS idx_patients_personal_info_gin ON patient_schema.patients USING GIN (personal_info);
CREATE INDEX IF NOT EXISTS idx_patients_contact_info_gin ON patient_schema.patients USING GIN (contact_info);
CREATE INDEX IF NOT EXISTS idx_patients_basic_medical_info_gin ON patient_schema.patients USING GIN (basic_medical_info);

-- Specific JSONB path indexes for common queries
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patient_schema.patients ((personal_info->>'fullName'));
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patient_schema.patients ((personal_info->>'nationalId'));
CREATE INDEX IF NOT EXISTS idx_patients_date_of_birth ON patient_schema.patients ((personal_info->>'dateOfBirth'));
CREATE INDEX IF NOT EXISTS idx_patients_gender ON patient_schema.patients ((personal_info->>'gender'));
CREATE INDEX IF NOT EXISTS idx_patients_primary_phone ON patient_schema.patients ((contact_info->>'primaryPhone'));
CREATE INDEX IF NOT EXISTS idx_patients_email ON patient_schema.patients ((contact_info->>'email'));

-- ============================================================================
-- INSURANCE_INFO TABLE INDEXES
-- ============================================================================

-- B-tree indexes
CREATE INDEX IF NOT EXISTS idx_insurance_patient_id ON patient_schema.insurance_info(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_provider ON patient_schema.insurance_info(provider);
CREATE INDEX IF NOT EXISTS idx_insurance_policy_number ON patient_schema.insurance_info(policy_number);
CREATE INDEX IF NOT EXISTS idx_insurance_coverage_type ON patient_schema.insurance_info(coverage_type);
CREATE INDEX IF NOT EXISTS idx_insurance_bhyt_number ON patient_schema.insurance_info(bhyt_number) WHERE bhyt_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_is_primary ON patient_schema.insurance_info(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_insurance_is_active ON patient_schema.insurance_info(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_insurance_created_at ON patient_schema.insurance_info(created_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_insurance_patient_active ON patient_schema.insurance_info(patient_id, is_active) WHERE is_active = true;

-- ============================================================================
-- EMERGENCY_CONTACTS TABLE INDEXES
-- ============================================================================

-- B-tree indexes
CREATE INDEX IF NOT EXISTS idx_emergency_patient_id ON patient_schema.emergency_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_name ON patient_schema.emergency_contacts(name);
CREATE INDEX IF NOT EXISTS idx_emergency_relationship ON patient_schema.emergency_contacts(relationship);
CREATE INDEX IF NOT EXISTS idx_emergency_primary_phone ON patient_schema.emergency_contacts(primary_phone);
CREATE INDEX IF NOT EXISTS idx_emergency_is_primary ON patient_schema.emergency_contacts(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_emergency_created_at ON patient_schema.emergency_contacts(created_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_emergency_patient_primary ON patient_schema.emergency_contacts(patient_id, is_primary) WHERE is_primary = true;

-- ============================================================================
-- PATIENT_CONSENTS TABLE INDEXES
-- ============================================================================

-- B-tree indexes
CREATE INDEX IF NOT EXISTS idx_consents_patient_id ON patient_schema.patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_consent_type ON patient_schema.patient_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_is_granted ON patient_schema.patient_consents(is_granted);
CREATE INDEX IF NOT EXISTS idx_consents_granted_at ON patient_schema.patient_consents(granted_at);
CREATE INDEX IF NOT EXISTS idx_consents_revoked_at ON patient_schema.patient_consents(revoked_at) WHERE revoked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consents_expires_at ON patient_schema.patient_consents(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consents_created_at ON patient_schema.patient_consents(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_consents_patient_type ON patient_schema.patient_consents(patient_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_patient_granted ON patient_schema.patient_consents(patient_id, is_granted) WHERE is_granted = true;
CREATE INDEX IF NOT EXISTS idx_consents_active ON patient_schema.patient_consents(patient_id, is_granted, expires_at) 
  WHERE is_granted = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- ============================================================================
-- PATIENT_LINKS TABLE INDEXES
-- ============================================================================

-- B-tree indexes
CREATE INDEX IF NOT EXISTS idx_links_patient_id ON patient_schema.patient_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_links_other_patient_id ON patient_schema.patient_links(other_patient_id);
CREATE INDEX IF NOT EXISTS idx_links_link_type ON patient_schema.patient_links(link_type);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON patient_schema.patient_links(created_at);

-- Composite indexes for bidirectional queries
CREATE INDEX IF NOT EXISTS idx_links_patient_type ON patient_schema.patient_links(patient_id, link_type);
CREATE INDEX IF NOT EXISTS idx_links_other_patient_type ON patient_schema.patient_links(other_patient_id, link_type);

-- Unique constraint to prevent duplicate links
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_unique_pair ON patient_schema.patient_links(
  LEAST(patient_id, other_patient_id),
  GREATEST(patient_id, other_patient_id),
  link_type
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'patient_schema'
    AND indexname LIKE 'idx_%';
  
  RAISE NOTICE 'Created % performance indexes for patient_schema', index_count;
  
  IF index_count < 40 THEN
    RAISE WARNING 'Expected at least 40 indexes, got %', index_count;
  END IF;
END $$;

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update statistics for query planner
ANALYZE patient_schema.patients;
ANALYZE patient_schema.insurance_info;
ANALYZE patient_schema.emergency_contacts;
ANALYZE patient_schema.patient_consents;
ANALYZE patient_schema.patient_links;

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

-- To rollback this migration, run:
-- DROP INDEX IF EXISTS patient_schema.idx_patients_user_id;
-- DROP INDEX IF EXISTS patient_schema.idx_patients_patient_id;
-- ... (drop all indexes)

