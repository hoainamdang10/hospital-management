# Schema Migration Guide - Patient Registry Service V2

## Overview

This guide documents the schema separation between V1 (legacy) and V2 (Clean Architecture) for the Patient Registry Service.

## Schema Structure

### ✅ `patient_schema` (V2 - Active)
**Purpose**: Patient Registry Service V2 - Clean Architecture + DDD + FHIR-aligned

**Tables**:
1. `patients` - Patient Master Data (FHIR-aligned)
2. `insurance_info` - Patient Insurance Information (BHYT, BHTN, Private)
3. `emergency_contacts` - Patient Emergency Contacts
4. `patient_consents` - Patient Consents (HIPAA compliance)
5. `patient_links` - Patient Links (FHIR R5 specification)

**Status**: ✅ Active - Used by Patient Registry Service V2

### 📦 `patient_legacy_schema` (V1 - Deprecated)
**Purpose**: Legacy Patient Service V1 tables - Deprecated

**Tables**:
1. `patient_profiles` - OLD patient table (UUID-based)
2. `patient_insurance` - OLD insurance table
3. `patient_emergency_contacts` - OLD emergency contacts
4. `patient_medical_history` - OLD medical history
5. `patient_diagnoses` - OLD diagnoses
6. `icd10_codes` - ICD-10 codes (legacy)
7. `encrypted_patient_data` - Encrypted data (legacy)
8. `patient_rights_requests` - Patient rights requests (legacy)

**Status**: 📦 Archived - Not used by V2 services

## Migration History

### 2025-01-XX: Schema Separation
- Created `patient_legacy_schema` for V1 tables
- Moved all V1 tables from `patient_schema` to `patient_legacy_schema`
- `patient_schema` now contains only V2 Clean Architecture tables
- All foreign key constraints preserved during migration

## Key Differences: V1 vs V2

### Patient ID Format
- **V1**: UUID-based (`id` column)
- **V2**: Business ID format `PAT-YYYYMM-XXX` (`patient_id` column)

### Data Structure
- **V1**: Flat table structure with direct columns
- **V2**: JSONB-based flexible structure (personal_info, contact_info, basic_medical_info)

### FHIR Alignment
- **V1**: Not FHIR-aligned
- **V2**: FHIR R5 specification compliant

### Status Values
- **V1**: `active`, `inactive`, `deceased`
- **V2**: `active`, `inactive`, `deceased`, `merged` (FHIR-aligned)

## Data Migration (Future)

If you need to migrate data from V1 to V2:

```sql
-- Example migration script (NOT YET IMPLEMENTED)
INSERT INTO patient_schema.patients (
  patient_id,
  user_id,
  personal_info,
  contact_info,
  basic_medical_info,
  status,
  created_at,
  updated_at,
  created_by,
  updated_by
)
SELECT 
  patient_id,
  user_id,
  jsonb_build_object(
    'fullName', (SELECT full_name FROM auth_schema.user_profiles WHERE id = user_id),
    'dateOfBirth', (SELECT date_of_birth FROM auth_schema.user_profiles WHERE id = user_id),
    'gender', (SELECT gender FROM auth_schema.user_profiles WHERE id = user_id),
    'nationalId', (SELECT national_id FROM auth_schema.user_profiles WHERE id = user_id)
  ) as personal_info,
  jsonb_build_object(
    'primaryPhone', (SELECT phone FROM auth_schema.user_profiles WHERE id = user_id),
    'email', (SELECT email FROM auth_schema.user_profiles WHERE id = user_id),
    'address', address
  ) as contact_info,
  jsonb_build_object(
    'bloodType', blood_type,
    'allergies', allergies,
    'chronicConditions', chronic_conditions,
    'currentMedications', current_medications,
    'height', height,
    'weight', weight
  ) as basic_medical_info,
  status,
  created_at,
  updated_at,
  'migration_script' as created_by,
  'migration_script' as updated_by
FROM patient_legacy_schema.patient_profiles
WHERE status = 'active';
```

## Rollback Plan

If you need to rollback to V1:

```sql
-- Move V1 tables back to patient_schema
ALTER TABLE patient_legacy_schema.patient_profiles SET SCHEMA patient_schema;
ALTER TABLE patient_legacy_schema.patient_insurance SET SCHEMA patient_schema;
ALTER TABLE patient_legacy_schema.patient_emergency_contacts SET SCHEMA patient_schema;
ALTER TABLE patient_legacy_schema.patient_medical_history SET SCHEMA patient_schema;
ALTER TABLE patient_legacy_schema.patient_diagnoses SET SCHEMA patient_schema;
ALTER TABLE patient_legacy_schema.icd10_codes SET SCHEMA patient_schema;
ALTER TABLE patient_legacy_schema.encrypted_patient_data SET SCHEMA patient_schema;
ALTER TABLE patient_legacy_schema.patient_rights_requests SET SCHEMA patient_schema;

-- Drop V2 tables
DROP TABLE IF EXISTS patient_schema.patient_links CASCADE;
DROP TABLE IF EXISTS patient_schema.patient_consents CASCADE;
DROP TABLE IF EXISTS patient_schema.emergency_contacts CASCADE;
DROP TABLE IF EXISTS patient_schema.insurance_info CASCADE;
DROP TABLE IF EXISTS patient_schema.patients CASCADE;

-- Drop legacy schema
DROP SCHEMA IF EXISTS patient_legacy_schema CASCADE;
```

## Verification

### Check V2 Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'patient_schema'
ORDER BY table_name;
```

Expected output:
- emergency_contacts
- insurance_info
- patient_consents
- patient_links
- patients

### Check V1 Tables (Legacy)
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'patient_legacy_schema'
ORDER BY table_name;
```

Expected output:
- encrypted_patient_data
- icd10_codes
- patient_diagnoses
- patient_emergency_contacts
- patient_insurance
- patient_medical_history
- patient_profiles
- patient_rights_requests

## Next Steps

1. ✅ Schema separation completed
2. ⏳ Implement data migration script (if needed)
3. ⏳ Update V1 services to use `patient_legacy_schema` (if still needed)
4. ⏳ Deprecate V1 services
5. ⏳ Archive or drop `patient_legacy_schema` after full V2 migration

## Notes

- V1 tables are preserved in `patient_legacy_schema` for reference
- No data loss during migration
- All foreign key constraints preserved
- V2 service uses only `patient_schema`
- V1 services (if any) should be updated to use `patient_legacy_schema`

---

**Last Updated**: 2025-01-XX
**Status**: ✅ Schema Separation Complete

