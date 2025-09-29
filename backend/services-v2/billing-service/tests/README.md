# Billing Service Testing Guide

Comprehensive testing suite for the Hospital Management System Billing Service.

## Overview

This testing suite provides comprehensive coverage for the billing service including:

- **Unit Tests**: Domain logic, use cases, and individual components
- **Integration Tests**: External service integrations (PayOS, BHYT, BHTN)
- **End-to-End Tests**: Complete workflow testing
- **Vietnamese Healthcare Compliance**: HIPAA, BHYT/BHTN standards

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── domain/             # Domain layer tests
│   ├── application/        # Application layer tests
│   ├── infrastructure/     # Infrastructure layer tests
│   └── presentation/       # Presentation layer tests
├── integration/            # Integration tests
│   ├── PayOSIntegration.test.ts
│   ├── VietnameseInsurance.test.ts
│   └── DatabaseIntegration.test.ts
├── e2e/                    # End-to-end tests
├── setup/                  # Test configuration
│   ├── jest.setup.ts
│   ├── custom-matchers.ts
│   ├── global.setup.ts
│   └── global.teardown.ts
├── fixtures/               # Test data
├── mocks/                  # Mock implementations
└── README.md              # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e

# Run specific test files
npm run test:billing        # BillingAggregate tests
npm run test:payos          # PayOS integration tests
npm run test:insurance      # Vietnamese insurance tests

# Debug tests
npm run test:debug

# Clear Jest cache
npm run test:clear

# CI/CD testing
npm run test:ci
```

### Test Categories

#### Unit Tests
```bash
# Domain layer tests
npm run test:unit -- --testPathPattern=domain

# Application layer tests
npm run test:unit -- --testPathPattern=application

# Infrastructure layer tests
npm run test:unit -- --testPathPattern=infrastructure
```

#### Integration Tests
```bash
# PayOS payment gateway
npm run test:integration -- --testPathPattern=PayOS

# Vietnamese insurance systems
npm run test:integration -- --testPathPattern=Insurance

# Database integration
npm run test:integration -- --testPathPattern=Database
```

## Test Configuration

### Environment Setup

Tests use `.env.test` for configuration:

```bash
# Copy example environment
cp .env.test.example .env.test

# Edit test configuration
nano .env.test
```

### Required Test Services

For integration tests, ensure these services are running:

```bash
# Start test database (Supabase local)
supabase start

# Start Redis (for caching tests)
redis-server --port 6379

# Start RabbitMQ (for event tests)
rabbitmq-server
```

### Mock Services

Unit tests use mocked external services:
- PayOS Gateway Service
- BHYT API Service  
- BHTN API Service
- Supabase Client

## Custom Matchers

Vietnamese healthcare-specific Jest matchers:

```typescript
// Vietnamese phone number validation
expect('0901234567').toBeValidVietnamesePhoneNumber();

// Insurance number validation
expect('HS1234567890123').toBeValidBHYTNumber();
expect('TN1234567890123').toBeValidBHTNNumber();

// Hospital ID validation
expect('INV-202412-000001').toBeValidInvoiceId();
expect('PAT-202412-001').toBeValidPatientId();
expect('CARD-DOC-202412-001').toBeValidDoctorId();

// Vietnamese currency validation
expect(500000).toBeValidVNDAmount();

// Vietnamese text validation
expect('Nguyễn Văn A').toContainVietnameseText();

// Object structure validation
expect(billingObject).toHaveRequiredBillingFields();
expect(insuranceObject).toHaveValidInsuranceStructure();
expect(paymentObject).toHaveValidPaymentStructure();

// Vietnamese error messages
expect(errorResponse).toHaveVietnameseErrorMessage();
```

## Test Data

### Test Factories

Use `TestDataFactory` for consistent test data:

```typescript
import { TestDataFactory } from '../setup/jest.setup';

// Create test billing aggregate
const billing = TestDataFactory.createValidBillingAggregate();

// Create test billing item
const item = TestDataFactory.createValidBillingItem();

// Create test insurance
const bhytInsurance = TestDataFactory.createValidBHYTInsurance();
const bhtnInsurance = TestDataFactory.createValidBHTNInsurance();

// Create test payment
const payment = TestDataFactory.createValidPayment();
```

### Test Utilities

```typescript
import { TestUtils } from '../setup/jest.setup';

// Generate random IDs
const invoiceId = TestUtils.generateRandomInvoiceId();
const patientId = TestUtils.generateRandomPatientId();

// Format Vietnamese currency
const formatted = TestUtils.formatVNDAmount(500000);

// Sleep utility for async tests
await TestUtils.sleep(1000);
```

## Coverage Requirements

### Coverage Thresholds

- **Global**: 80% (branches, functions, lines, statements)
- **Domain Layer**: 90% (critical business logic)
- **Application Layer**: 85% (use cases and commands)

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html

# Generate CI-friendly reports
npm run test:ci
```

## Vietnamese Healthcare Testing

### BHYT (Social Health Insurance) Testing

```typescript
describe('BHYT Integration', () => {
  it('should validate BHYT card format', async () => {
    const cardNumber = 'HS1234567890123';
    expect(cardNumber).toBeValidBHYTNumber();
    
    const result = await bhytService.validateCard({
      policyNumber: cardNumber,
      beneficiaryName: 'NGUYEN VAN A',
      region: '01'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.coverageLevel).toBe(0.8);
  });
});
```

### BHTN (Work Accident Insurance) Testing

```typescript
describe('BHTN Integration', () => {
  it('should process work accident claim', async () => {
    const claimData = {
      policyNumber: 'TN1234567890123',
      accidentInfo: {
        accidentDate: new Date(),
        description: 'Tai nạn lao động'
      },
      medicalInfo: {
        totalAmount: 18500000,
        claimAmount: 18500000 // 100% coverage
      }
    };
    
    const result = await bhtnService.submitAccidentClaim(claimData);
    expect(result.success).toBe(true);
    expect(result.data.priority).toBe('HIGH');
  });
});
```

### PayOS Payment Testing

```typescript
describe('PayOS Integration', () => {
  it('should create Vietnamese payment link', async () => {
    const paymentData = {
      orderCode: 'INV-202412-000001',
      amount: 500000,
      description: 'Thanh toán hóa đơn khám bệnh',
      buyerName: 'Nguyễn Văn A'
    };
    
    const result = await payosGateway.createPaymentLink(paymentData);
    expect(result.success).toBe(true);
    expect(result.data.checkoutUrl).toContain('https://');
  });
});
```

## Performance Testing

### Response Time Testing

```typescript
it('should respond within 200ms', async () => {
  const startTime = Date.now();
  
  const result = await billingService.generateInvoice(command);
  
  const responseTime = Date.now() - startTime;
  expect(responseTime).toBeLessThan(200);
});
```

### Load Testing

```typescript
it('should handle concurrent requests', async () => {
  const promises = Array.from({ length: 10 }, () => 
    billingService.generateInvoice(command)
  );
  
  const results = await Promise.allSettled(promises);
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  
  expect(successCount).toBeGreaterThanOrEqual(8); // 80% success rate
});
```

## Debugging Tests

### Debug Configuration

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="should generate invoice"

# Debug with breakpoints
node --inspect-brk node_modules/.bin/jest --runInBand --testNamePattern="PayOS"
```

### Logging in Tests

```typescript
// Enable test logging
console.log('Test Log: This will be shown');
console.error('Test Error: This will be shown');
console.warn('Test Warning: This will be shown');
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Tests
  run: npm run test:ci
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Test Reports

- **HTML Report**: `coverage/html-report/report.html`
- **JUnit Report**: `coverage/junit.xml`
- **LCOV Report**: `coverage/lcov.info`

## Best Practices

### Test Organization

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use Vietnamese context in test names
3. **Single Responsibility**: One assertion per test when possible
4. **Test Data**: Use factories for consistent test data

### Vietnamese Healthcare Context

1. **Currency**: Always test with VND amounts
2. **Insurance**: Test BHYT/BHTN specific scenarios
3. **Language**: Include Vietnamese text validation
4. **Compliance**: Test HIPAA and Vietnamese healthcare standards

### Performance

1. **Parallel Execution**: Tests run in parallel by default
2. **Mocking**: Mock external services for unit tests
3. **Cleanup**: Clean up test data after each test
4. **Timeouts**: Set appropriate timeouts for different test types

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout for integration tests
2. **Mock Issues**: Ensure mocks are properly reset between tests
3. **Database Issues**: Check Supabase connection and schema
4. **Coverage Issues**: Ensure all code paths are tested

### Getting Help

1. Check test logs: `npm run test -- --verbose`
2. Run single test: `npm run test -- --testNamePattern="specific test"`
3. Clear cache: `npm run test:clear`
4. Check environment: Verify `.env.test` configuration
