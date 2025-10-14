# Integration Tests - Identity Service

## 📋 Overview

Integration tests verify the complete flow from HTTP request → routes → use cases → repositories → database using **REAL** Supabase database.

**Key Differences from Unit Tests:**
- ✅ Real Supabase database connection
- ✅ Real HTTP requests via supertest
- ✅ Real use cases, repositories, services (NO MOCKS)
- ✅ Verify data in database
- ✅ Test RLS policies, constraints, transactions
- ⚠️ Slower than unit tests (~100-500ms per test)

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy .env.test.example to .env.test
cp .env.test.example .env.test

# Edit .env.test with your Supabase credentials
# Get credentials from: https://app.supabase.com/project/{your-project-id}/settings/api
```

### 2. Seed Test Users

```bash
# Create test users in database
npm run seed:test-data

# This creates:
# - test.admin@hospital.com (ADMIN)
# - test.doctor@hospital.com (DOCTOR)
# - test.nurse@hospital.com (NURSE)
# - test.receptionist@hospital.com (RECEPTIONIST)
# - test.patient@hospital.com (PATIENT)
```

### 3. Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- auth-routes.integration.test.ts

# Run with coverage
npm run test:integration -- --coverage

# Run in watch mode
npm run test:integration -- --watch
```

### 4. Cleanup (if needed)

```bash
# Cleanup test data
npm run test:cleanup
```

---

## 📁 Test Structure

```
tests/integration/
├── README.md                           # This file
├── setup.ts                            # Global setup/teardown
├── phase1-verification.test.ts         # ✅ Infrastructure verification
└── (More integration tests coming soon)

Note: Previously misplaced tests have been moved to tests/unit/
- auth-routes.test.ts → tests/unit/presentation/routes/
- authentication.test.ts → tests/unit/infrastructure/auth/
- rbac.test.ts → tests/unit/presentation/middleware/
```

---

## 🧪 Current Integration Tests

### 1. Phase 1 Verification (`phase1-verification.test.ts`) ✅

**Status:** Complete and working

Tests infrastructure and basic end-to-end flows:
- ✅ Database connection verification
- ✅ Required tables existence check
- ✅ Integration helper functions
- ✅ Express app creation
- ✅ End-to-end registration flow (API → Database)
- ✅ End-to-end login flow (API → Database → Session)
- ✅ Cleanup verification

**Key Features:**
- Uses REAL Supabase database
- No mocks for database operations
- Verifies data in database after each operation
- Proper cleanup after tests

---

## 📝 Planned Integration Tests (To Be Implemented)

The following integration tests are planned but not yet implemented:

### 2. Auth Routes Integration Tests (Planned)
- POST /auth/register with database verification
- POST /auth/login with session creation
- POST /auth/logout with session cleanup
- POST /auth/refresh with token validation
- Password reset flow end-to-end
- Email verification flow

### 3. User Management Integration Tests (Planned)
- User CRUD operations with database
- Permission checks with real RBAC
- RLS policies enforcement
- Audit logging verification

### 4. Admin Operations Integration Tests (Planned)
- Staff provisioning flow
- Role assignment with database
- Account locking/unlocking
- Admin-only access verification

### 5. Session Management Integration Tests (Planned)
- Session creation and retrieval
- Multi-device session handling
- Session termination
- Session cleanup

### 6. RBAC Integration Tests (Planned)
- Permission middleware with real database
- Role-based access control
- Resource ownership checks
- Permission inheritance

---

## 🔧 Test Helpers

### Integration Helpers (`tests/helpers/integrationHelpers.ts`)

```typescript
// Create test user in database
const user = await createTestUser(supabaseClient, email, password, role);

// Get or create test user
const user = await getOrCreateTestUser(supabaseClient, email, password, role);

// Verify user exists
const exists = await verifyUserExists(supabaseClient, userId);

// Get user from database
const user = await getUserFromDb(supabaseClient, userId);

// Cleanup test users
await cleanupTestUsers(supabaseClient, [email1, email2]);

// Verify session exists
const exists = await verifySessionExists(supabaseClient, userId);
```

### App Factory (`tests/helpers/appFactory.ts`)

```typescript
// Create Express app with real dependencies
const app = await createTestApp();

// Use with supertest
const response = await request(app)
  .post('/auth/login')
  .send({ email, password });
```

---

## 📊 Test Data Management

### Static Test Users (Seeded)

Created by `npm run seed:test-data`:
```
test.admin@hospital.com       (ADMIN)
test.doctor@hospital.com      (DOCTOR)
test.nurse@hospital.com       (NURSE)
test.receptionist@hospital.com (RECEPTIONIST)
test.patient@hospital.com     (PATIENT)
```

Password for all: `TestAdmin123!` (or as configured in .env.test)

### Dynamic Test Users (Auto-cleanup)

Created during tests with pattern: `test-{timestamp}@hospital.vn`

Example:
```typescript
const email = `test-${Date.now()}@hospital.vn`;
testEmails.push(email); // Track for cleanup

// ... test code ...

// Cleanup in afterAll
await cleanupTestUsers(supabaseClient, testEmails);
```

---

## ✅ Best Practices

### DO

1. **Use Real Database**
   ```typescript
   // ✅ GOOD
   const supabaseClient = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );
   ```

2. **Verify in Database**
   ```typescript
   // ✅ GOOD
   const response = await request(app).post('/auth/register').send(data);
   const user = await getUserFromDb(supabaseClient, response.body.userId);
   expect(user.email).toBe(data.email);
   ```

3. **Use Unique Test Data**
   ```typescript
   // ✅ GOOD
   const email = `test-${Date.now()}@hospital.vn`;
   ```

4. **Always Cleanup**
   ```typescript
   // ✅ GOOD
   afterAll(async () => {
     await cleanupTestUsers(supabaseClient, testEmails);
   });
   ```

5. **Test Database Constraints**
   ```typescript
   // ✅ GOOD - Test unique constraint
   await request(app).post('/auth/register').send({ email });
   const response = await request(app).post('/auth/register').send({ email });
   expect(response.status).toBe(400); // Duplicate email
   ```

### DON'T

1. **Don't Mock Supabase**
   ```typescript
   // ❌ BAD
   jest.mock('@supabase/supabase-js');
   ```

2. **Don't Mock Use Cases**
   ```typescript
   // ❌ BAD
   const mockUseCase = { execute: jest.fn() };
   ```

3. **Don't Hardcode Test Data**
   ```typescript
   // ❌ BAD
   const email = 'test@hospital.vn'; // Will conflict
   ```

4. **Don't Skip Cleanup**
   ```typescript
   // ❌ BAD - No cleanup
   it('test', async () => {
     await createTestUser(...);
     // Missing cleanup!
   });
   ```

---

## 🐛 Troubleshooting

### Tests Fail to Connect

**Error**: `Database connection failed`

**Solution**:
1. Verify SUPABASE_URL in .env.test
2. Verify SUPABASE_SERVICE_ROLE_KEY
3. Check network connection
4. Check Supabase project status

### Tests Are Slow

**Error**: Tests take > 30 seconds

**Solution**:
1. Increase TEST_TIMEOUT in .env.test
2. Check Supabase region (use closest)
3. Run with `--maxWorkers=1` for debugging
4. Check network latency

### Tests Fail to Cleanup

**Error**: Test users remain in database

**Solution**:
1. Run `npm run test:cleanup`
2. Check Supabase dashboard for test users
3. Manually delete from auth.users
4. Check cleanup logic in afterAll

### Auth Errors

**Error**: `Invalid JWT` or `Unauthorized`

**Solution**:
1. Verify SUPABASE_JWT_SECRET in .env.test
2. Check RLS policies allow service role
3. Verify test users exist (run seed script)
4. Check token expiration

### Duplicate Email Errors

**Error**: `Email already exists`

**Solution**:
1. Use unique emails with timestamp
2. Check cleanup ran successfully
3. Manually cleanup test users
4. Use `getOrCreateTestUser` instead of `createTestUser`

---

## 📈 Coverage Goals

| Category | Target | Current | Status |
|----------|--------|---------|--------|
| Infrastructure Verification | 90% | ✅ 100% | Complete |
| Auth Routes | 90% | ⏳ 0% | Planned |
| User Routes | 90% | ⏳ 0% | Planned |
| Admin Routes | 85% | ⏳ 0% | Planned |
| Session Routes | 85% | ⏳ 0% | Planned |
| RBAC | 85% | ⏳ 0% | Planned |

**Note:** Unit tests with mocks exist in `tests/unit/` directory and provide good coverage for individual components.

---

## 🔗 Related Documentation

- [Unit Tests](../unit/README.md)
- [Test Helpers](../helpers/TEST_OPTIMIZATION_GUIDE.md)
- [Seed Script](../../scripts/seed-test-data.ts)
- [API Documentation](../../openapi.yaml)

---

**Last Updated**: 2025-01-11
**Maintained By**: Hospital Management System V2 Team

