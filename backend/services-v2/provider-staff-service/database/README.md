# Provider Staff Service - Database Schema

## Overview

Database schema cho Provider Staff Service V2 với Clean Architecture + DDD patterns.

## Schema Information

- **Schema Name**: `provider_schema`
- **Main Table**: `staff_profiles`
- **Architecture**: Clean Architecture + DDD + CQRS
- **Compliance**: HIPAA, Vietnamese Healthcare Standards

## Features

### Multi-Type Staff Support
- Doctors (bác sĩ)
- Nurses (y tá)
- Technicians (kỹ thuật viên)
- Pharmacists (dược sĩ)
- Therapists (nhà trị liệu)
- Admin Staff (nhân viên hành chính)
- Receptionists (lễ tân)

### JSONB Structure
- **personal_info**: Thông tin cá nhân (fullName, dateOfBirth, gender, nationalId, address)
- **professional_info**: Thông tin nghề nghiệp (title, department, position, education, languages, bio)
- **work_schedule**: Lịch làm việc (shifts, breakTime, maxPatientsPerDay)
- **specializations**: Chuyên khoa (array of specialization objects)
- **credentials**: Chứng chỉ hành nghề (array of credential objects)
- **certifications**: Chứng nhận chuyên môn (array of certification objects)
- **availability**: Lịch khả dụng (array of availability objects)
- **reviews**: Đánh giá (array of review objects)
- **department_assignments**: Phân công khoa (array of department assignment objects)

### Vietnamese Healthcare Compliance
- **vietnamese_healthcare_license**: Chứng chỉ hành nghề Việt Nam
- **moh_registration_number**: Số đăng ký Bộ Y tế
- **license_number**: Số giấy phép hành nghề (UNIQUE)

## Setup Instructions

### 1. Create Schema in Supabase

#### Option A: Using Supabase SQL Editor (Recommended)

1. Mở Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project: `ciasxktujslgsdgylimv`
3. Vào **SQL Editor**
4. Copy nội dung file `schema.sql`
5. Paste vào SQL Editor
6. Click **Run** để execute

#### Option B: Using psql

```bash
# Connect to Supabase database
psql -h db.ciasxktujslgsdgylimv.supabase.co -U postgres -d postgres

# Run schema file
\i backend/services-v2/provider-staff-service/database/schema.sql
```

#### Option C: Using Supabase MCP (Recommended for automation)

```typescript
// Use apply_migration_supabase tool
await apply_migration_supabase({
  project_id: 'ciasxktujslgsdgylimv',
  name: 'create_provider_schema',
  query: fs.readFileSync('schema.sql', 'utf8')
});
```

### 2. Verify Schema Creation

```sql
-- Check if schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'provider_schema';

-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'provider_schema';

-- Check table structure
\d provider_schema.staff_profiles
```

### 3. Seed Database (Optional)

```bash
# Seed with sample data
npm run db:seed

# Clean seed data
npm run db:seed:clean

# Reset (clean + seed)
npm run db:seed:reset
```

## Table Structure

### staff_profiles

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| staff_id | VARCHAR(30) | Unique staff ID: {TYPE}-{DEPT}-YYYYMM-XXX |
| user_id | UUID | Reference to auth_schema.user_profiles |
| staff_type | VARCHAR(20) | doctor, nurse, technician, etc. |
| personal_info | JSONB | Personal information |
| professional_info | JSONB | Professional information |
| work_schedule | JSONB | Work schedule |
| specializations | JSONB | Array of specializations |
| credentials | JSONB | Array of credentials |
| certifications | JSONB | Array of certifications |
| availability | JSONB | Array of availability slots |
| reviews | JSONB | Array of reviews |
| department_assignments | JSONB | Array of department assignments |
| license_number | VARCHAR(100) | Unique license number |
| employment_type | VARCHAR(20) | full_time, part_time, contract, etc. |
| hire_date | DATE | Date of hire |
| contract_end_date | DATE | Contract end date (nullable) |
| consultation_fee | NUMERIC(10,2) | Consultation fee (for doctors) |
| years_of_experience | INTEGER | Years of experience |
| rating | NUMERIC(3,2) | Average rating (0.00 to 5.00) |
| total_patients | INTEGER | Total patients served |
| is_accepting_new_patients | BOOLEAN | Accepting new patients flag |
| status | VARCHAR(20) | active, inactive, suspended, on_leave, terminated |
| is_active | BOOLEAN | Active flag |
| registration_date | TIMESTAMP | Registration date |
| last_active_date | TIMESTAMP | Last active date |
| vietnamese_healthcare_license | VARCHAR(100) | Vietnamese healthcare license |
| moh_registration_number | VARCHAR(100) | Ministry of Health registration |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| created_by | VARCHAR(255) | Created by user |
| updated_by | VARCHAR(255) | Updated by user |

## Indexes

### B-Tree Indexes
- `idx_staff_profiles_user_id` - Fast lookup by user_id
- `idx_staff_profiles_staff_id` - Fast lookup by staff_id
- `idx_staff_profiles_license_number` - Fast lookup by license
- `idx_staff_profiles_staff_type` - Filter by staff type
- `idx_staff_profiles_status` - Filter by status
- `idx_staff_profiles_is_active` - Filter by active status
- `idx_staff_profiles_employment_type` - Filter by employment type
- `idx_staff_profiles_full_name` - Search by full name (JSONB)
- `idx_staff_profiles_national_id` - Search by national ID (JSONB)
- `idx_staff_profiles_department` - Search by department (JSONB)

### GIN Indexes (for JSONB arrays)
- `idx_staff_profiles_specializations_gin` - Fast search in specializations
- `idx_staff_profiles_credentials_gin` - Fast search in credentials
- `idx_staff_profiles_certifications_gin` - Fast search in certifications

## Row Level Security (RLS)

### Policies

1. **service_role_all_staff_profiles**
   - Role: `service_role`
   - Access: Full access (SELECT, INSERT, UPDATE, DELETE)
   - Condition: Always true

2. **authenticated_view_active_staff**
   - Role: `authenticated`
   - Access: SELECT only
   - Condition: `is_active = true AND status = 'active'`

3. **staff_own_profile**
   - Role: `authenticated`
   - Access: Full access to own profile
   - Condition: `auth.uid() = user_id`

## Triggers

### update_staff_profiles_updated_at
- Automatically updates `updated_at` column on every UPDATE
- Ensures audit trail accuracy

## Sample Queries

### Find all active doctors
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE staff_type = 'doctor'
  AND is_active = true
  AND status = 'active';
```

### Find staff by license number
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE license_number = 'LIC123456';
```

### Find staff by specialization
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE specializations @> '[{"code": "CARD"}]'::jsonb;
```

### Find staff by department
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE professional_info->>'department' = 'Cardiology';
```

### Find available doctors for today
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE staff_type = 'doctor'
  AND is_accepting_new_patients = true
  AND is_active = true
  AND status = 'active';
```

## Migration History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2025-01-10 | Initial schema creation |

## Notes

- All JSONB fields use snake_case for consistency with PostgreSQL conventions
- Staff IDs follow format: `{TYPE}-{DEPT}-YYYYMM-XXX`
  - TYPE: DOC (doctor), NUR (nurse), TEC (technician), PHA (pharmacist), THE (therapist), ADM (admin), REC (receptionist)
  - DEPT: Department code (e.g., CARD, NEUR, ORTH)
  - YYYYMM: Registration year and month
  - XXX: Sequential number (001-999)
- All timestamps use UTC timezone
- Soft delete is implemented via `is_active` and `status` fields
- HIPAA compliance through RLS policies and audit fields

## Support

For issues or questions, contact the Hospital Management Team.

