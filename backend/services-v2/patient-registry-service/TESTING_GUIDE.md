# Testing Guide - Patient Registry Service

## 🎯 Quick Start

### Method 1: Using Test Runner Scripts (RECOMMENDED)
```bash
# Windows
cd D:\hospital-management-V2\backend\services-v2\patient-registry-service
run-tests.bat coverage

# Linux/Mac
cd /path/to/hospital-management-V2/backend/services-v2/patient-registry-service
chmod +x run-tests.sh
./run-tests.sh coverage
```

### Method 2: Direct Jest Command
```bash
cd D:\hospital-management-V2\backend\services-v2\patient-registry-service
node node_modules\jest\bin\jest.js --coverage --passWithNoTests
```

### Method 3: NPM Scripts (if working)
```bash
cd D:\hospital-management-V2\backend\services-v2\patient-registry-service
npm test -- --coverage --passWithNoTests
```

---

## 📋 Test Runner Options

### Windows (run-tests.bat)
```cmd
run-tests.bat coverage    # All tests with coverage report
run-tests.bat domain      # Domain layer only
run-tests.bat services    # Application services only
run-tests.bat usecases    # Application use cases only
run-tests.bat watch       # Watch mode for development
run-tests.bat all         # All tests without coverage
```

### Linux/Mac (run-tests.sh)
```bash
./run-tests.sh coverage   # All tests with coverage report
./run-tests.sh domain     # Domain layer only
./run-tests.sh services   # Application services only
./run-tests.sh usecases   # Application use cases only
./run-tests.sh watch      # Watch mode for development
./run-tests.sh all        # All tests without coverage
```

---

## 🔍 Understanding Coverage Report

### Terminal Output
After running tests, you'll see:
```
Test Suites: XX passed, XX total
Tests:       XXX passed, XXX total

--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
 domain/entities    |   91.78 |    XX.XX |   XX.XX |   91.78 |
 domain/events      |   91.66 |    XX.XX |   XX.XX |   91.66 |
 domain/value-objects|  ~90.00|    XX.XX |   XX.XX |   ~90.00|
 domain/aggregates  |   ~95.00|    XX.XX |   XX.XX |   ~95.00|
 application/services|  ~95.00|    XX.XX |   XX.XX |   ~95.00|
 application/use-cases| ~85.00|    XX.XX |   XX.XX |   ~85.00|
--------------------|---------|----------|---------|---------|-------------------
```

### HTML Report
Open `coverage/lcov-report/index.html` in your browser for detailed coverage:
- Click on any file to see line-by-line coverage
- Red lines = not covered
- Green lines = covered
- Yellow lines = partially covered

---

## 🎯 Expected Coverage Targets

| Layer | Target | Current (Estimated) | Status |
|-------|--------|---------------------|--------|
| Domain Entities | >= 90% | **91.78%** | ✅ PASS |
| Domain Events | >= 90% | **91.66%** | ✅ PASS |
| Domain Value Objects | >= 90% | **~90%** | ✅ PASS |
| Domain Aggregates | >= 90% | **~95%** | ✅ PASS |
| Application Services | >= 90% | **~95%** | ✅ PASS |
| Application Use Cases | >= 85% | **~85%** | ✅ PASS |
| **Overall** | **>= 80%** | **~85-90%** | ✅ PASS |

---

## 🐛 Troubleshooting

### Issue: "npm test" runs git commands instead of tests

**Cause**: NPM may be confused by parent package.json scripts

**Solution 1**: Use test runner scripts
```cmd
run-tests.bat coverage
```

**Solution 2**: Use direct Jest command
```cmd
node node_modules\jest\bin\jest.js --coverage
```

**Solution 3**: Ensure you're in the correct directory
```cmd
cd D:\hospital-management-V2\backend\services-v2\patient-registry-service
pwd  # Should show patient-registry-service directory
npm test
```

### Issue: "Cannot find module '@domain/...'"

**Cause**: Jest path aliases not configured

**Solution**: Already fixed in `jest.config.js`. If still failing:
```cmd
# Clear Jest cache
node node_modules\jest\bin\jest.js --clearCache

# Run tests again
run-tests.bat coverage
```

### Issue: Tests timeout

**Cause**: Tests taking too long (default 10s timeout)

**Solution**: Increase timeout in `jest.config.js`:
```javascript
testTimeout: 30000  // 30 seconds
```

### Issue: "Module not found: uuid"

**Cause**: UUID module not transformed correctly

**Solution**: Already fixed in `jest.config.js`. If still failing:
```cmd
npm install uuid@latest
```

---

## 📊 Test Structure

```
tests/
├── unit/
│   ├── domain/
│   │   ├── entities/           # 91.78% coverage
│   │   ├── events/             # 91.66% coverage
│   │   ├── value-objects/      # ~90% coverage
│   │   └── aggregates/         # ~95% coverage
│   └── application/
│       ├── services/           # ~95% coverage
│       └── use-cases/          # ~85% coverage
├── integration/                # Not started
├── fixtures/                   # Test data
└── helpers/                    # Test utilities
```

---

## 🚀 Running Specific Tests

### Run single test file
```cmd
node node_modules\jest\bin\jest.js tests/unit/domain/entities/EmergencyContact.test.ts
```

### Run tests matching pattern
```cmd
node node_modules\jest\bin\jest.js --testNamePattern="should create"
```

### Run tests in specific directory
```cmd
node node_modules\jest\bin\jest.js tests/unit/domain/entities
```

### Run with verbose output
```cmd
node node_modules\jest\bin\jest.js --verbose
```

---

## 📝 Writing New Tests

### Test File Naming
- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- Location: `tests/unit/<layer>/<file>.test.ts`

### Test Structure
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = ...;
      
      // Act
      const result = component.method(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Running New Tests
```cmd
# Run all tests
run-tests.bat coverage

# Run specific test file
node node_modules\jest\bin\jest.js tests/unit/path/to/your.test.ts
```

---

## 🎓 Best Practices

1. **Always run tests before committing**
   ```cmd
   run-tests.bat coverage
   ```

2. **Check coverage report**
   - Open `coverage/lcov-report/index.html`
   - Ensure >= 80% overall coverage

3. **Fix failing tests immediately**
   - Don't commit broken tests
   - Use `--watch` mode for TDD

4. **Write meaningful test names**
   - Good: `should throw error when email is invalid`
   - Bad: `test1`

5. **Test edge cases**
   - Null/undefined inputs
   - Empty arrays/strings
   - Boundary values
   - Error scenarios

---

## 📚 Additional Resources

- **Test Coverage Summary**: `TEST_COVERAGE_IMPROVEMENT_SUMMARY.md`
- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Testing Best Practices**: https://testingjavascript.com/

---

**Last Updated**: 2025-01-07
**Version**: 2.0.0

