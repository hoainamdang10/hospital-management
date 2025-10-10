# 📝 KẾ HOẠCH CẢI THIỆN TEST CASES

## 🎯 MỤC TIÊU
- **Hiện tại**: 65% coverage
- **Mục tiêu**: 85%+ coverage
- **Deadline**: 2 tuần

## 🔴 PRIORITY 1 - CRITICAL MISSING TESTS (Làm ngay)

### 1. Recovery System Tests (0% coverage hiện tại)
```typescript
// tests/unit/domain/value-objects/RecoveryMethod.test.ts
describe('RecoveryMethod Value Object', () => {
  it('should create valid email recovery method')
  it('should create valid SMS recovery method')
  it('should validate phone number format')
  it('should not allow invalid recovery type')
  it('should handle recovery method updates')
})

// tests/unit/domain/value-objects/RecoveryAttempt.test.ts
describe('RecoveryAttempt Value Object', () => {
  it('should track recovery attempts')
  it('should identify suspicious patterns')
  it('should enforce rate limiting')
  it('should expire old attempts')
})

// tests/unit/infrastructure/repositories/SupabaseRecoveryHistoryRepository.test.ts
describe('SupabaseRecoveryHistoryRepository', () => {
  it('should log recovery attempt')
  it('should get recovery history by user')
  it('should detect brute force attempts')
  it('should cleanup old history')
})
```

### 2. Event System Tests (7% coverage)
```typescript
// tests/unit/infrastructure/events/RabbitMQEventPublisher.test.ts
describe('RabbitMQEventPublisher', () => {
  it('should connect to RabbitMQ')
  it('should publish UserCreatedEvent')
  it('should handle connection failures')
  it('should implement retry logic')
  it('should batch events for performance')
})

// tests/unit/infrastructure/events/DomainEventMapper.test.ts
describe('DomainEventMapper', () => {
  it('should map UserCreatedEvent to message')
  it('should map UserAuthenticatedEvent')
  it('should handle unknown event types')
  it('should preserve event metadata')
})
```

### 3. Permission Cache Tests (0% coverage)
```typescript
// tests/unit/infrastructure/cache/PermissionCache.test.ts
describe('PermissionCache', () => {
  it('should cache user permissions')
  it('should invalidate on role change')
  it('should handle cache misses')
  it('should implement TTL')
  it('should batch invalidation')
})
```

## 🟡 PRIORITY 2 - IMPROVE EXISTING TESTS

### 1. SupabaseUserRepository (60% → 85%)
```typescript
// Add missing test cases
describe('SupabaseUserRepository - Advanced', () => {
  describe('Transaction Management', () => {
    it('should rollback on error')
    it('should handle concurrent updates')
    it('should implement optimistic locking')
  })
  
  describe('Bulk Operations', () => {
    it('should batch create users')
    it('should bulk update roles')
    it('should handle partial failures')
  })
  
  describe('Search & Filter', () => {
    it('should search by email pattern')
    it('should filter by role')
    it('should paginate results')
    it('should sort by created date')
  })
})
```

### 2. Authentication Use Cases (70% → 90%)
```typescript
// tests/unit/application/use-cases/AuthenticateUserUseCase.test.ts
describe('AuthenticateUserUseCase - Edge Cases', () => {
  it('should handle SQL injection attempts')
  it('should prevent timing attacks')
  it('should rate limit by IP')
  it('should detect credential stuffing')
  it('should log security events')
})
```

## 🟢 PRIORITY 3 - INTEGRATION TESTS

### 1. End-to-End Authentication Flow
```typescript
// tests/e2e/authentication.test.ts
describe('E2E: Complete Authentication Journey', () => {
  it('should complete patient registration flow', async () => {
    // 1. Register new patient
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'patient@test.com',
        password: 'SecurePass123!',
        personalInfo: {...}
      })
    expect(registerRes.status).toBe(201)
    
    // 2. Verify email
    const token = extractTokenFromEmail()
    const verifyRes = await request(app)
      .post('/auth/verify-email')
      .send({ token })
    expect(verifyRes.status).toBe(200)
    
    // 3. Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'patient@test.com',
        password: 'SecurePass123!'
      })
    expect(loginRes.body.accessToken).toBeDefined()
    
    // 4. Access protected resource
    const profileRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
    expect(profileRes.status).toBe(200)
  })
})
```

### 2. Password Recovery Flow
```typescript
// tests/e2e/password-recovery.test.ts
describe('E2E: Password Recovery', () => {
  it('should complete password recovery flow', async () => {
    // 1. Request reset
    await request(app)
      .post('/api/v1/account-recovery/request-reset')
      .send({ email: 'user@test.com' })
    
    // 2. Verify token from email
    const token = extractResetTokenFromEmail()
    await request(app)
      .post('/api/v1/account-recovery/verify-token')
      .send({ token })
    
    // 3. Reset password
    await request(app)
      .post('/api/v1/account-recovery/reset-password')
      .send({ 
        token,
        newPassword: 'NewSecurePass456!'
      })
    
    // 4. Login with new password
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'user@test.com',
        password: 'NewSecurePass456!'
      })
    expect(loginRes.status).toBe(200)
  })
})
```

## 🔧 TEST UTILITIES CẦN TẠO

### 1. Test Factories
```typescript
// tests/factories/user.factory.ts
export class UserFactory {
  static createPatient(overrides = {}) {
    return {
      email: faker.internet.email(),
      password: 'TestPass123!',
      personalInfo: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        phoneNumber: faker.phone.number()
      },
      ...overrides
    }
  }
  
  static createDoctor(overrides = {}) {...}
  static createAdmin(overrides = {}) {...}
}
```

### 2. Test Helpers
```typescript
// tests/helpers/auth.helper.ts
export class AuthTestHelper {
  static async registerAndLogin(userType = 'patient') {
    const user = UserFactory.create(userType)
    await this.register(user)
    return this.login(user)
  }
  
  static extractTokenFromResponse(response) {...}
  static mockSupabaseAuth() {...}
}
```

### 3. Database Seeders
```typescript
// tests/seeders/test-data.seeder.ts
export class TestDataSeeder {
  static async seedTestUsers() {
    await this.createPatients(10)
    await this.createDoctors(5)
    await this.createAdmins(2)
  }
  
  static async cleanup() {
    await this.deleteTestData()
  }
}
```

## 📊 EXPECTED COVERAGE IMPROVEMENTS

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| Domain Layer | 68% | 90% | HIGH |
| Application Layer | 67% | 85% | HIGH |
| Infrastructure Layer | 58% | 80% | MEDIUM |
| Presentation Layer | 100% | 100% | ✓ |

## 🚀 IMPLEMENTATION TIMELINE

### Week 1 (Days 1-7)
- [ ] Day 1-2: Recovery system tests
- [ ] Day 3-4: Event system tests
- [ ] Day 5-6: Permission cache tests
- [ ] Day 7: Review & refactor

### Week 2 (Days 8-14)
- [ ] Day 8-9: Repository improvements
- [ ] Day 10-11: Integration tests
- [ ] Day 12-13: E2E tests
- [ ] Day 14: Final review & documentation

## ✅ CHECKLIST BEFORE SUBMISSION

### Code Quality
- [ ] All tests passing
- [ ] Coverage > 80%
- [ ] No console.log statements
- [ ] ESLint passing
- [ ] TypeScript no errors

### Documentation
- [ ] API documentation complete
- [ ] README updated
- [ ] Architecture diagram
- [ ] Test documentation

### Performance
- [ ] Load testing completed
- [ ] Database queries optimized
- [ ] Caching implemented
- [ ] Response times < 200ms

## 💻 COMMANDS CHEAT SHEET

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- UserRepository.test.ts

# Run tests in watch mode
npm test -- --watch

# Update snapshots
npm test -- -u

# Run only unit tests
npm test -- tests/unit

# Run only integration tests
npm test -- tests/integration

# Generate coverage report
npm run test:coverage -- --coverageReporters=html
```

## 📈 MONITORING PROGRESS

Track daily progress:
```
Day 1: ✅ Recovery Method tests (5 tests added)
Day 2: ✅ Recovery Attempt tests (4 tests added)
Day 3: 🔄 Event Publisher tests (in progress)
...
```

---
**Success Criteria**: 
- Coverage >= 85%
- All critical paths tested
- Zero failing tests
- Performance benchmarks met
