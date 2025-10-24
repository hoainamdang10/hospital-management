# Supabase Schema Quick Reference

**Provider/Staff Service - Live Database Schema**

> 🔗 **Database**: Supabase (Project: `ciasxktujslgsdgylimv`)  
> 📍 **Schema**: `provider_schema`  
> ✅ **Status**: Live & Operational

---

## 📊 Schema Overview

```
provider_schema (3 tables)
├── staff_profiles (Write Model - 32 columns)
│   ├── Primary: id (UUID)
│   ├── Business ID: staff_id (VARCHAR, UNIQUE)
│   ├── Foreign: user_id (UUID → auth_schema.users)
│   ├── Classification: staff_type, employment_type, status, is_active
│   ├── JSONB: personal_info, professional_info, work_schedule
│   ├── JSONB Arrays: specializations, credentials, certifications, availability, department_assignments
│   ├── Audit: created_at, updated_at, created_by, updated_by
│   └── Indexes: 15 (BTREE + GIN)
│
├── staff_read_model (Read Model - 11 columns)
│   ├── Primary: staff_id (VARCHAR, UNIQUE)
│   ├── Denormalized: full_name, specialization, department
│   ├── Rating: average_rating, total_reviews, rating_distribution
│   ├── Timestamps: created_at, updated_at
│   └── Indexes: 4 (BTREE)
│
└── staff_consultation_fees_backup (Legacy - to be migrated)
```

---

## 🗂️ Table Reference

### `staff_profiles` - Write Model

**Purpose**: Main aggregate root for healthcare staff  
**Rows**: ~100+  
**Primary Key**: `id` (UUID)  
**Business Key**: `staff_id` (VARCHAR, UNIQUE)

#### Key Columns

| Column | Type | Nullable | Key | Purpose |
|--------|------|----------|-----|---------|
| `id` | UUID | NO | PK | Auto-generated primary key |
| `staff_id` | VARCHAR(50) | NO | UNIQUE | Business identifier (DOC-CARD-202501-001) |
| `user_id` | UUID | NO | - | Reference to auth_schema.users |
| `staff_type` | VARCHAR(50) | NO | INDEX | doctor, nurse, technician, pharmacist, therapist, admin, receptionist |
| `employment_type` | VARCHAR(20) | NO | INDEX | full_time, part_time, contract, intern, volunteer |
| `status` | VARCHAR(20) | NO | INDEX | active, inactive, suspended, on_leave, terminated |
| `is_active` | BOOLEAN | NO | INDEX | Soft delete flag |
| `license_number` | VARCHAR(100) | NO | UNIQUE | Medical license (UNIQUE) |
| `hire_date` | DATE | NO | - | Employment start date |
| `years_of_experience` | INTEGER | NO | - | Total experience years |
| `personal_info` | JSONB | NO | - | fullName, dateOfBirth, gender, nationalId, phoneNumber, email, address |
| `professional_info` | JSONB | NO | - | title, department, education, languages |
| `work_schedule` | JSONB | NO | - | workingDays, workingHours, breakTime |
| `specializations` | JSONB | YES | GIN | Array of {name, level, yearsOfExperience} |
| `credentials` | JSONB | YES | GIN | Array of {type, number, issuedBy, issuedDate, expiryDate, isVerified} |
| `certifications` | JSONB | YES | GIN | Array of {name, issuingOrganization, issueDate, expiryDate} |
| `department_assignments` | JSONB | YES | GIN | Array of {departmentId, departmentCode, role, isPrimary, startDate, endDate, isActive} |
| `created_at` | TIMESTAMP | NO | - | Record creation time |
| `updated_at` | TIMESTAMP | NO | - | Record update time |
| `created_by` | VARCHAR(255) | NO | - | Creator user ID |
| `updated_by` | VARCHAR(255) | NO | - | Last updater user ID |

#### Constraints

```sql
PRIMARY KEY (id)
UNIQUE (staff_id)
UNIQUE (license_number)
CHECK (staff_type IN ('doctor', 'nurse', 'technician', 'pharmacist', 'therapist', 'admin', 'receptionist'))
CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'volunteer'))
CHECK (status IN ('active', 'inactive', 'suspended', 'on_leave', 'terminated'))
CHECK (years_of_experience >= 0)
```

---

### `staff_read_model` - Read Model

**Purpose**: CQRS denormalized view for optimized queries  
**Rows**: ~100+  
**Primary Key**: `staff_id` (VARCHAR)  
**Sync**: Auto-synced from `staff_profiles` via trigger

#### Columns

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `staff_id` | VARCHAR(50) | NO | - | Primary key (UNIQUE) |
| `user_id` | VARCHAR(255) | NO | - | User reference |
| `full_name` | VARCHAR(255) | NO | - | Denormalized from personal_info.fullName |
| `specialization` | VARCHAR(100) | YES | - | Primary specialization |
| `department` | VARCHAR(100) | YES | - | Primary department |
| `average_rating` | NUMERIC | YES | 0.00 | From Review Service (denormalized) |
| `total_reviews` | INTEGER | YES | 0 | From Review Service (denormalized) |
| `rating_distribution` | JSONB | YES | {1:0, 2:0, 3:0, 4:0, 5:0} | Rating breakdown |
| `last_review_date` | TIMESTAMP | YES | - | Last review timestamp |
| `created_at` | TIMESTAMP | YES | now() | Record creation time |
| `updated_at` | TIMESTAMP | YES | now() | Record update time |

---

## 🔍 Indexes

### `staff_profiles` Indexes (15 total)

**Primary & Unique**:
- `staff_profiles_pkey` - PRIMARY KEY (id)
- `staff_profiles_staff_id_key` - UNIQUE (staff_id)
- `staff_profiles_license_number_key` - UNIQUE (license_number)

**BTREE Indexes** (Fast lookups):
- `idx_staff_profiles_user_id` - (user_id)
- `idx_staff_profiles_staff_id` - (staff_id)
- `idx_staff_profiles_staff_type` - (staff_type)
- `idx_staff_profiles_status` - (status)
- `idx_staff_profiles_is_active` - (is_active)
- `idx_staff_profiles_employment_type` - (employment_type)
- `idx_staff_profiles_license_number` - (license_number)
- `idx_staff_profiles_full_name` - ((personal_info ->> 'fullName'))
- `idx_staff_profiles_national_id` - ((personal_info ->> 'nationalId'))
- `idx_staff_profiles_department` - ((professional_info ->> 'department'))

**GIN Indexes** (Array/JSONB searches):
- `idx_staff_profiles_specializations_gin` - (specializations)
- `idx_staff_profiles_credentials_gin` - (credentials)
- `idx_staff_profiles_certifications_gin` - (certifications)
- `idx_staff_department_assignments` - (department_assignments)

### `staff_read_model` Indexes (4 total)

- `staff_read_model_pkey` - PRIMARY KEY (staff_id)
- `idx_staff_read_model_user_id` - (user_id)
- `idx_staff_read_model_average_rating` - (average_rating DESC)
- `idx_staff_read_model_total_reviews` - (total_reviews DESC)

---

## 📝 Common Queries

### Find Staff by ID
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE staff_id = 'DOC-CARD-202501-001';
```

### Find Active Doctors
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE staff_type = 'doctor' 
  AND status = 'active' 
  AND is_active = true;
```

### Find Staff by Department
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE professional_info->>'department' = 'Khoa Tim mạch'
  AND is_active = true;
```

### Find Staff with Specialization
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE specializations @> '[{"name": "Cardiology"}]'::jsonb;
```

### Get Top Rated Staff
```sql
SELECT * FROM provider_schema.staff_read_model
WHERE average_rating >= 4.0
ORDER BY average_rating DESC, total_reviews DESC
LIMIT 10;
```

### Find Staff by License
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE license_number = 'BYS-12345';
```

### Find Staff by National ID
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE personal_info->>'nationalId' = '123456789';
```

### Search Staff by Name
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE personal_info->>'fullName' ILIKE '%Nguyễn%'
  AND is_active = true;
```

### Get Staff in Department with Specialization
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE professional_info->>'department' = 'Khoa Tim mạch'
  AND specializations @> '[{"name": "Cardiology"}]'::jsonb
  AND is_active = true;
```

---

## 🔐 Row Level Security (RLS)

**Policies Enabled**: YES

| Policy | Role | Operation | Condition |
|--------|------|-----------|-----------|
| `service_role_all_staff_profiles` | service_role | ALL | true (full access) |
| `authenticated_view_active_staff` | authenticated | SELECT | is_active = true AND status = 'active' |
| `staff_own_profile` | authenticated | ALL | auth.uid() = user_id |
| `admin_all_staff_profiles` | authenticated | ALL | role IN ('SUPER_ADMIN', 'ADMIN') |
| `doctor_view_doctors` | authenticated | SELECT | role = 'DOCTOR' AND staff_type = 'doctor' |
| `department_manager_access` | authenticated | ALL | role = 'DEPARTMENT_HEAD' AND in_department |

---

## 🔄 Triggers

### `sync_staff_read_model_trigger`

**Event**: AFTER INSERT OR UPDATE on `staff_profiles`  
**Function**: `provider_schema.sync_staff_read_model()`  
**Purpose**: Auto-sync write model → read model

**Synced Fields**:
- full_name (from personal_info.fullName)
- specialization (from specializations[0].name)
- department (from professional_info.department)
- staff_type
- status
- is_active
- employment_type
- email (from personal_info.email)
- phone_number (from personal_info.phoneNumber)
- title (from professional_info.title)
- years_of_experience
- license_number
- search_vector (for full-text search)
- last_synced_at

---

## 📊 Data Types

| Type | Usage | Example |
|------|-------|---------|
| `UUID` | Primary/Foreign keys | `id`, `user_id` |
| `VARCHAR(n)` | Text with max length | `staff_id`, `license_number` |
| `DATE` | Date fields | `hire_date`, `contract_end_date` |
| `TIMESTAMP` | Timestamps | `created_at`, `updated_at` |
| `BOOLEAN` | Boolean flags | `is_active` |
| `INTEGER` | Counts/Numbers | `years_of_experience`, `total_reviews` |
| `NUMERIC` | Decimals | `average_rating` |
| `JSONB` | Flexible JSON | `personal_info`, `credentials`, etc. |

---

## 🔗 Relationships

### Cross-Schema References

```
auth_schema.users (id)
    ↑
    │ user_id (soft reference, no FK)
    │
provider_schema.staff_profiles
    ↓ (trigger sync)
provider_schema.staff_read_model
    ↓ (denormalized)
    ├── full_name
    ├── specialization
    ├── department
    ├── average_rating (from Review Service)
    ├── total_reviews (from Review Service)
    └── rating_distribution (from Review Service)
```

**Note**: No foreign key constraints (schema-per-service pattern)

---

## ⚡ Performance Tips

### Use Indexed Columns
```sql
-- ✅ GOOD - Uses index
WHERE staff_type = 'doctor' AND is_active = true

-- ❌ SLOW - Full table scan
WHERE professional_info->>'department' = 'Cardiology'
```

### Use GIN for JSONB Arrays
```sql
-- ✅ GOOD - Uses GIN index
WHERE specializations @> '[{"name": "Cardiology"}]'::jsonb

-- ❌ SLOW - Full table scan
WHERE specializations::text LIKE '%Cardiology%'
```

### Use Read Model for Queries
```sql
-- ✅ GOOD - Denormalized, fast
SELECT * FROM provider_schema.staff_read_model
WHERE average_rating >= 4.0

-- ❌ SLOWER - Requires calculation
SELECT * FROM provider_schema.staff_profiles
WHERE (SELECT AVG(rating) FROM reviews WHERE staff_id = ...) >= 4.0
```

---

## 📋 Enums

### Staff Type
```
doctor, nurse, technician, pharmacist, therapist, admin, receptionist
```

### Employment Type
```
full_time, part_time, contract, intern, volunteer
```

### Status
```
active, inactive, suspended, on_leave, terminated
```

---

## 🔄 Sync Strategy

**Write Model** (`staff_profiles`):
- Normalized data
- Single source of truth
- Updated by application

**Read Model** (`staff_read_model`):
- Denormalized data
- Optimized for queries
- Auto-synced via trigger
- Includes rating data from Review Service

---

## 📚 Related Files

- **Full Schema Docs**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Domain Model**: [ProviderStaff.ts](../src/domain/aggregates/ProviderStaff.ts)
- **Repository**: [SupabaseProviderStaffRepository.ts](../src/infrastructure/repositories/SupabaseProviderStaffRepository.ts)
- **Query Handlers**: [StaffQueryHandlers.ts](../src/application/handlers/StaffQueryHandlers.ts)

---

**Last Updated**: 2025-01-22  
**Database Status**: ✅ Live  
**Project ID**: ciasxktujslgsdgylimv
