# Integration Test Setup Guide

**Date**: 2025-01-06  
**Status**: ✅ **READY**  
**Version**: 2.0.0

---

## 📋 OVERVIEW

This guide explains how to setup and run integration tests for Identity Service. Integration tests require a real Supabase instance with test data.

---

## ✅ PREREQUISITES

### 1. Supabase Project

You need a Supabase project (can be the same as development or a separate test project).

**Get credentials from**: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

Required credentials:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_JWT_SECRET`

---

### 2. Database Schema

Ensure all required schemas and tables exist:

```sql
-- Check schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('auth_schema', 'public');

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'auth_schema';
```

**Required tables**:
- ✅ `auth_schema.user_profiles`
- ✅ `auth_schema.user_sessions`
- ✅ `auth_schema.login_attempts`
- ✅ `auth_schema.user_roles`
- ✅ `auth_schema.roles`
- ✅ `auth_schema.permissions`
- ✅ `auth_schema.role_permissions`

---

### 3. Database Functions

Ensure required functions exist:

```sql
-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'auth_schema'
  AND routine_name = 'auth_update_user_last_login';
```

**Required functions**:
- ✅ `auth_update_user_last_login(UUID)`

---

### 4. Database Views

Ensure required views exist:

```sql
-- Check views
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'auth_user_profiles_view';
```

**Required views**:
- ✅ `public.auth_user_profiles_view`

---

## 🔧 SETUP STEPS

### Step 1: Configure .env.test

File `.env.test` already exists with Supabase credentials:

```bash
# Supabase Configuration
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=d04ebad9-b117-4914-94ec-da610d3a79da

# Test User Credentials
TEST_USER_EMAIL=test.admin@hospital.com
TEST_USER_PASSWORD=TestAdmin123!
```

**Status**: ✅ Already configured

---

### Step 2: Run Migrations (If Not Done)

```bash
cd backend/services-v2/identity-service/migrations

# Run migrations in order
psql -h db.ciasxktujslgsdgylimv.supabase.co \
     -U postgres \
     -d postgres \
     -f 001_create_auth_update_last_login_function.sql

psql -h db.ciasxktujslgsdgylimv.supabase.co \
     -U postgres \
     -d postgres \
     -f 002_create_login_attempts_table.sql

psql -h db.ciasxktujslgsdgylimv.supabase.co \
     -U postgres \
     -d postgres \
     -f 003_create_auth_user_profiles_view.sql

psql -h db.ciasxktujslgsdgylimv.supabase.co \
     -U postgres \
     -d postgres \
     -f remove_user_profile_trigger.sql
```

**Alternative**: Run via Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/ciasxktujslgsdgylimv/sql
2. Copy content from each migration file
3. Execute in order

---

### Step 3: Create Test Users

```bash
cd backend/services-v2/identity-service

# Option 1: Use seed script (Recommended)
npm run seed:test-data

# Option 2: Use create-test-users script
npx ts-node scripts/create-test-users.ts
```

**Expected output**:
```
👤 Creating test users...
   ✅ Created test.admin@hospital.com (ID: xxx)
   ✅ Created test.doctor@hospital.com (ID: xxx)
   ✅ Created test.patient@hospital.com (ID: xxx)
```

---

### Step 4: Verify Test Users

```sql
-- Check test users exist
SELECT id, email, full_name, role_type, is_active, is_verified
FROM auth_schema.user_profiles
WHERE email IN (
  'test.admin@hospital.com',
  'test.doctor@hospital.com',
  'test.patient@hospital.com'
);
```

**Expected**: 3 rows returned

---

## 🧪 RUNNING INTEGRATION TESTS

### Run All Integration Tests

```bash
cd backend/services-v2/identity-service

# Run all integration tests
npm test -- tests/integration

# Run specific integration test file
npm test -- tests/integration/authentication.test.ts
```

---

### Run Specific Test Suites

```bash
# Authentication tests only
npm test -- tests/integration/authentication.test.ts

# RBAC tests only
npm test -- tests/integration/rbac.test.ts
```

---

### Run with Coverage

```bash
npm test -- --coverage tests/integration
```

---

## 📊 EXPECTED TEST RESULTS

### Successful Run

```
Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        8.5s
```

---

### Common Test Failures

#### 1. "should successfully sign in with valid credentials" - FAIL

**Cause**: Test user doesn't exist in database

**Solution**:
```bash
npm run seed:test-data
```

---

#### 2. "Network error" or "fetch failed"

**Cause**: Invalid Supabase URL or credentials

**Solution**:
1. Verify `.env.test` has correct credentials
2. Check Supabase project is active
3. Verify network connection

---

#### 3. "User not found" or "Invalid credentials"

**Cause**: Test user password doesn't match

**Solution**:
1. Check `.env.test` has correct passwords
2. Re-run seed script to reset passwords
3. Verify user exists in database

---

## 🔍 TROUBLESHOOTING

### Check Supabase Connection

```bash
cd backend/services-v2/identity-service

# Test connection
npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

supabase.from('user_profiles').select('count').then(console.log);
"
```

**Expected**: `{ data: { count: X }, error: null }`

---

### Check Test User Exists

```bash
npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

supabase
  .from('user_profiles')
  .select('*')
  .eq('email', 'test.admin@hospital.com')
  .then(console.log);
"
```

**Expected**: User data returned

---

### Clean Test Data

```bash
# Delete all test users
npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.test' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Delete test users
supabase
  .from('user_profiles')
  .delete()
  .like('email', 'test.%@hospital.com')
  .then(console.log);
"

# Re-create test users
npm run seed:test-data
```

---

## 📚 REFERENCES

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ciasxktujslgsdgylimv
- **Migrations**: `backend/services-v2/identity-service/migrations/`
- **Seed Scripts**: `backend/services-v2/identity-service/scripts/`
- **Test Setup**: `backend/services-v2/identity-service/tests/setup.ts`

---

## 🎉 NEXT STEPS

After successful integration test setup:

1. ✅ Run all tests: `npm test`
2. ✅ Verify coverage: `npm test -- --coverage`
3. ✅ Add new integration tests as needed
4. ✅ Update test data in seed scripts

---

**Author**: Hospital Management Team  
**Version**: 2.0.0  
**Status**: ✅ READY FOR USE

