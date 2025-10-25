# Migration Guide: Account Status Enhancement

## Overview
Migration `014_add_account_status_columns.sql` adds support for permanent account deactivation and enhanced account status tracking.

## Pre-Migration Checklist

### 1. Backup Database
```bash
# Create backup before migration
pg_dump -h <supabase-host> -U postgres -d postgres -n auth_schema > backup_auth_schema_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verify Current State
```sql
-- Check current user count
SELECT COUNT(*) FROM auth_schema.user_profiles;

-- Check active/inactive distribution
SELECT is_active, COUNT(*) 
FROM auth_schema.user_profiles 
GROUP BY is_active;
```

### 3. Review Migration Script
- Location: `migrations/014_add_account_status_columns.sql`
- Rollback: `migrations/014_add_account_status_columns_rollback.sql`

## Migration Steps

### Step 1: Connect to Supabase
```bash
# Using psql
psql -h <your-project>.supabase.co -U postgres -d postgres

# Or using Supabase CLI
supabase db push
```

### Step 2: Run Migration
```bash
# Option A: Direct SQL execution
psql -h <host> -U postgres -d postgres -f migrations/014_add_account_status_columns.sql

# Option B: Copy-paste in Supabase SQL Editor
# 1. Open Supabase Dashboard > SQL Editor
# 2. Copy content from 014_add_account_status_columns.sql
# 3. Execute
```

### Step 3: Verify Migration
```sql
-- Check new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'auth_schema' 
  AND table_name = 'user_profiles'
  AND column_name IN ('account_status', 'deactivation_reason', 'deactivated_at', 'deactivated_by');

-- Verify data migration
SELECT account_status, is_active, COUNT(*)
FROM auth_schema.user_profiles
GROUP BY account_status, is_active;

-- Expected result:
-- account_status | is_active | count
-- active         | true      | <count>
-- locked         | false     | <count>

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'auth_schema'
  AND trigger_name = 'trigger_compute_is_active';
```

### Step 4: Test Backward Compatibility
```sql
-- Test 1: Update account_status should sync is_active
UPDATE auth_schema.user_profiles
SET account_status = 'locked'
WHERE id = '<test-user-id>';

SELECT id, account_status, is_active
FROM auth_schema.user_profiles
WHERE id = '<test-user-id>';
-- Expected: account_status='locked', is_active=false

-- Test 2: Revert
UPDATE auth_schema.user_profiles
SET account_status = 'active'
WHERE id = '<test-user-id>';

SELECT id, account_status, is_active
FROM auth_schema.user_profiles
WHERE id = '<test-user-id>';
-- Expected: account_status='active', is_active=true
```

## Post-Migration Tasks

### 1. Update Application Code
- ✅ Already updated: `User.ts`, `UserMapper.ts`, `SupabaseUserRepository.ts`
- ✅ Use cases updated: `DeactivateUserUseCase`, `ActivateUserUseCase`, `LockAccountUseCase`, `UnlockAccountUseCase`

### 2. Deploy New Service Version
```bash
cd backend/services-v2/identity-service
npm run build
docker-compose up -d identity-service
```

### 3. Monitor Logs
```bash
# Check for errors
docker logs -f hospital-identity-service-v2

# Watch for domain events
# UserActivatedEvent, UserDeactivatedEvent should be published
```

### 4. Manual Data Review (Optional)
```sql
-- Review locked accounts to determine if any should be permanently deactivated
SELECT id, email, full_name, account_status, deactivated_at, deactivation_reason
FROM auth_schema.user_profiles
WHERE account_status = 'locked'
ORDER BY deactivated_at DESC;

-- Manually deactivate specific accounts if needed
UPDATE auth_schema.user_profiles
SET account_status = 'deactivated',
    deactivation_reason = 'Manual review: <reason>',
    deactivated_by = '<admin-user-id>'
WHERE id = '<user-id>';
```

## Rollback Procedure

### When to Rollback
- Migration validation fails
- Application errors after deployment
- Data inconsistencies detected

### Rollback Steps
```bash
# 1. Stop new service version
docker-compose stop identity-service

# 2. Run rollback script
psql -h <host> -U postgres -d postgres -f migrations/014_add_account_status_columns_rollback.sql

# 3. Verify rollback
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'auth_schema' 
  AND table_name = 'user_profiles'
  AND column_name IN ('account_status', 'deactivation_reason', 'deactivated_at', 'deactivated_by');
-- Expected: No rows (columns removed)

# 4. Redeploy old service version
git checkout <previous-commit>
npm run build
docker-compose up -d identity-service
```

## Data Mapping Reference

### Old Schema → New Schema
| Old Field | New Field | Mapping Rule |
|-----------|-----------|--------------|
| `is_active = true` | `account_status = 'active'` | Normal operation |
| `is_active = false` | `account_status = 'locked'` | Temporary lock (reversible) |
| N/A | `account_status = 'deactivated'` | Permanent deactivation (new) |
| N/A | `account_status = 'suspended'` | Admin review (new) |

### Account Status Transitions
```
active → locked (temporary lock)
active → deactivated (permanent, irreversible)
active → suspended (admin review)
locked → active (unlock)
suspended → active (admin approval)
deactivated → (no transitions allowed)
```

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: Migration is idempotent. Check if columns exist:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'auth_schema' AND table_name = 'user_profiles'
  AND column_name = 'account_status';
```

### Issue: Trigger not working
**Solution**: Verify trigger exists and recreate if needed:
```sql
DROP TRIGGER IF EXISTS trigger_compute_is_active ON auth_schema.user_profiles;
CREATE TRIGGER trigger_compute_is_active
  BEFORE INSERT OR UPDATE OF account_status
  ON auth_schema.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth_schema.compute_is_active();
```

### Issue: Data inconsistency (is_active not synced)
**Solution**: Manually sync:
```sql
UPDATE auth_schema.user_profiles
SET is_active = (account_status = 'active');
```

## Support
For issues or questions:
1. Check logs: `docker logs hospital-identity-service-v2`
2. Review migration script: `migrations/014_add_account_status_columns.sql`
3. Contact: Hospital Management Team
