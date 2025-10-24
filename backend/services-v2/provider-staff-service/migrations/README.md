# Provider/Staff Service - Database Migrations

## Overview
Database migrations for Provider/Staff Service following Clean Architecture and HIPAA compliance standards.

## Migration Files

### 001_create_initial_schema.sql
**Purpose**: Create initial provider_schema and staff_profiles table
**Status**: ✅ Ready to apply
**Dependencies**: None

**Creates**:
- Schema: `provider_schema`
- Table: `staff_profiles` (main aggregate table)
- Constraints: Staff ID format, years of experience validation

**Rollback**:
```sql
DROP TABLE IF EXISTS provider_schema.staff_profiles CASCADE;
DROP SCHEMA IF EXISTS provider_schema CASCADE;
```

---

### 002_create_indexes.sql
**Purpose**: Create performance indexes for staff_profiles table
**Status**: ✅ Ready to apply
**Dependencies**: 001_create_initial_schema.sql

**Creates**:
- 7 BTREE indexes (user_id, staff_id, license_number, staff_type, status, is_active, employment_type)
- 3 JSONB indexes (full_name, national_id, department)
- 4 GIN indexes (specializations, credentials, certifications, department_assignments)
- 3 Composite indexes (active_type, active_department, status_type)

**Rollback**: See migration file for DROP INDEX statements

---

### 003_enable_rls_policies.sql
**Purpose**: Enable Row Level Security (RLS) policies for HIPAA compliance
**Status**: ✅ Ready to apply
**Dependencies**: 001_create_initial_schema.sql, 002_create_indexes.sql

**Creates**:
- 6 RLS policies (service_role, authenticated_view, staff_own_profile, admin_all, doctor_view_doctors, department_manager)
- Audit logging trigger (audit_staff_changes)
- Updated_at trigger (update_updated_at_column)

**Compliance**: HIPAA, Vietnamese Healthcare Standards

**Rollback**: See migration file for DROP POLICY and DROP TRIGGER statements

---

### 004_create_read_model.sql
**Purpose**: Create optimized read model for CQRS pattern
**Status**: ✅ Ready to apply
**Dependencies**: 001_create_initial_schema.sql

**Creates**:
- Table: `staff_read_model` (denormalized for fast queries)
- 10 indexes (staff_id, user_id, staff_type, department, status, is_active, active_type, active_department, search_vector, full_data)
- Sync trigger (sync_staff_read_model) - auto-sync from write model
- Initial data sync from existing staff_profiles

**Pattern**: CQRS Read Model

**Rollback**: See migration file for DROP TABLE and DROP TRIGGER statements

---

## How to Apply Migrations

### Option 1: Manual Application (Recommended for Production)

```bash
# Connect to Supabase database
psql -h db.ciasxktujslgsdgylimv.supabase.co \
     -U postgres \
     -d postgres

# Apply migrations in order
\i migrations/001_create_initial_schema.sql
\i migrations/002_create_indexes.sql
\i migrations/003_enable_rls_policies.sql
\i migrations/004_create_read_model.sql
```

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref ciasxktujslgsdgylimv

# Apply migrations
supabase db push
```

### Option 3: Using Supabase MCP (Automated)

```bash
# From project root
cd backend/services-v2/provider-staff-service

# Apply all migrations
npm run migrate:up
```

---

## Migration Status Tracking

| Migration | Status | Applied Date | Applied By |
|-----------|--------|--------------|------------|
| 001_create_initial_schema.sql | ⏳ Pending | - | - |
| 002_create_indexes.sql | ⏳ Pending | - | - |
| 003_enable_rls_policies.sql | ⏳ Pending | - | - |
| 004_create_read_model.sql | ⏳ Pending | - | - |

**Note**: Update this table after applying each migration.

---

## Verification Queries

### Check Schema Exists
```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'provider_schema';
```

### Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'provider_schema'
ORDER BY table_name;
```

### Check Indexes Created
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'provider_schema'
  AND tablename = 'staff_profiles';
```

### Check RLS Policies
```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'provider_schema'
  AND tablename = 'staff_profiles';
```

### Check Triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'provider_schema';
```

---

## Rollback Procedures

### Rollback All Migrations (DANGER!)
```sql
-- Rollback in reverse order
\i migrations/004_create_read_model.sql  -- See ROLLBACK section
\i migrations/003_enable_rls_policies.sql  -- See ROLLBACK section
\i migrations/002_create_indexes.sql  -- See ROLLBACK section
\i migrations/001_create_initial_schema.sql  -- See ROLLBACK section
```

### Rollback Single Migration
See ROLLBACK section in each migration file for specific commands.

---

## Best Practices

1. **Always backup before applying migrations**
   ```bash
   pg_dump -h db.ciasxktujslgsdgylimv.supabase.co \
           -U postgres \
           -d postgres \
           -n provider_schema \
           > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test migrations in staging first**
   - Apply to staging environment
   - Run verification queries
   - Test application functionality
   - Only then apply to production

3. **Track migration status**
   - Update Migration Status Tracking table
   - Document any issues encountered
   - Keep rollback scripts ready

4. **Monitor performance after applying**
   - Check query performance
   - Monitor index usage
   - Verify RLS policies don't impact performance

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution**: Check if migration was partially applied. Use rollback scripts to clean up, then reapply.

### Issue: RLS policies block service access
**Solution**: Verify service role is used in backend. Check policy definitions match application requirements.

### Issue: Triggers not firing
**Solution**: Check trigger is enabled. Verify function exists and has correct permissions.

### Issue: Read model out of sync
**Solution**: Run manual sync:
```sql
TRUNCATE provider_schema.staff_read_model;
-- Then re-run initial sync from 004_create_read_model.sql
```

---

## Support

For issues or questions:
- Check migration file comments
- Review verification queries
- Contact: Hospital Management Team
- Version: 2.0.0
- Last Updated: 2025-01-20
