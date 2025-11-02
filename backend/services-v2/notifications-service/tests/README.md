# Notifications Service - Test Suite

## 📋 Test Structure

```
tests/
├── unit/                           # Unit tests (fast, isolated)
│   ├── application/
│   │   └── use-cases/             # Use case tests
│   ├── domain/
│   │   ├── aggregates/            # Aggregate tests
│   │   └── value-objects/         # Value object tests
│   └── infrastructure/
│       ├── delivery/              # Delivery provider tests
│       └── templates/             # Template service tests
│
├── integration/                    # Integration tests (with mocks)
│   ├── repositories/              # Repository integration tests
│   └── api/                       # API integration tests
│
├── e2e/                           # End-to-end tests (full stack)
│   ├── api/                       # API E2E tests
│   └── workflows/                 # Healthcare workflow tests
│
└── helpers/                       # Test utilities
    ├── test-mocks.ts              # Mock factories
    └── test-fixtures.ts           # Vietnamese test data
```

## 🧪 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests only
npm test -- --testPathPattern=integration

# E2E tests only
npm test -- --testPathPattern=e2e

# Specific test file
npm test -- GetNotificationUseCase.test.ts
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm run test:coverage
```

## 📊 Coverage Targets

| Layer | Branches | Functions | Lines | Statements |
|-------|----------|-----------|-------|------------|
| **Domain** | 90% | 95% | 95% | 95% |
| **Application** | 85% | 90% | 90% | 90% |
| **Infrastructure** | 80% | 85% | 85% | 85% |
| **Overall** | 80% | 85% | 85% | 85% |

## ✅ Test Coverage

### Unit Tests (15 files)
- ✅ GetNotificationUseCase
- ✅ CancelNotificationUseCase
- ✅ SearchNotificationsUseCase
- ✅ SendBulkNotificationsUseCase
- ✅ RecipientInfo (Vietnamese names)
- ✅ NotificationId
- ✅ Notification Aggregate
- ✅ EmailProvider
- ✅ SMSProvider (Vietnamese phone)
- ✅ VietnameseTemplateService

### Integration Tests (2 files)
- ✅ NotificationRepository (Supabase)
- ✅ Notification API endpoints

### E2E Tests (2 files)
- ✅ Full API workflow
- ✅ Vietnamese healthcare workflows

## 🇻🇳 Vietnamese Healthcare Test Cases

### Phone Number Validation
```typescript
✅ +84912345678 (international)
✅ 0912345678 (local)
✅ 84912345678 (no +)
❌ Invalid formats rejected
```

### Vietnamese Names
```typescript
✅ Nguyễn Văn Anh
✅ Trần Thị Bình
✅ Lê Hoàng Cường
✅ Names with diacritics
```

### Templates
```typescript
✅ Appointment confirmation (Vietnamese)
✅ Appointment reminder (Vietnamese)
✅ Test results notification
✅ Payment reminder
```

## 🚀 CI/CD Integration

Tests run automatically on:
- ✅ Pull requests
- ✅ Pre-commit hooks
- ✅ CI/CD pipeline

## 📝 Test Data

All test data uses Vietnamese healthcare context:
- Patient names with Vietnamese diacritics
- Vietnamese phone numbers (+84...)
- Vietnamese templates
- BHYT/BHTN insurance context
- Vietnamese datetime formats

## 🔧 Mock Services

Available mocks in `helpers/test-mocks.ts`:
- ✅ MockNotificationRepository
- ✅ MockDeliveryService
- ✅ MockTemplateService
- ✅ MockSupabaseClient
- ✅ MockRecipient (Vietnamese)
- ✅ MockNotification
- ✅ MockContent

## 📚 Test Fixtures

Vietnamese healthcare data in `helpers/test-fixtures.ts`:
- ✅ Sample patients (Vietnamese names)
- ✅ Sample doctors (Vietnamese doctors)
- ✅ Sample appointments
- ✅ Template placeholder data
- ✅ Healthcare metadata

---

**Total Tests: 17+ test files**
**Coverage: Targeting >=85%**
**Vietnamese Focus: All tests use Vietnamese healthcare data**


