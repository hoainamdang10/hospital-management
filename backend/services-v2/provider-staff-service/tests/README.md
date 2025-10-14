# Provider/Staff Service - Testing Guide

## Overview

Comprehensive testing suite for Provider/Staff Service following Clean Architecture and DDD principles.

---

## Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── helpers/                    # Test utilities
│   ├── testHelpers.ts         # Helper functions
│   └── mockFactories.ts       # Mock object factories
├── unit/                       # Unit tests
│   ├── infrastructure/
│   │   └── events/
│   │       ├── RabbitMQEventPublisher.test.ts
│   │       ├── RabbitMQStaffEventHandler.test.ts
│   │       └── IntegrationEvents.test.ts
│   ├── application/
│   │   └── use-cases/
│   └── domain/
└── integration/                # Integration tests
    ├── api/
    ├── events/
    └── database/
```

---

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

---

## Test Configuration

### Jest Configuration

**Unit Tests**: `jest.config.js`
- Coverage threshold: 80% global, 90% domain, 85% application
- Test timeout: 10 seconds
- Mocks cleared between tests

**Integration Tests**: `jest.integration.config.js`
- Coverage threshold: 70% global
- Test timeout: 30 seconds
- Detects open handles
- Force exit after completion

### Environment Variables

Test environment variables are loaded from `.env.test`:
- `NODE_ENV=test`
- `SUPABASE_URL` - Test Supabase instance
- `RABBITMQ_URL` - Test RabbitMQ instance
- `REDIS_URL` - Test Redis instance

---

## Test Utilities

### TestUtils

```typescript
import { TestUtils } from './setup';

// Generate test IDs
const staffId = TestUtils.generateRandomStaffId();
const userId = TestUtils.generateRandomUserId();
const email = TestUtils.generateRandomEmail();
const phone = TestUtils.generateRandomPhone();
const nationalId = TestUtils.generateRandomNationalId();
const licenseNumber = TestUtils.generateRandomLicenseNumber();

// Wait utilities
await TestUtils.sleep(1000);
await TestUtils.waitFor(() => condition, 5000);

// Format currency
const formatted = TestUtils.formatVNDAmount(500000);
```

### TestDataFactory

```typescript
import { TestDataFactory } from './setup';

// Create test data
const staffData = TestDataFactory.createValidStaffData();
const doctorData = TestDataFactory.createValidDoctorData();
const nurseData = TestDataFactory.createValidNurseData();
const technicianData = TestDataFactory.createValidTechnicianData();
const pharmacistData = TestDataFactory.createValidPharmacistData();

// Create work schedule
const schedule = TestDataFactory.createWorkScheduleData();

// Create credential
const credential = TestDataFactory.createCredentialData();
```

### Mock Factories

```typescript
import {
  createMockLogger,
  createMockStaffRepository,
  createMockEventPublisher,
  createMockEventHandler,
  createMockSupabaseClient,
  createMockStaff,
  createMockDomainEvent,
  createMockIntegrationEvent
} from './helpers/mockFactories';

// Create mocks
const logger = createMockLogger();
const repository = createMockStaffRepository();
const eventPublisher = createMockEventPublisher();
const staff = createMockStaff({ staffId: 'STF-001' });
```

### Test Helpers

```typescript
import {
  createTestStaffInDb,
  deleteTestStaffFromDb,
  getOrCreateTestUser,
  cleanupTestData,
  waitForEvent,
  verifyStaffExistsInDb,
  getStaffFromDb,
  updateStaffInDb,
  createTestCredentialInDb,
  MockRabbitMQEventPublisher
} from './helpers/testHelpers';

// Database operations
const staffId = await createTestStaffInDb(supabase, staffData);
await deleteTestStaffFromDb(supabase, staffId);

// User management
const { userId, token } = await getOrCreateTestUser(
  supabase,
  'test@hospital.vn',
  'password123'
);

// Cleanup
await cleanupTestData(supabase, {
  staffIds: ['STF-001', 'STF-002'],
  userIds: ['user-123']
});

// Event testing
const event = await waitForEvent(eventBus, 'StaffRegisteredEvent', 5000);

// Mock event publisher
const mockPublisher = new MockRabbitMQEventPublisher();
await mockPublisher.connect();
await mockPublisher.publish(event);
const publishedEvents = mockPublisher.getPublishedEvents();
```

---

## Writing Tests

### Unit Test Example

```typescript
import { RabbitMQEventPublisher } from '../../../src/infrastructure/events/RabbitMQEventPublisher';
import { createMockLogger } from '../../helpers/mockFactories';

describe('RabbitMQEventPublisher', () => {
  let eventPublisher: RabbitMQEventPublisher;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
    eventPublisher = new RabbitMQEventPublisher(config, options, mockLogger);
  });

  it('should publish event successfully', async () => {
    await eventPublisher.connect();
    await eventPublisher.publish(event);
    
    expect(mockChannel.publish).toHaveBeenCalled();
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import { createTestApp } from '../../helpers/appFactory';

describe('Staff API Integration', () => {
  let app: any;
  let cleanup: any;
  let token: string;

  beforeAll(async () => {
    const result = await createTestApp();
    app = result.app;
    cleanup = result.cleanup;
    
    const { token: authToken } = await getOrCreateTestUser(
      supabase,
      'admin@test.com',
      'password123'
    );
    token = authToken;
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should register new staff', async () => {
    const response = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${token}`)
      .send(staffData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

---

## Coverage Requirements

### Global Thresholds
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### Domain Layer
- Branches: 90%
- Functions: 90%
- Lines: 90%
- Statements: 90%

### Application Layer
- Branches: 85%
- Functions: 85%
- Lines: 85%
- Statements: 85%

---

## Test Categories

### Unit Tests

**Infrastructure Layer**:
- ✅ RabbitMQEventPublisher
- ✅ RabbitMQStaffEventHandler
- ✅ IntegrationEvents
- ⏳ SupabaseStaffRepository
- ⏳ WinstonLogger

**Application Layer**:
- ⏳ RegisterStaffUseCase
- ⏳ GetStaffProfileUseCase
- ⏳ UpdateStaffInfoUseCase
- ⏳ SearchStaffUseCase

**Domain Layer**:
- ⏳ Staff Entity
- ⏳ Value Objects
- ⏳ Domain Events

### Integration Tests

**API Tests**:
- ⏳ Staff Registration Flow
- ⏳ Staff Profile Retrieval
- ⏳ Staff Update Flow
- ⏳ Staff Search

**Event Publishing Tests**:
- ⏳ RabbitMQ Integration
- ⏳ Event Routing
- ⏳ Event Schema Validation

**Database Tests**:
- ⏳ Supabase Integration
- ⏳ Transaction Handling
- ⏳ Data Integrity

---

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/cleanup
- Clear mocks between tests

### 2. Descriptive Test Names
```typescript
it('should publish StaffRegistered event when staff is registered', async () => {
  // Test implementation
});
```

### 3. AAA Pattern
```typescript
it('should do something', async () => {
  // Arrange
  const input = createTestData();
  
  // Act
  const result = await useCase.execute(input);
  
  // Assert
  expect(result).toBeDefined();
});
```

### 4. Mock External Dependencies
- Mock Supabase client
- Mock RabbitMQ connection
- Mock Redis client
- Mock external APIs

### 5. Test Edge Cases
- Invalid input
- Missing required fields
- Duplicate data
- Concurrent operations
- Error scenarios

---

## Debugging Tests

### Run Single Test File
```bash
npm test -- RabbitMQEventPublisher.test.ts
```

### Run Single Test
```bash
npm test -- -t "should publish event successfully"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output
```bash
npm test -- --verbose
```

---

## CI/CD Integration

Tests are automatically run in CI/CD pipeline:

1. **Pre-commit**: Unit tests
2. **Pull Request**: All tests + coverage check
3. **Deployment**: Integration tests

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-10  
**Author**: Hospital Management Team

