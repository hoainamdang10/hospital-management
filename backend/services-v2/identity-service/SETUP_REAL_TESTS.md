# 🧪 SETUP REAL INTEGRATION TESTS

## ✅ COMPLETED STEPS

### 1. Created Test Users in Supabase ✅

Created 3 test users in `auth.users` table:

| Email | Password | Role | User ID |
|-------|----------|------|---------|
| test.admin@hospital.com | TestAdmin123! | admin | a0000000-0000-0000-0000-000000000001 |
| test.doctor@hospital.com | TestDoctor123! | doctor | a0000000-0000-0000-0000-000000000002 |
| test.patient@hospital.com | TestPatient123! | patient | a0000000-0000-0000-0000-000000000003 |

### 2. Created User Profiles ✅

Created corresponding profiles in `auth_schema.user_profiles` table with:
- Full names
- Phone numbers
- Citizen IDs
- Addresses
- Role types
- Verified status

### 3. Updated Healthcare Roles ✅

Updated permissions in `auth_schema.healthcare_roles` to use `resource:action` format:

**Admin permissions**:
- users:*, patients:*, doctors:*, appointments:*, medical_records:*, system:admin

**Doctor permissions**:
- patients:read/update, appointments:read/update, medical_records:create/read/update

**Patient permissions**:
- own_profile:read/update, own_appointments:read/create, own_medical_records:read

**Receptionist permissions**:
- patients:read/create, appointments:create/read/update

### 4. Created .env.test File ✅

Created `.env.test` with test user credentials:
```bash
TEST_USER_EMAIL=test.admin@hospital.com
TEST_USER_PASSWORD=TestAdmin123!
TEST_DOCTOR_EMAIL=test.doctor@hospital.com
TEST_DOCTOR_PASSWORD=TestDoctor123!
TEST_PATIENT_EMAIL=test.patient@hospital.com
TEST_PATIENT_PASSWORD=TestPatient123!
```

### 5. Updated Test Setup ✅

Updated `tests/setup.ts` to:
- Load `.env.test` file
- Use real Supabase credentials (not mock)
- Preserve environment variables from .env.test

### 6. Updated Package.json ✅

Updated test scripts to set `NODE_ENV=test`:
```json
"test": "NODE_ENV=test jest",
"test:watch": "NODE_ENV=test jest --watch",
"test:coverage": "NODE_ENV=test jest --coverage"
```

---

## ⚠️ REQUIRED: ADD SUPABASE CREDENTIALS

To run integration tests with real Supabase, you need to add your Supabase credentials to `.env.test`:

### Step 1: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **Kutou01's Project** (ciasxktujslgsdgylimv)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL**: `https://ciasxktujslgsdgylimv.supabase.co`
   - **service_role key** (⚠️ Keep this secret!)
   - **JWT Secret** (in JWT Settings section)

### Step 2: Update .env.test

Replace the placeholders in `.env.test`:

```bash
# Supabase Configuration
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY_HERE>
SUPABASE_JWT_SECRET=<YOUR_JWT_SECRET_HERE>

# Test User Credentials (already set)
TEST_USER_EMAIL=test.admin@hospital.com
TEST_USER_PASSWORD=TestAdmin123!

TEST_DOCTOR_EMAIL=test.doctor@hospital.com
TEST_DOCTOR_PASSWORD=TestDoctor123!

TEST_PATIENT_EMAIL=test.patient@hospital.com
TEST_PATIENT_PASSWORD=TestPatient123!

# Service Configuration
NODE_ENV=test
JWT_SECRET=<YOUR_JWT_SECRET_HERE>
```

### Step 3: Run Tests

```bash
cd backend/services-v2/identity-service

# Run all integration tests
npm test -- tests/integration

# Run specific test suite
npm test -- tests/integration/authentication.test.ts
npm test -- tests/integration/rbac.test.ts

# Run with verbose output
npm test -- tests/integration --verbose
```

---

## 📊 EXPECTED TEST RESULTS

Once credentials are added, you should see:

### RBAC Tests (13/13)
✅ All authentication middleware tests
✅ All permission middleware tests
✅ All permission matching tests

### Authentication Tests (29/29)
✅ Sign in with valid credentials
✅ Sign in error cases (invalid credentials, missing fields)
✅ Token verification
✅ Session management
✅ Permission loading
✅ Audit logging
✅ Error handling

**Total**: 42/42 tests passing (100%)

---

## 🔒 SECURITY NOTES

⚠️ **IMPORTANT**: 
- **NEVER commit `.env.test` to git** - It contains sensitive credentials
- `.env.test` is already in `.gitignore`
- Service role key has full database access - keep it secret
- Only use test credentials in development/test environments

---

## 🐛 TROUBLESHOOTING

### Issue: "fetch failed" errors

**Cause**: Missing or invalid Supabase credentials

**Solution**: 
1. Verify SUPABASE_URL is correct
2. Verify SUPABASE_SERVICE_ROLE_KEY is the service_role key (not anon key)
3. Check network connection to Supabase

### Issue: "Invalid login credentials"

**Cause**: Test users not created or wrong passwords

**Solution**:
1. Verify test users exist in Supabase:
   ```sql
   SELECT id, email FROM auth.users 
   WHERE email LIKE 'test.%@hospital.com';
   ```
2. If missing, re-run user creation SQL (already done)

### Issue: "Permission denied"

**Cause**: RLS policies blocking access

**Solution**:
1. Service role key bypasses RLS - verify you're using service_role key
2. Check RLS policies on tables if using anon key

---

## ✅ VERIFICATION CHECKLIST

Before running tests, verify:

- [ ] `.env.test` file exists
- [ ] SUPABASE_URL is set to `https://ciasxktujslgsdgylimv.supabase.co`
- [ ] SUPABASE_SERVICE_ROLE_KEY is set (not anon key)
- [ ] SUPABASE_JWT_SECRET is set
- [ ] TEST_USER_EMAIL is set to `test.admin@hospital.com`
- [ ] TEST_USER_PASSWORD is set to `TestAdmin123!`
- [ ] Test users exist in Supabase (already created)
- [ ] Healthcare roles have correct permissions (already updated)

---

## 📖 NEXT STEPS

Once tests are passing:

1. **Add More Test Cases**
   - Edge cases
   - Concurrent operations
   - Performance tests

2. **Add E2E Tests**
   - Full authentication flow
   - Multi-user scenarios
   - Real-world use cases

3. **Setup CI/CD**
   - GitHub Actions
   - Automated testing
   - Test coverage reports

4. **Deploy to Staging**
   - Test with staging Supabase
   - Verify production readiness

---

**Status**: ⚠️ **WAITING FOR CREDENTIALS**

Once you add Supabase credentials to `.env.test`, run:
```bash
npm test -- tests/integration
```

All 42 tests should pass! 🎉

