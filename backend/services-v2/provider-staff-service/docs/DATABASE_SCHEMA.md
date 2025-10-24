# Database Schema Documentation
## Provider Staff Service - Supabase PostgreSQL

**Version**: 2.0.0  
**Last Updated**: 2025-01-07  
**Database**: Supabase PostgreSQL 15.8.1  
**Schema**: `provider_schema`  
**Project ID**: `ciasxktujslgsdgylimv`

---

## Tables Overview

| Table | RLS Enabled | Policies | Purpose |
|-------|-------------|----------|---------|
| `staff_profiles` | ✅ Yes | 6 | Core staff information |
| `staff_read_model` | ✅ Yes | 2 | CQRS read model (ratings) |
| `staff_consultation_fees_backup` | ❌ No | 0 | Backup (deprecated) |

---

## 1. `staff_profiles` (Main Table)

### Schema Summary

- **Primary Key**: `id` (UUID)
- **Unique Keys**: `staff_id`, `license_number`
- **Total Columns**: 27
- **Indexes**: 17 (including 3 GIN indexes for JSONB)

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `staff_id` | VARCHAR | Business ID (e.g., STAFF-DOC-001) |
| `user_id` | UUID | Foreign key to auth.users |
| `staff_type` | VARCHAR | DOCTOR, NURSE, ADMIN |
| `personal_info` | JSONB | Name, contact, national ID |
| `professional_info` | JSONB | Department, position, specialization |
| `license_number` | VARCHAR | Medical license (unique) |
| `is_active` | BOOLEAN | Active status |
| `status` | VARCHAR | active, inactive, suspended |

### Indexes

```sql
-- Primary & Unique
staff_profiles_pkey (id)
staff_profiles_staff_id_key (staff_id)
staff_profiles_license_number_key (license_number)

-- Query Optimization
idx_staff_profiles_user_id (user_id)
idx_staff_profiles_staff_type (staff_type)
idx_staff_profiles_is_active (is_active)
idx_staff_profiles_department ((professional_info->>'department'))

-- GIN Indexes for JSONB
idx_staff_profiles_specializations_gin (specializations)
idx_staff_profiles_credentials_gin (credentials)
idx_staff_department_assignments (department_assignments)
```

---

## 2. `staff_read_model` (CQRS Read Model)

### Schema Summary

- **Primary Key**: `staff_id` (VARCHAR)
- **Total Columns**: 11
- **Indexes**: 4
- **Purpose**: Denormalized rating data from Review Service

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `staff_id` | VARCHAR | Primary key |
| `full_name` | VARCHAR | Staff full name |
| `average_rating` | NUMERIC | Average rating (0.00-5.00) |
| `total_reviews` | INTEGER | Total number of reviews |
| `rating_distribution` | JSONB | Rating distribution (1-5 stars) |

### Indexes

```sql
staff_read_model_pkey (staff_id)
idx_staff_read_model_average_rating (average_rating DESC)
idx_staff_read_model_total_reviews (total_reviews DESC)
idx_staff_read_model_user_id (user_id)
```

---

## Row Level Security (RLS)

### Status

✅ **RLS Enabled** on:
- `staff_profiles` (6 policies)
- `staff_read_model` (2 policies)

❌ **RLS Disabled** on:
- `staff_consultation_fees_backup` (deprecated table)

### Policy Summary

See [RLS_POLICIES_GUIDE.md](./RLS_POLICIES_GUIDE.md) for detailed documentation.

---

## Performance Optimization

### Common Query Patterns

**Find Active Doctors by Department**:
```sql
SELECT staff_id, personal_info->>'fullName' as full_name
FROM provider_schema.staff_profiles
WHERE staff_type = 'DOCTOR'
  AND professional_info->>'department' = 'Cardiology'
  AND is_active = true;
```

**Find Top Rated Doctors**:
```sql
SELECT staff_id, full_name, average_rating, total_reviews
FROM provider_schema.staff_read_model
WHERE total_reviews >= 10
ORDER BY average_rating DESC
LIMIT 10;
```

---

## Migration History

| Version | File | Date | Description |
|---------|------|------|-------------|
| 005 | `005_add_missing_rls_policies.sql` | 2025-01-07 | Phase 1 Critical Fixes |

---

## Monitoring

```sql
-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('provider_schema.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'provider_schema';

-- Row counts
SELECT 
  COUNT(*) as total_staff,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff
FROM provider_schema.staff_profiles;
```

---

## References

- Supabase Project: `ciasxktujslgsdgylimv`
- Region: `ap-southeast-1`
- PostgreSQL Version: `15.8.1.085`
