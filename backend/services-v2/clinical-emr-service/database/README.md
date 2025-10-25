# 🗄️ Clinical EMR Service - Database Documentation

**Service**: Clinical EMR Service  
**Schema**: `clinical_schema`  
**Database**: Supabase (PostgreSQL)  
**Version**: 2.0.0

---

## 🚨 IMPORTANT - Schema Migration Required

**Current Status**: ❌ **Schema is INCOMPLETE and OUT OF SYNC with code**

The original `schema.sql` file is missing critical columns and tables that the application code expects.

**Action Required**: Run migration immediately before using this service.

---

## 📁 Files in This Directory

### 1. `schema.sql` (DEPRECATED - DO NOT USE)
**Status**: ❌ **Outdated and incomplete**  
**Columns**: 15 (missing 20+ columns)  
**Tables**: 1 (missing 3 tables)  
**Last Updated**: Unknown (obsolete)

⚠️ **DO NOT USE THIS FILE** - It will cause service failures!

### 2. `001_enhanced_medical_records_schema.sql` ✅ **RECOMMENDED**
**Status**: ✅ **Complete and production-ready**  
**Columns**: 35+ columns  
**Tables**: 4 tables  
**Use Case**: Fresh installation or can drop existing data

**What it includes**:
- ✅ Complete medical_records table with all required columns
- ✅ medical_record_diagnoses table (normalized)
- ✅ medical_record_medications table (normalized)
- ✅ medical_record_access table (HIPAA audit)
- ✅ 35+ performance indexes
- ✅ 10+ RLS policies for security
- ✅ 8 database functions
- ✅ 4 automated triggers
- ✅ 3 helpful views

### 3. `002_alter_add_missing_columns.sql` ✅ **For Existing Data**
**Status**: ✅ **Safe incremental update**  
**Use Case**: Have production data that must be preserved

**What it does**:
- ✅ ALTER TABLE to add missing columns
- ✅ CREATE new related tables
- ✅ CREATE missing indexes
- ✅ Backfill existing data with sensible defaults
- ✅ Verify migration success

### 4. `SCHEMA_COMPARISON_REPORT.md` 📋 **Analysis Document**
**Status**: ✅ **Comprehensive analysis**  
**Content**: Detailed comparison of old vs new schema, impact analysis, migration guide

---

## 🚀 Quick Start - Migration Guide

### Option A: Fresh Installation (Recommended for Development)

**When to use**: 
- No production data yet
- Development/testing environment
- Can drop existing data

**Steps**:
```bash
# 1. Backup if needed
# 2. Drop old schema (CAUTION!)
# 3. Run new schema
```

**SQL Commands**:
```sql
-- WARNING: This deletes all data!
DROP SCHEMA IF EXISTS clinical_schema CASCADE;

-- Run the enhanced schema
-- Copy content from 001_enhanced_medical_records_schema.sql
-- Paste into Supabase SQL Editor
-- Execute
```

**Verification**:
```sql
-- Should return 4 tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'clinical_schema';

-- Should return 35+ columns
SELECT COUNT(*) 
FROM information_schema.columns
WHERE table_schema = 'clinical_schema' 
AND table_name = 'medical_records';
```

### Option B: Incremental Update (For Production Data)

**When to use**:
- Have production data
- Cannot lose existing records
- Need zero-downtime migration

**Steps**:
```bash
# 1. BACKUP FIRST! (Mandatory)
# 2. Run ALTER TABLE migration
# 3. Verify data integrity
# 4. Test service
```

**SQL Commands**:
```sql
-- Step 1: BACKUP (MANDATORY!)
COPY (
  SELECT * FROM clinical_schema.medical_records
) TO '/tmp/medical_records_backup_$(date +%Y%m%d).csv' WITH CSV HEADER;

-- Step 2: Run incremental migration
-- Copy content from 002_alter_add_missing_columns.sql
-- Paste into Supabase SQL Editor
-- Execute

-- Step 3: Verify (should show all new columns)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'clinical_schema' 
AND table_name = 'medical_records'
ORDER BY ordinal_position;
```

**Verification**:
```sql
-- Check new columns exist
SELECT 
  COUNT(*) FILTER (WHERE column_name IN (
    'diagnoses_json', 'medications_json', 'fhir_resource_id',
    'vietnamese_medical_code', 'specialty_code', 'search_vector',
    'access_log_json', 'version'
  )) as new_columns_added
FROM information_schema.columns
WHERE table_schema = 'clinical_schema' 
AND table_name = 'medical_records';

-- Should return 8 or more
```

---

## 📋 Schema Overview

### Tables

#### 1. `medical_records` (Main Table)
**Purpose**: Store medical record aggregates  
**Rows**: Variable (grows with patient visits)  
**Key Columns**: 
- `id` (UUID) - Internal ID
- `record_id` (VARCHAR) - Business ID (MR-YYYYMM-XXX)
- `patient_id` (VARCHAR) - Foreign key to Patient Service
- `doctor_id` (VARCHAR) - Foreign key to Provider Service
- `diagnoses_json` (JSONB) - Array of diagnoses
- `medications_json` (JSONB) - Array of medications
- `fhir_resource_id` (VARCHAR) - FHIR identifier
- `search_vector` (TSVECTOR) - Full-text search
- `version` (INTEGER) - Optimistic locking

#### 2. `medical_record_diagnoses` (Normalized Diagnoses)
**Purpose**: Store individual diagnoses for advanced querying  
**Relationship**: Many-to-One with medical_records  
**Key Columns**:
- `code` (VARCHAR) - ICD-10 or Vietnamese code
- `category` (VARCHAR) - primary/secondary/complication/comorbidity
- `severity` (VARCHAR) - mild/moderate/severe/critical
- `status` (VARCHAR) - provisional/confirmed/refuted

#### 3. `medical_record_medications` (Normalized Medications)
**Purpose**: Store individual medications for pharmacy integration  
**Relationship**: Many-to-One with medical_records  
**Key Columns**:
- `code` (VARCHAR) - Drug code
- `vietnamese_drug_code` (VARCHAR) - VN-XXXXX-XX format
- `registration_number` (VARCHAR) - VD-XXXXX-XX format
- `status` (VARCHAR) - active/inactive/stopped/completed

#### 4. `medical_record_access` (HIPAA Audit Log)
**Purpose**: Immutable audit trail for HIPAA compliance  
**Relationship**: Many-to-One with medical_records  
**Key Columns**:
- `accessed_at` (TIMESTAMPTZ) - When
- `accessed_by` (VARCHAR) - Who
- `access_type` (VARCHAR) - read/write/print/export
- `purpose` (TEXT) - Why
- `ip_address` (VARCHAR) - From where

**Special**: Cannot UPDATE or DELETE (enforced by RLS policies)

---

## 🔐 Security (Row Level Security)

### RLS Policies

#### Medical Records
1. **doctors_own_records** - Doctors see their records
2. **patients_own_records** - Patients see their own (read-only)
3. **admins_all_records** - Admins see everything
4. **service_access** - Service accounts for inter-service calls

#### Diagnoses & Medications
5. **diagnoses_follow_medical_record** - Inherit parent access
6. **medications_follow_medical_record** - Inherit parent access

#### Access Logs
7. **admins_view_access_logs** - Admins see all logs
8. **doctors_view_own_access_logs** - Doctors see their record logs
9. **all_can_insert_access_logs** - Anyone can log (for audit)
10. **access_log_immutable** - Cannot update logs
11. **access_log_no_delete** - Cannot delete logs

---

## 📈 Performance Optimization

### Indexes Created (35+)

#### Basic Indexes (7)
- `idx_medical_records_patient_id`
- `idx_medical_records_doctor_id`
- `idx_medical_records_appointment_id`
- `idx_medical_records_visit_date`
- `idx_medical_records_created_at`
- `idx_medical_records_updated_at`
- `idx_medical_records_status`

#### Composite Indexes (4)
- `idx_medical_records_patient_status`
- `idx_medical_records_doctor_status`
- `idx_medical_records_patient_visit_date`
- `idx_medical_records_doctor_visit_date`

#### JSONB GIN Indexes (5)
- `idx_medical_records_diagnoses_json`
- `idx_medical_records_medications_json`
- `idx_medical_records_vital_signs`
- `idx_medical_records_vital_signs_json`
- `idx_medical_records_access_log`

#### Full-Text Search Indexes (5)
- `idx_medical_records_search_vector` (auto-generated)
- `idx_medical_records_symptoms_text`
- `idx_medical_records_diagnosis_text`
- `idx_medical_records_notes_text`
- `idx_medical_records_examination_notes_text`

#### FHIR Indexes (2)
- `idx_medical_records_fhir_resource_id`
- `idx_medical_records_fhir_compliant`

#### Vietnamese Healthcare Indexes (2)
- `idx_medical_records_specialty_code`
- `idx_medical_records_vietnamese_code`

#### Performance Optimization Indexes (2)
- `idx_medical_records_critical_diagnoses` (filtered)
- `idx_medical_records_active_medications` (filtered)

#### Related Tables Indexes (8+)
- Diagnoses table: 6 indexes
- Medications table: 6 indexes
- Access log table: 5 indexes

**Total**: **35+ indexes** for optimal query performance

---

## 🛠️ Database Functions

### 1. `generate_medical_record_id()`
**Returns**: TEXT (MR-YYYYMM-XXX)  
**Purpose**: Auto-generate sequential record IDs per month

```sql
SELECT clinical_schema.generate_medical_record_id();
-- Returns: 'MR-202510-001', 'MR-202510-002', etc.
```

### 2. `create_medical_record(...)`
**Returns**: TABLE (record_id, id, created_at)  
**Purpose**: Create record with validation and auto ID generation

```sql
SELECT * FROM clinical_schema.create_medical_record(
  'PAT-202510-001',           -- patient_id
  'CARD-DOC-202510-001',      -- doctor_id
  NULL,                        -- appointment_id
  CURRENT_DATE,                -- visit_date
  'Đau ngực',                  -- symptoms
  'Khám tim mạch',             -- examination_notes
  'Tăng huyết áp',             -- diagnosis
  'Thuốc hạ huyết áp',         -- treatment
  'Amlodipine 5mg',            -- medications
  'Theo dõi sau 1 tháng',      -- notes
  '{"temperature": 37.5}'::jsonb, -- vital_signs
  'user-uuid-here'::uuid       -- created_by
);
```

### 3. `get_medical_record_statistics()`
**Returns**: TABLE with 18 statistical fields  
**Purpose**: System-wide statistics

```sql
SELECT * FROM clinical_schema.get_medical_record_statistics();
```

### 4. `get_patient_statistics(patient_id)`
**Returns**: TABLE with patient-specific stats  
**Purpose**: Patient medical history summary

```sql
SELECT * FROM clinical_schema.get_patient_statistics('PAT-202510-001');
```

### 5. `get_doctor_statistics(doctor_id)`
**Returns**: TABLE with doctor-specific stats  
**Purpose**: Doctor performance metrics

```sql
SELECT * FROM clinical_schema.get_doctor_statistics('CARD-DOC-202510-001');
```

### 6. `log_medical_record_access(...)`
**Returns**: UUID (access log ID)  
**Purpose**: HIPAA-compliant access logging

```sql
SELECT clinical_schema.log_medical_record_access(
  'record-uuid-here'::uuid,    -- medical_record_id
  'DOC-001',                   -- accessed_by
  'read',                      -- access_type
  '192.168.1.1',               -- ip_address
  'Mozilla/5.0...',            -- user_agent
  'Xem hồ sơ bệnh nhân',       -- purpose
  'session-123',               -- session_id
  'req-456'                    -- request_id
);
```

### 7. `archive_medical_record(record_id, archived_by, reason)`
**Returns**: BOOLEAN  
**Purpose**: Archive record with validation

```sql
SELECT clinical_schema.archive_medical_record(
  'MR-202510-001',
  'doctor-uuid'::uuid,
  'Hoàn thành điều trị'
);
```

### 8. `restore_medical_record(record_id, restored_by, reason)`
**Returns**: BOOLEAN  
**Purpose**: Restore archived record

```sql
SELECT clinical_schema.restore_medical_record(
  'MR-202510-001',
  'doctor-uuid'::uuid,
  'Cần xem lại hồ sơ'
);
```

---

## 🔄 Triggers (Automatic Actions)

### 1. `update_medical_records_updated_at`
**When**: BEFORE UPDATE  
**Action**: Auto-set `updated_at = NOW()`

### 2. `update_medical_records_search_vector`
**When**: BEFORE INSERT OR UPDATE  
**Action**: Auto-generate full-text search vector from:
- symptoms (weight A - highest)
- diagnosis (weight A)
- examination_notes (weight B)
- treatment (weight B)
- notes (weight C - lowest)

### 3. `update_medical_records_denormalized`
**When**: BEFORE INSERT OR UPDATE  
**Action**: Auto-update optimization fields:
- `has_vital_signs`
- `has_complete_vital_signs`
- `critical_diagnoses_count`
- `active_medications_count`
- `fhir_compliant`

### 4. `increment_medical_record_version`
**When**: BEFORE UPDATE  
**Action**: Auto-increment version for optimistic locking

---

## 📊 Views (Pre-built Queries)

### 1. `v_active_medical_records`
**Purpose**: Active records with aggregated counts

```sql
SELECT * FROM clinical_schema.v_active_medical_records
WHERE patient_id = 'PAT-202510-001';
```

**Returns**: Medical records with:
- All base columns
- `diagnoses_count`
- `medications_count`
- `access_count`

### 2. `v_fhir_compliant_records`
**Purpose**: Records that meet FHIR R4 standards

```sql
SELECT * FROM clinical_schema.v_fhir_compliant_records
WHERE is_fhir_compliant = TRUE;
```

### 3. `v_recent_medical_records`
**Purpose**: Last 30 days of records

```sql
SELECT * FROM clinical_schema.v_recent_medical_records
LIMIT 100;
```

---

## 🔍 Common Queries

### Get Patient Medical History
```sql
SELECT 
  record_id,
  visit_date,
  diagnosis,
  treatment,
  jsonb_array_length(diagnoses_json) as diagnoses_count,
  jsonb_array_length(medications_json) as medications_count
FROM clinical_schema.medical_records
WHERE patient_id = 'PAT-202510-001'
  AND status = 'active'
ORDER BY visit_date DESC;
```

### Search by Diagnosis Code
```sql
SELECT mr.*
FROM clinical_schema.medical_records mr
WHERE mr.diagnoses_json @> '[{"code": "I10"}]'::jsonb
  AND mr.status = 'active';
```

### Find Records with Critical Diagnoses
```sql
SELECT *
FROM clinical_schema.medical_records
WHERE critical_diagnoses_count > 0
ORDER BY visit_date DESC;
```

### Full-Text Search
```sql
SELECT 
  record_id,
  patient_id,
  visit_date,
  ts_rank(search_vector, websearch_to_tsquery('english', 'tăng huyết áp')) as rank
FROM clinical_schema.medical_records
WHERE search_vector @@ websearch_to_tsquery('english', 'tăng huyết áp')
ORDER BY rank DESC;
```

### Get Access Audit Trail (HIPAA)
```sql
SELECT 
  a.accessed_at,
  a.accessed_by,
  a.access_type,
  a.purpose,
  a.ip_address,
  mr.record_id,
  mr.patient_id
FROM clinical_schema.medical_record_access a
JOIN clinical_schema.medical_records mr ON mr.id = a.medical_record_id
WHERE mr.patient_id = 'PAT-202510-001'
ORDER BY a.accessed_at DESC;
```

### Doctor Performance Statistics
```sql
SELECT * FROM clinical_schema.get_doctor_statistics('CARD-DOC-202510-001');
```

### Patient Medical Summary
```sql
SELECT * FROM clinical_schema.get_patient_statistics('PAT-202510-001');
```

---

## 🧪 Testing Queries

### Verify Schema Completeness
```sql
-- Check all required tables exist
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'clinical_schema'
ORDER BY table_name;

-- Expected output:
-- medical_record_access
-- medical_record_diagnoses
-- medical_record_medications
-- medical_records
```

### Check Column Count
```sql
-- Medical records should have 35+ columns
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'clinical_schema' 
AND table_name = 'medical_records';

-- Expected: >= 35
```

### Check Indexes
```sql
-- Should have 35+ indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'clinical_schema'
ORDER BY tablename, indexname;
```

### Check RLS Enabled
```sql
-- All tables should have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'clinical_schema';

-- All should show rowsecurity = true
```

### Test Function
```sql
-- Test ID generation
SELECT clinical_schema.generate_medical_record_id();

-- Test statistics
SELECT * FROM clinical_schema.get_medical_record_statistics();
```

---

## 📖 Field Descriptions

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Internal database ID |
| `record_id` | VARCHAR(20) | Yes | Business ID: MR-YYYYMM-XXX |
| `patient_id` | VARCHAR(20) | Yes | Patient reference: PAT-YYYYMM-XXX |
| `doctor_id` | VARCHAR(30) | Yes | Doctor reference: DEPT-DOC-YYYYMM-XXX |
| `appointment_id` | UUID | No | Link to appointment |
| `visit_date` | DATE | Yes | Date of medical visit |

### Medical Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `symptoms` | TEXT | Patient-reported symptoms |
| `examination_notes` | TEXT | Doctor's examination findings |
| `diagnosis` | TEXT | Legacy: Single diagnosis text |
| `treatment` | TEXT | Treatment plan |
| `medications` | TEXT | Legacy: Single medication text |
| `notes` | TEXT | Additional clinical notes |

### Enhanced Fields (JSONB)

| Field | Type | Content Example |
|-------|------|----------------|
| `vital_signs` | JSONB | `{"temperature": 37.5, "heartRate": 75}` |
| `diagnoses_json` | JSONB | `[{"code": "I10", "display": "Tăng huyết áp", "severity": "moderate"}]` |
| `medications_json` | JSONB | `[{"code": "VN-00123", "name": "Amlodipine 5mg", "dosage": "1 viên"}]` |
| `access_log_json` | JSONB | `[{"accessedAt": "2025-10-25", "accessedBy": "DOC-001", "type": "read"}]` |

### FHIR Fields

| Field | Type | Description |
|-------|------|-------------|
| `fhir_resource_id` | VARCHAR(100) | FHIR Composition resource ID |
| `fhir_version` | VARCHAR(20) | FHIR version (default: 4.0.1) |
| `fhir_profile` | TEXT | FHIR profile URI |
| `fhir_compliant` | BOOLEAN | Auto-validated FHIR compliance |

### Vietnamese Healthcare Fields

| Field | Type | Description |
|-------|------|-------------|
| `vietnamese_medical_code` | VARCHAR(50) | Mã hồ sơ theo BYT |
| `specialty_code` | VARCHAR(10) | Mã chuyên khoa (CARD, NEUR, etc.) |
| `hospital_code` | VARCHAR(20) | Mã bệnh viện |

### Optimization Fields

| Field | Type | Description |
|-------|------|-------------|
| `has_vital_signs` | BOOLEAN | Flag for quick filtering |
| `has_complete_vital_signs` | BOOLEAN | All vital signs present |
| `critical_diagnoses_count` | INTEGER | Count of critical diagnoses |
| `active_medications_count` | INTEGER | Count of active medications |
| `search_vector` | TSVECTOR | Auto-generated search index |

### Audit Fields

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | TIMESTAMPTZ | When record was created |
| `updated_at` | TIMESTAMPTZ | When record was last updated |
| `created_by` | UUID | Who created the record |
| `updated_by` | UUID | Who last updated |
| `deleted_at` | TIMESTAMPTZ | When soft deleted (null if active) |
| `deleted_by` | UUID | Who deleted |
| `last_accessed_at` | TIMESTAMPTZ | Last access timestamp |
| `last_accessed_by` | VARCHAR | Last accessor |
| `version` | INTEGER | Optimistic locking version |

---

## 🎯 Data Constraints

### Format Validations

```sql
-- Record ID must be MR-YYYYMM-XXX
CHECK (record_id ~ '^MR-\d{6}-\d{3}$')

-- Patient ID must be PAT-YYYYMM-XXX
CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$')

-- Doctor ID must be DEPT-DOC-YYYYMM-XXX
CHECK (doctor_id ~ '^[A-Z]{2,4}-DOC-\d{6}-\d{3}$')
```

### Date Validations

```sql
-- Visit date must be within range
CHECK (
  visit_date >= (CURRENT_DATE - INTERVAL '1 year') AND 
  visit_date <= (CURRENT_DATE + INTERVAL '7 days')
)
```

### Status Validations

```sql
-- Status must be one of allowed values
CHECK (status IN (
  'active', 'archived', 'deleted', 'draft', 
  'pending-review', 'reviewed', 'amended'
))
```

### Version Control

```sql
-- Version must be non-negative
CHECK (version >= 0)
```

---

## 🔗 Relationships

### Foreign Key Constraints (Soft References)

**NOTE**: We use SOFT references (string IDs) not foreign keys because data is in different services/schemas.

```
medical_records.patient_id -> patient_schema.patients.patient_id (soft)
medical_records.doctor_id -> provider_schema.providers.provider_id (soft)
medical_records.appointment_id -> appointments_schema.appointments.id (soft)
```

### Internal Foreign Keys (Hard References)

```
medical_record_diagnoses.medical_record_id -> medical_records.id (CASCADE DELETE)
medical_record_medications.medical_record_id -> medical_records.id (CASCADE DELETE)
medical_record_access.medical_record_id -> medical_records.id (CASCADE DELETE)
```

---

## 📚 Additional Resources

- **FHIR R4 Specification**: https://www.hl7.org/fhir/
- **ICD-10 Codes**: https://www.who.int/standards/classifications/classification-of-diseases
- **HIPAA Compliance**: https://www.hhs.gov/hipaa/
- **Vietnamese Healthcare Standards**: Ministry of Health regulations
- **PostgreSQL Full-Text Search**: https://www.postgresql.org/docs/current/textsearch.html

---

## ⚠️ Important Notes

1. **Always backup before migration**
2. **Test in development first**
3. **Run during maintenance window for production**
4. **Monitor application logs after migration**
5. **Verify data integrity after migration**

---

**Migration Status**: ⏳ **Pending Execution**  
**Schema Status**: ❌ **Incomplete - Requires Migration**  
**Code Compatibility**: ❌ **Will fail without migration**

**NEXT STEP**: Choose and run appropriate migration file (001 or 002)

