# Testing Quick Reference - Patient Registry Service

## 🚀 Quick Start

```bash
# Setup
cd backend/services-v2/patient-registry-service
cp .env.test.example .env.test
# Edit .env.test with your Supabase credentials

# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage
npm run test:integration:coverage
```

---

## 📁 Test Structure

```
tests/
├── helpers/                          # Test utilities
│   ├── appFactory.ts                # App initialization
│   ├── roleAssignment.ts            # Role management
│   └── testHelpers.ts               # Helper functions
├── integration/                      # Integration tests
│   ├── setup.ts                     # Global setup/teardown
│   ├── identity-service.integration.test.ts
│   ├── service-communication.integration.test.ts
│   └── e2e.integration.test.ts
└── unit/                            # Unit tests
    └── service.test.ts
```

---

## 🧪 Test Commands

### Unit Tests
```bash
npm test                    # Run all unit tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

### Integration Tests
```bash
npm run test:integration                  # All integration tests
npm run test:integration:watch           # Watch mode
npm run test:integration:coverage        # With coverage
npm run test:integration -- identity     # Specific suite
npm run test:integration -- e2e          # E2E tests only
```

### All Tests
```bash
npm run test:all           # Unit + Integration
```

---

## 🔧 Test Helpers

### App Factory
```typescript
import { createMinimalTestApp, createFullTestApp } from '../helpers/appFactory';

// Minimal app (no RabbitMQ)
const { app, cleanup } = await createMinimalTestApp();

// Full app (with RabbitMQ)
const { app, cleanup, eventPublisher } = await createFullTestApp();

// Always cleanup
afterAll(async () => {
  await cleanup();
});
```

### Test Users
```typescript
import { getOrCreateTestUser } from '../helpers/testHelpers';

const { userId, token } = await getOrCreateTestUser(
  supabaseClient,
  'admin@test.com',
  'test-password-123'
);
```

### Patient Data
```typescript
import { createValidPatientData } from '../helpers/testHelpers';

const patientData = createValidPatientData({
  userId: 'user-123',
  fullName: 'Custom Name',
  nationalId: 'CUSTOM123456789'
});
```

### Role Assignment
```typescript
import { setupTestUserRoles } from '../helpers/roleAssignment';

await setupTestUserRoles(supabaseClient, userId, 'admin@test.com');
```

---

## 👥 Test Users

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@test.com | test-password-123 | ADMIN | All permissions |
| receptionist@test.com | test-password-123 | RECEPTIONIST | patient:*, appointment:* |
| doctor@test.com | test-password-123 | DOCTOR | patient:read, medical-record:* |
| nurse@test.com | test-password-123 | NURSE | patient:read, vital-signs:* |
| patient@test.com | test-password-123 | PATIENT | patient:read:own |

---

## 🎯 Common Test Patterns

### HTTP Request Test
```typescript
import request from 'supertest';

const response = await request(app)
  .post('/api/v1/patients')
  .set('Authorization', `Bearer ${token}`)
  .send(patientData);

expect(response.status).toBe(201);
expect(response.body.success).toBe(true);
```

### Database Verification
```typescript
import { verifyPatientExists, getPatientFromDb } from '../helpers/testHelpers';

// Check existence
const exists = await verifyPatientExists(supabaseClient, patientId);
expect(exists).toBe(true);

// Get full data
const patient = await getPatientFromDb(supabaseClient, patientId);
expect(patient.full_name).toBe('Expected Name');
```

### Cleanup
```typescript
import { cleanupTestPatients, cleanupTestUsers } from '../helpers/testHelpers';

afterAll(async () => {
  await cleanupTestPatients(supabaseClient);
  await cleanupTestUsers(supabaseClient, ['admin@test.com']);
});
```

---

## 🐛 Debugging

### Enable Verbose Logging
```typescript
// In test file
process.env.LOG_LEVEL = 'debug';
```

### View Test Output
```bash
npm run test:integration -- --verbose
```

### Debug Single Test
```typescript
it.only('should test specific scenario', async () => {
  // Your test
});
```

### Check Database State
```typescript
const { data } = await supabaseClient
  .from('patient_profiles')
  .select('*')
  .eq('patient_id', patientId);

console.log('Database state:', data);
```

---

## ⚠️ Common Issues

### Issue: Tests timeout
**Solution:**
```javascript
// In jest.integration.config.js
testTimeout: 60000  // Increase to 60 seconds
```

### Issue: Database connection failed
**Solution:**
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
npm run test:connection
```

### Issue: Test users already exist
**Solution:**
Tests handle existing users automatically. To force cleanup:
```bash
# Delete from Supabase dashboard or:
npm run test:cleanup
```

### Issue: RabbitMQ not available
**Solution:**
Use minimal test app (RabbitMQ optional):
```typescript
const { app, cleanup } = await createMinimalTestApp();
```

---

## 📊 Coverage Reports

### Generate Coverage
```bash
npm run test:coverage
npm run test:integration:coverage
```

### View Coverage
```bash
# Open in browser
open coverage/lcov-report/index.html
```

### Coverage Thresholds
```javascript
// jest.integration.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

---

## 🔍 Test Scenarios

### Authentication Tests
- ✅ Valid token accepted
- ✅ Invalid token rejected
- ✅ Missing token rejected
- ✅ Expired token rejected

### Authorization Tests
- ✅ ADMIN can perform all actions
- ✅ RECEPTIONIST can create/read/update patients
- ✅ PATIENT can only read own data
- ✅ Unauthorized actions blocked

### CRUD Tests
- ✅ Create patient
- ✅ Read patient
- ✅ Update patient
- ✅ Search patients
- ✅ Deactivate patient

### Error Tests
- ✅ Invalid data rejected
- ✅ Duplicate patient detected
- ✅ Non-existent patient returns 404
- ✅ Validation errors handled

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Integration Tests README](./integration/README.md)
- [Complete Implementation Guide](./integration/INTEGRATION_TESTS_COMPLETE.md)

---

## ✅ Checklist Before Running Tests

- [ ] `.env.test` file created and configured
- [ ] Supabase credentials valid
- [ ] Database schemas exist (auth_schema, patient_schema)
- [ ] Dependencies installed (`npm install`)
- [ ] RabbitMQ running (optional, for full tests)

---

**Last Updated**: 2025-01-05  
**Version**: 2.0.0  
**Status**: ✅ Complete

