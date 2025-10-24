# Row Level Security (RLS) Policies Guide
## Provider Staff Service - Database Security

**Version**: 2.0.0  
**Last Updated**: 2025-01-07  
**Compliance**: HIPAA, Vietnamese Healthcare Standards

---

## Overview

Provider Staff Service implements **Row Level Security (RLS)** at the database level to enforce access control policies. This ensures that users can only access data they are authorized to see, even if application-level security is bypassed.

---

## Database Schema

### Tables with RLS Enabled

1. **`provider_schema.staff_profiles`** ✅ RLS Enabled
   - Core staff information
   - 6 RLS policies active
   - Sensitive PHI data protected

2. **`provider_schema.staff_read_model`** ✅ RLS Enabled
   - Denormalized read model for queries
   - 2 RLS policies active
   - Public rating data (non-PHI)

---

## RLS Policies Summary

### `staff_profiles` (6 Policies)

| Policy Name | Command | Role | Purpose |
|-------------|---------|------|---------|
| `service_role_all_staff_profiles` | ALL | service_role | Backend services full access |
| `admin_all_staff_profiles` | ALL | authenticated | ADMIN/SUPER_ADMIN full access |
| `staff_own_profile` | ALL | authenticated | Staff manage own profile |
| `authenticated_view_active_staff` | SELECT | authenticated | View active staff |
| `doctor_view_doctors` | SELECT | authenticated | Doctors view other doctors |
| `department_manager_access` | ALL | authenticated | Department managers manage staff |

### `staff_read_model` (2 Policies)

| Policy Name | Command | Role | Purpose |
|-------------|---------|------|---------|
| `service_role_all_staff_read_model` | ALL | service_role | Backend services full access |
| `authenticated_view_staff_read_model` | SELECT | authenticated | All users view ratings |

---

## Testing RLS Policies

### Manual Test Queries

```sql
-- Test 1: Verify policy count
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'provider_schema' 
  AND tablename = 'staff_profiles';
-- Expected: 6

-- Test 2: List all policies
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'provider_schema' 
  AND tablename = 'staff_profiles'
ORDER BY policyname;

-- Test 3: Check RLS enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'provider_schema'
ORDER BY tablename;
-- Expected: staff_profiles = true, staff_read_model = true
```

---

## Security Best Practices

1. **Always use service role for backend operations**
2. **Validate JWT claims before database access**
3. **Audit all data access for HIPAA compliance**
4. **Test RLS policies regularly**

---

## References

- Migration File: `migrations/005_add_missing_rls_policies.sql`
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
