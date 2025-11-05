# Integration Tests - Patient Registry Service

## Overview

Integration tests verify the **REAL** communication flow between Patient Registry Service and external services:
- **Identity Service** - Authentication & Authorization (uses REAL HTTP calls, not mocks)
- **Downstream Services** - Event-driven communication (Clinical EMR, Scheduling, Billing)

## ⚠️ IMPORTANT: Prerequisites for Identity Service Tests

### Identity Service Must Be Running

Integration tests for Identity Service require the **REAL** Identity Service running on port **3021**.

**Option A: Start Identity Service Manually**

```bash
# Terminal 1: Start Identity Service
cd backend/services-v2/identity-service
PORT=3021 npm run dev
```

**Option B: Use Docker**

```bash
cd backend/services-v2
docker-compose -f docker-compose.v2.yml up identity-service
```

**Verify Identity Service is Running:**

```bash
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:3021/health

# macOS/Linux
curl http://localhost:3021/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "identity-service",
  "timestamp": "..."
}
```

## Test Suites

### 1. Identity Service Integration (`identity-service.integration.test.ts`)

**⚠️ Requires Identity Service running on port 3021**

Tests authentication and authorization flow using REAL HTTP calls:

**Authentication Flow Tests:**
- ✅ Reject requests without token
- ✅ Reject requests with invalid token
- ✅ Accept requests with valid token
- ✅ Load user context from Identity Service

**Role-Based Authorization (RBAC) Tests:**
- ✅ ADMIN can create patients
- ✅ RECEPTIONIST can create patients
- ✅ PATIENT cannot create patients
- ✅ ADMIN can deactivate patients
- ✅ RECEPTIONIST cannot deactivate patients

**Permission-Based Authorization (PBAC) Tests:**
- ✅ Users with `patient:create` permission can create
- ✅ Users with `patient:read` permission can read
- ✅ Users with `patient:update` permission can update
- ✅ Users without permission are denied

**Resource Ownership Tests:**
- ✅ Patient can access their own profile
- ✅ Patient cannot access other profiles
- ✅ ADMIN can access any profile

**User Context Loading Tests:**
- ✅ Load complete user context (roles, permissions, profile)
- ✅ Include user roles in context
- ✅ Include user permissions in context

**Error Handling Tests:**
- ✅ Handle Identity Service unavailability
- ✅ Handle expired tokens

### 2. Service Communication Integration (`service-communication.integration.test.ts`)

Tests event-driven communication with downstream services:

**PatientRegisteredEvent Tests:**
- ✅ Publish event when patient is registered
- ✅ Include all required patient data
- ✅ Received by Clinical EMR Service
- ✅ Received by Scheduling Service
- ✅ Received by Billing Service

**PatientUpdatedEvent Tests:**
- ✅ Publish event when patient is updated
- ✅ Include changed fields in event
- ✅ Notify downstream services

**PatientMergedEvent Tests:**
- ✅ Publish event when patients are merged
- ✅ Include source and target patient IDs
- ✅ Trigger data migration in downstream services

**Event Ordering Tests:**
- ✅ Maintain event order
- ✅ Handle concurrent events

**Event Retry Tests:**
- ✅ Retry failed event delivery
- ✅ Handle downstream service failures gracefully

**Event Schema Validation Tests:**
- ✅ Validate event structure
- ✅ Reject invalid events

## Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Install test dependencies
npm install --save-dev jest @types/jest supertest @types/supertest
```

### Environment Variables

Create `.env.test` file:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Test Configuration
NODE_ENV=test
TEST_TIMEOUT=30000

# RabbitMQ (for event tests)
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

### Database Setup

Run test database migrations:

```bash
# Create test schemas
npm run db:test:setup

# Run migrations
npm run db:test:migrate
```

## Running Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Specific Test Suite

```bash
# Identity Service tests only
npm run test:integration -- identity-service

# Service Communication tests only
npm run test:integration -- service-communication
```

### Run with Coverage

```bash
npm run test:integration:coverage
```

### Run in Watch Mode

```bash
npm run test:integration:watch
```

## Test Configuration

### Jest Configuration (`jest.integration.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### Setup File (`tests/integration/setup.ts`)

```typescript
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Initialize test database
  // Start test services (RabbitMQ, Redis)
});

afterAll(async () => {
  // Cleanup test database
  // Stop test services
});
```

## Test Data Management

### Test Users

Integration tests use predefined test users:

```typescript
// Admin user
email: admin@test.com
roles: [ADMIN]
permissions: [patient:*, user:*, system:*]

// Receptionist user
email: receptionist@test.com
roles: [RECEPTIONIST]
permissions: [patient:create, patient:read, patient:update]

// Patient user
email: patient@test.com
roles: [PATIENT]
permissions: [patient:read:own]
```

### Test Patients

```typescript
// Test patient data
{
  patientId: 'PAT-202501-001',
  userId: 'test-user-id',
  personalInfo: {
    fullName: 'Test Patient',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    nationalId: '001234567890'
  },
  contactInfo: {
    primaryPhone: '0912345678',
    address: {
      street: '123 Test St',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh'
    }
  }
}
```

## Mocking External Services

### Mock Identity Service

```typescript
// Mock JWT validation
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn((token) => {
        if (token === 'valid-token') {
          return { data: { user: mockUser }, error: null };
        }
        return { data: null, error: new Error('Invalid token') };
      })
    }
  }))
}));
```

### Mock Event Bus

```typescript
// Mock RabbitMQ
jest.mock('amqplib', () => ({
  connect: jest.fn(() => ({
    createChannel: jest.fn(() => ({
      assertExchange: jest.fn(),
      publish: jest.fn(),
      consume: jest.fn()
    }))
  }))
}));
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      rabbitmq:
        image: rabbitmq:3-management
        ports:
          - 5672:5672
          - 15672:15672
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Running Integration Tests

### Quick Start (Recommended)

**Windows PowerShell:**
```powershell
cd backend/services-v2/patient-registry-service
.\scripts\run-integration-tests.ps1
```

**macOS/Linux:**
```bash
cd backend/services-v2/patient-registry-service
chmod +x scripts/run-integration-tests.sh
./scripts/run-integration-tests.sh
```

These scripts will:
1. ✅ Check if Identity Service is running
2. ✅ Run integration tests
3. ✅ Report results

### Manual Run

```bash
cd backend/services-v2/patient-registry-service

# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- identity-service.integration.test.ts

# Run with coverage
npm run test:integration -- --coverage
```

## Troubleshooting

### Common Issues

**1. Error: "ECONNREFUSED" or "404 Not Found"**

**Problem:** Identity Service is not running

**Solution:**
```bash
# Start Identity Service
cd backend/services-v2/identity-service
PORT=3021 npm run dev
```

**2. Error: "Invalid JWT token"**

**Problem:** JWT_SECRET mismatch between services

**Solution:** Verify both services use the same `JWT_SECRET` in `.env.test`

**3. Error: "Rate limit exceeded"**

**Problem:** Too many login requests to Identity Service

**Solution:** Identity Service has rate limiting. Wait 1 minute or restart Identity Service

**4. Tests timeout**
```bash
# Increase timeout in jest.config.js
testTimeout: 60000
```

**5. Database connection errors**
```bash
# Check Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

**3. Event bus connection errors**
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Restart RabbitMQ
docker-compose restart rabbitmq
```

**4. Token validation errors**
```bash
# Verify JWT secret matches Supabase
echo $SUPABASE_JWT_SECRET
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always cleanup test data after tests
3. **Mocking**: Mock external services when appropriate
4. **Assertions**: Use specific assertions, not just `toBeTruthy()`
5. **Coverage**: Aim for >80% coverage on integration paths
6. **Performance**: Keep tests fast (<30s total)
7. **Documentation**: Document complex test scenarios

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Integration Testing Best Practices](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**Last Updated**: 2025-01-04  
**Maintained By**: Hospital Management Team

