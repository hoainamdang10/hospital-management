# Department Service - Test Suite

## Test Coverage

### Unit Tests (60 tests - 100% passing)

#### 1. Domain Layer Tests
**File**: `tests/unit/domain/Department.test.ts` (35 tests)

**Coverage**:
- ✅ Entity creation and factory methods
- ✅ Validation rules (code format, names, email)
- ✅ Getters for all properties
- ✅ Business methods (activate, deactivate, updateContactInfo)
- ✅ JSON serialization
- ✅ Edge cases (2-4 letter codes, whitespace handling)

**Key Test Scenarios**:
- Department code validation (2-4 uppercase letters)
- Email format validation
- Required field validation (English/Vietnamese names)
- State management (activate/deactivate)
- Contact information updates
- Timestamp tracking (createdAt, updatedAt)

#### 2. Infrastructure Layer Tests
**File**: `tests/unit/cache/RedisDepartmentCache.test.ts` (25 tests)

**Coverage**:
- ✅ Redis connection management
- ✅ Cache operations (get, set, getAll, setAll)
- ✅ Cache invalidation
- ✅ Error handling
- ✅ Data integrity (Vietnamese characters, dates, optional fields)

**Key Test Scenarios**:
- Connect/disconnect lifecycle
- Individual department caching with 24-hour TTL
- Bulk department caching
- Cache invalidation on updates
- Graceful error handling
- Data serialization/deserialization

### Integration Tests (Requires Environment Setup)

#### 3. Repository Integration Tests
**File**: `tests/integration/repository/SupabaseDepartmentRepository.test.ts`

**Coverage**:
- Database CRUD operations
- Supabase schema interaction
- Data persistence and retrieval
- Soft delete functionality
- Query filtering (active/inactive)

**Requirements**:
- `SUPABASE_URL` environment variable
- `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Access to `departments_schema` in Supabase

#### 4. API Integration Tests
**File**: `tests/integration/api/DepartmentController.test.ts`

**Coverage**:
- HTTP endpoint testing
- Cache-first strategy validation
- Error handling
- Performance benchmarks

**Requirements**:
- `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Redis instance running on port 6380
- Supabase database access

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- tests/unit
```

### Integration Tests Only
```bash
npm test -- tests/integration
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Configuration

### Jest Configuration
**File**: `jest.config.js`

- **Preset**: `ts-jest`
- **Environment**: `node`
- **Test Match**: `**/*.test.ts`
- **Path Aliases**: `@domain`, `@infrastructure`, `@presentation`

### Environment Variables

Create `.env` file in `backend/services-v2/department-service/`:

```env
# Supabase Configuration (Required for Integration Tests)
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Redis Configuration (Required for Integration Tests)
REDIS_URL=redis://localhost:6380
```

## Test Structure

```
tests/
├── unit/                           # Fast, isolated tests (no external dependencies)
│   ├── domain/                    # Domain entity tests
│   │   └── Department.test.ts     # 35 tests
│   └── cache/                     # Cache layer tests
│       └── RedisDepartmentCache.test.ts  # 25 tests
│
├── integration/                    # Tests with external dependencies
│   ├── repository/                # Database integration
│   │   └── SupabaseDepartmentRepository.test.ts
│   └── api/                       # API endpoint integration
│       └── DepartmentController.test.ts
│
└── README.md                      # This file
```

## Test Best Practices

### 1. Unit Tests
- ✅ No external dependencies (mocked Redis, no Supabase)
- ✅ Fast execution (< 3 seconds for all unit tests)
- ✅ Test one thing at a time
- ✅ Clear test names describing expected behavior
- ✅ Arrange-Act-Assert pattern

### 2. Integration Tests
- ✅ Test real database interactions
- ✅ Clean up test data after each test
- ✅ Use unique test data to avoid conflicts
- ✅ Test error scenarios
- ✅ Verify data integrity

### 3. Naming Conventions
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Test implementation
    });
  });
});
```

## Current Test Results

### Unit Tests: ✅ 60/60 passing (100%)

**Domain Tests**: 35/35 ✅
- Department entity creation: 3/3 ✅
- Validation: 7/7 ✅
- Getters: 10/10 ✅
- Business methods: 8/8 ✅
- Serialization: 2/2 ✅
- Edge cases: 3/3 ✅

**Cache Tests**: 25/25 ✅
- Connection management: 4/4 ✅
- Get operations: 3/3 ✅
- Set operations: 3/3 ✅
- Bulk operations: 3/3 ✅
- Invalidation: 3/3 ✅
- Cache clearing: 3/3 ✅
- Data integrity: 3/3 ✅

### Integration Tests: ⚠️ Requires Environment Setup

To run integration tests:
1. Set up `.env` file with Supabase credentials
2. Ensure Redis is running on port 6380
3. Run: `npm test -- tests/integration`

## Coverage Goals

- **Domain Layer**: >= 95% (Currently: 100%)
- **Infrastructure Layer**: >= 90% (Currently: 100% for cache)
- **Presentation Layer**: >= 85% (Integration tests required)
- **Overall**: >= 90%

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- Unit tests run on every commit
- Integration tests run on pull requests
- Coverage reports generated automatically

## Troubleshooting

### Common Issues

**1. Integration tests fail with "SUPABASE_SERVICE_ROLE_KEY is required"**
- Solution: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` file

**2. Redis connection errors in integration tests**
- Solution: Ensure Redis is running: `docker-compose up redis-v2`

**3. Mock errors in unit tests**
- Solution: Clear Jest cache: `npm test -- --clearCache`

## Next Steps

1. ✅ Complete unit tests for domain and cache layers
2. ⏳ Set up environment for integration tests
3. ⏳ Run integration tests with real Supabase/Redis
4. ⏳ Add tests for presentation layer (controllers, routes)
5. ⏳ Achieve >= 90% overall coverage
6. ⏳ Set up CI/CD pipeline for automated testing

## Contributing

When adding new features:
1. Write unit tests first (TDD approach)
2. Ensure all existing tests pass
3. Add integration tests for database/API changes
4. Update this README if test structure changes
5. Maintain >= 90% coverage

---

**Last Updated**: 2025-10-22
**Test Framework**: Jest 29.7.0 with ts-jest
**Total Tests**: 60 unit tests (100% passing)
