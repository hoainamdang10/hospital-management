# Scheduling Service Database Schema

## 📋 Overview

**Schema**: `scheduling_schema`  
**Pattern**: Schema Per Service (Microservices)  
**Compliance**: HIPAA, Vietnamese Healthcare Standards  
**Version**: 2.0.0

---

## 🏗️ Architecture Principles

### ✅ Schema Per Service Pattern

1. **Isolated Schema**: `scheduling_schema` is completely isolated from other services
2. **Soft References**: Uses business IDs (VARCHAR) instead of foreign keys to other schemas
3. **No Cross-Schema FKs**: Only foreign keys within the same schema
4. **Business IDs**: 
   - Patient: `PAT-YYYYMM-XXX` (from patient_schema)
   - Doctor: `DEPT-DOC-YYYYMM-XXX` (from provider_schema)
   - Appointment: `YYYY-APT-MMDDSS-NNN`

### ✅ HIPAA Compliance

- **Audit Logging**: All appointment operations are logged
- **PHI Access Logs**: Protected Health Information access tracking
- **Automatic Triggers**: Database triggers for audit trail
- **Row Level Security**: RLS policies for data access control

---

## 📊 Database Tables

### Core Tables

#### 1. `appointments` (Main Aggregate Root)
Main appointment records with soft references to patient and provider services.

**Key Columns**:
- `id` (UUID): Primary key
- `appointment_id` (TEXT): Business ID (YYYY-APT-MMDDSS-NNN)
- `patient_id` (VARCHAR(20)): Soft reference to patient (PAT-YYYYMM-XXX)
- `doctor_id` (VARCHAR(30)): Soft reference to doctor (DEPT-DOC-YYYYMM-XXX)
- `appointment_date`, `appointment_time`: Scheduling info
- `type`, `priority`, `status`: Appointment metadata
- `reason`, `symptoms`, `notes`: PHI data

**Constraints**:
- CHECK: patient_id format `^PAT-\d{6}-\d{3}$`
- CHECK: doctor_id format `^[A-Z]{2,4}-DOC-\d{6}-\d{3}$`
- CHECK: Valid appointment types, priorities, statuses

**Indexes**:
- `idx_appointments_patient_id`
- `idx_appointments_doctor_id`
- `idx_appointments_date`
- `idx_appointments_status`

---

#### 2. `appointment_audit_logs` (HIPAA Compliance)
Audit trail for all appointment operations.

**Key Columns**:
- `appointment_id`: Reference to appointment
- `action`: CREATE, UPDATE, DELETE, VIEW, etc.
- `user_id`: Who performed the action
- `changed_fields`: JSONB array of changed fields
- `old_values`, `new_values`: JSONB objects
- `timestamp`: When the action occurred

**Automatic Logging**: Trigger `trg_audit_appointments` logs all changes

---

#### 3. `phi_access_logs` (HIPAA Compliance)
PHI (Protected Health Information) access logging.

**Key Columns**:
- `appointment_id`: Reference to appointment
- `user_id`: Who accessed the data
- `access_type`: READ, WRITE, EXPORT, PRINT, DELETE
- `accessed_fields`: Array of PHI fields accessed
- `reason`: Business reason for access

**Usage**: Call `log_phi_access()` function when accessing PHI data

---

### Reference Tables

#### 4. `appointment_types`
Reference data for appointment types (CONSULTATION, FOLLOW_UP, etc.)

#### 5. `appointment_templates`
Templates for recurring appointments

#### 6. `appointment_slots`
Available time slots for doctors

#### 7. `waiting_queue`
Queue management for walk-in patients

---

## 🚀 Setup Instructions

### 1. Initial Schema Creation

```bash
# Connect to Supabase
psql -h <supabase-host> -U postgres -d postgres

# Run schema creation
\i backend/services-v2/scheduling-service/database/schema.sql
```

### 2. Run Migrations (If Upgrading from Old Schema)

```bash
# Migration 1: Fix soft references (UUID → VARCHAR)
\i backend/services-v2/scheduling-service/database/migrations/001_fix_soft_references.sql

# Migration 2: Add audit logging
\i backend/services-v2/scheduling-service/database/migrations/002_add_audit_logging.sql
```

### 3. Verify Setup

```sql
-- Check schema exists
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name = 'scheduling_schema';

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'scheduling_schema';

-- Check column types
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'scheduling_schema'
  AND table_name = 'appointments'
  AND column_name IN ('patient_id', 'doctor_id');

-- Expected output:
-- patient_id | character varying
-- doctor_id  | character varying
```

---

## 📝 Usage Examples

### Creating an Appointment

```sql
INSERT INTO scheduling_schema.appointments (
  appointment_id, patient_id, doctor_id,
  appointment_date, appointment_time,
  type, priority, status,
  reason, consultation_fee,
  created_by
) VALUES (
  '2025-APT-011101-001',
  'PAT-202501-001',
  'CARD-DOC-202501-001',
  '2025-01-15',
  '09:00:00',
  'CONSULTATION',
  'NORMAL',
  'SCHEDULED',
  'Khám tim mạch định kỳ',
  200000,
  'system'
);
```

### Logging PHI Access

```sql
-- When viewing appointment details
SELECT scheduling_schema.log_phi_access(
  '2025-APT-011101-001',
  'user-uuid-here'::uuid,
  'READ',
  ARRAY['reason', 'symptoms', 'notes'],
  'Reviewing patient appointment for consultation',
  '192.168.1.100'::inet
);
```

### Querying Audit Logs

```sql
-- Get audit trail for an appointment
SELECT 
  action,
  user_id,
  changed_fields,
  timestamp
FROM scheduling_schema.appointment_audit_logs
WHERE appointment_id = '2025-APT-011101-001'
ORDER BY timestamp DESC;
```

### Compliance Reports

```sql
-- PHI access report (last 30 days)
SELECT 
  user_id,
  COUNT(*) as access_count,
  array_agg(DISTINCT access_type) as access_types,
  MIN(timestamp) as first_access,
  MAX(timestamp) as last_access
FROM scheduling_schema.phi_access_logs
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY access_count DESC;
```

---

## 🔒 Row Level Security (RLS)

### Enabled Policies

1. **patients_view_own_appointments**: Patients can view their own appointments
2. **doctors_view_own_appointments**: Doctors can view their appointments
3. **admins_view_all_appointments**: Admins can view all appointments

### Testing RLS

```sql
-- Set user context
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-uuid-here';

-- Query should only return user's appointments
SELECT * FROM scheduling_schema.appointments;
```

---

## 🔧 Maintenance

### Backup

```sql
-- Backup appointments table
CREATE TABLE scheduling_schema.appointments_backup_YYYYMMDD AS
SELECT * FROM scheduling_schema.appointments;
```

### Cleanup Old Audit Logs

```sql
-- Archive audit logs older than 1 year
DELETE FROM scheduling_schema.appointment_audit_logs
WHERE timestamp < NOW() - INTERVAL '1 year';
```

### Performance Monitoring

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'scheduling_schema'
ORDER BY idx_scan DESC;
```

---

## 📚 References

- **Microservices Pattern**: [Database Per Service](https://microservices.io/patterns/data/database-per-service.html)
- **HIPAA Compliance**: [HHS HIPAA Guidelines](https://www.hhs.gov/hipaa/index.html)
- **Schema Per Service**: See `patient_schema`, `provider_schema`, `clinical_schema` for examples

---

## 🐛 Troubleshooting

### Issue: Foreign Key Violation

**Problem**: Trying to create FK to other schemas

**Solution**: Use soft references (business IDs) instead
```sql
-- ❌ Wrong
FOREIGN KEY (patient_id) REFERENCES patient_schema.patients(id)

-- ✅ Correct
patient_id VARCHAR(20) NOT NULL
CONSTRAINT chk_patient_id_format CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$')
```

### Issue: Type Mismatch

**Problem**: Repository expects strings but database has UUIDs

**Solution**: Run migration `001_fix_soft_references.sql`

### Issue: Missing Audit Logs

**Problem**: Changes not being logged

**Solution**: 
1. Check trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'trg_audit_appointments'`
2. Re-run migration: `002_add_audit_logging.sql`

---

## 📞 Support

For issues or questions, contact the Hospital Management Team.

**Last Updated**: 2025-01-11  
**Version**: 2.0.0

