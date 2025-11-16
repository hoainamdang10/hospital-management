# 🧪 API Gateway Testing Guide

> Comprehensive testing documentation for Week 1-3 fixes

---

## 📋 Table of Contents

1. [Test Overview](#test-overview)
2. [Running Tests](#running-tests)
3. [Test Coverage](#test-coverage)
4. [Unit Tests](#unit-tests)
5. [Integration Tests](#integration-tests)
6. [Manual Testing](#manual-testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Test Overview

### Test Structure

```
api-gateway/
├── src/
│   ├── domain/
│   │   └── errors/
│   │       └── ProxyError.test.ts
│   ├── infrastructure/
│   │   ├── resilience/
│   │   │   ├── CircuitBreaker.test.ts
│   │   │   └── RetryPolicy.test.ts
│   │   └── cache/
│   └── presentation/
│       └── middleware/
│           └── SizeLimitMiddleware.test.ts
├── tests/
│   ├── integration/
│   │   └── ServiceRegistry.integration.test.ts
│   └── setup.ts
└── shared/
    └── infrastructure/
        └── validation/
            └── CircuitBreakerConfigValidator.test.ts
```

### Test Categories

| Category | Files | Coverage Target |
|----------|-------|-----------------|
| **Unit Tests** | 5 files | >= 90% |
| **Integration Tests** | 1 file | >= 80% |
| **Total** | 6 files | >= 85% |

---

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit
```

### Week-Specific Tests

```bash
# Week 1: Timeout, JWT, Rate Limiting
npm run test:week1

# Week 2: Circuit Breaker, Error Handling
npm run test:week2

# Week 3: Validation, Size Limits
npm run test:week3

# All weeks with coverage
npm run test:all-weeks
```

### Using Test Scripts

**Linux/macOS**:
```bash
cd backend/services-v2
chmod +x scripts/run-week-tests.sh
./scripts/run-week-tests.sh
```

**Windows**:
```cmd
cd backend\services-v2
scripts\run-week-tests.bat
```

---

## 📊 Test Coverage

### Coverage Targets

```javascript
{
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### Viewing Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Open in browser
# Linux/macOS
open coverage/index.html

# Windows
start coverage/index.html
```

### Coverage by Component

| Component | Target | Current |
|-----------|--------|---------|
| Circuit Breaker Config Validator | 90% | ✅ |
| Size Limit Middleware | 85% | ✅ |
| Circuit Breaker | 90% | ✅ |
| Proxy Error | 85% | ✅ |
| Retry Policy | 90% | ✅ |
| Service Registry | 80% | ✅ |

---

## 🧪 Unit Tests

### 1. Circuit Breaker Config Validator

**File**: `shared/infrastructure/validation/CircuitBreakerConfigValidator.test.ts`

**Test Cases**:
- ✅ Validates correct configuration
- ✅ Rejects invalid failureThreshold
- ✅ Rejects invalid resetTimeout
- ✅ Rejects invalid monitoringPeriod
- ✅ Warns about suboptimal configs
- ✅ Sanitizes invalid values
- ✅ Returns recommended config

**Run**:
```bash
npm test -- CircuitBreakerConfigValidator.test.ts
```

### 2. Size Limit Middleware

**File**: `src/presentation/middleware/SizeLimitMiddleware.test.ts`

**Test Cases**:
- ✅ Allows requests within limit
- ✅ Rejects oversized requests
- ✅ Uses endpoint-specific limits
- ✅ Monitors response sizes
- ✅ Warns about large responses
- ✅ Formats bytes correctly

**Run**:
```bash
npm test -- SizeLimitMiddleware.test.ts
```

### 3. Circuit Breaker

**File**: `src/infrastructure/resilience/CircuitBreaker.test.ts`

**Test Cases**:
- ✅ Executes successfully when closed
- ✅ Opens after failure threshold
- ✅ Uses fallback when open
- ✅ Transitions to half-open
- ✅ Closes after successful calls
- ✅ Tracks metrics
- ✅ Limits calls in half-open state

**Run**:
```bash
npm test -- CircuitBreaker.test.ts
```

### 4. Proxy Error

**File**: `src/domain/errors/ProxyError.test.ts`

**Test Cases**:
- ✅ Classifies timeout errors
- ✅ Classifies connection errors
- ✅ Classifies circuit breaker errors
- ✅ Classifies network errors
- ✅ Provides user-friendly messages
- ✅ Serializes to JSON correctly

**Run**:
```bash
npm test -- ProxyError.test.ts
```

---

## 🔗 Integration Tests

### Service Registry Integration

**File**: `tests/integration/ServiceRegistry.integration.test.ts`

**Test Cases**:
- ✅ Registers route with validation
- ✅ Rejects invalid config
- ✅ Performs health check with retry
- ✅ Uses fallback when circuit open
- ✅ Returns circuit breaker stats

**Run**:
```bash
npm run test:integration
```

---

## 🧪 Manual Testing

### Test Circuit Breaker Validation

```bash
# Test invalid config (should fail)
export CIRCUIT_BREAKER_THRESHOLD=0
npm run dev

# Expected: Error "failureThreshold must be >= 1"

# Test valid config
export CIRCUIT_BREAKER_THRESHOLD=5
npm run dev

# Expected: Service starts successfully
```

### Test Size Limits

```bash
# Test default 1MB limit
curl -X POST http://localhost:3101/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "Content-Length: 2000000" \
  -d @large-payload.json

# Expected: 413 Payload Too Large

# Test file upload endpoint (50MB limit)
curl -X POST http://localhost:3101/api/v1/clinical/123/attachments \
  -F "file=@large-file-40mb.pdf"

# Expected: 200 OK
```

### Test Rate Limiting

```bash
# Test login rate limit (5 requests/15min)
for i in {1..6}; do
  curl -X POST http://localhost:3101/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done

# Expected: 6th request gets 429 Too Many Requests
```

### Test Health Check Retry

```bash
# Stop a service
docker stop hospital-patient-registry-service-v2

# Check logs for retry attempts
docker logs hospital-api-gateway-v2 | grep "Health check failed, retrying"

# Expected: 2 retry attempts before marking unhealthy

# Restart service
docker start hospital-patient-registry-service-v2
```

### Test Circuit Breaker Fallback

```bash
# Make successful request (caches response)
curl http://localhost:3101/api/v1/patients/123

# Stop service
docker stop hospital-patient-registry-service-v2

# Make 5 failed requests (opens circuit)
for i in {1..5}; do
  curl http://localhost:3101/api/v1/patients/123
done

# Make request with circuit open (uses fallback)
curl http://localhost:3101/api/v1/patients/123

# Expected: Cached response returned
```

---

## 🐛 Troubleshooting

### Tests Failing

**Issue**: Tests fail with module not found errors

**Solution**:
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Timeout errors in tests

**Solution**:
```bash
# Increase test timeout in jest.config.js
testTimeout: 30000  // 30 seconds
```

### Coverage Not Generated

**Issue**: Coverage report not created

**Solution**:
```bash
# Ensure coverage directory exists
mkdir -p coverage

# Run with explicit coverage reporters
npm test -- --coverage --coverageReporters=text --coverageReporters=html
```

### Integration Tests Failing

**Issue**: Integration tests fail with connection errors

**Solution**:
```bash
# Ensure test environment variables are set
export NODE_ENV=test
export SUPABASE_URL=https://test.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=test-key

# Run tests
npm run test:integration
```

---

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: API Gateway Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend/services-v2/api-gateway
          npm install
      
      - name: Run tests
        run: |
          cd backend/services-v2/api-gateway
          npm run test:all-weeks
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/services-v2/api-gateway/coverage/lcov.info
```

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Clean Architecture Testing](https://blog.cleancoder.com/uncle-bob/2017/10/03/TestContravariance.html)

---

**Last Updated**: 2025-01-07
**Version**: 2.0.0-alpha
**Maintained By**: Hospital Management System V2 Team

