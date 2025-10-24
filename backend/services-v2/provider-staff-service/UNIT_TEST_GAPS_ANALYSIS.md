# Provider Staff Service - Unit Test Coverage Gaps Analysis
**Date:** 2025-10-24  
**Version:** 2.0.0  
**Purpose:** Identify missing unit tests to reach 90%+ coverage

---

## 📊 Current Coverage Status

### Summary
- **Total Source Files:** 89 files
- **Total Unit Tests:** 49 files
- **Coverage Rate:** ~55% of files tested
- **Test Pass Rate:** 71.4% (334/468 tests)

### Coverage by Layer
| Layer | Total Files | Tested | Untested | Coverage |
|-------|-------------|--------|----------|----------|
| **Domain** | 19 | 18 | 1 | 95% ✅ |
| **Application** | 33 | 21 | 12 | 64% ⚠️ |
| **Infrastructure** | 28 | 6 | 22 | 21% ❌ |
| **Presentation** | 9 | 2 | 7 | 22% ❌ |

---

## 🔍 Missing Unit Tests by Priority

### Priority 1: Critical Business Logic (Domain Layer)

#### Missing Tests (2 files)
```
❌ domain/events/StaffDepartmentAssignedEvent.ts
❌ domain/events/StaffSpecializationAddedEvent.ts
```

**Impact:** HIGH - Domain events are critical for event-driven architecture

**Estimated Time:** 30 minutes (2 files × 15 min)

**Test Coverage Needed:**
- Event creation with valid data
- Data extraction methods
- PHI detection
- Event versioning
- Correlation tracking

---

### Priority 2: Application Use Cases (High Value)

#### Missing Use Case Tests (9 files)
```
❌ application/use-cases/AddStaffCertificationUseCase.ts
❌ application/use-cases/AddStaffSpecializationUseCase.ts
❌ application/use-cases/GetStaffSpecializationsUseCase.ts
❌ application/use-cases/RemoveStaffSpecializationUseCase.ts
❌ application/use-cases/SearchStaffUseCase.ts (exists but .skip)
```

**Impact:** HIGH - Core business operations

**Estimated Time:** 3-4 hours (9 files × 20-30 min)

**Test Coverage Needed:**
- Happy path scenarios
- Validation errors
- Business rule enforcement
- Repository interaction
- Event publishing
- Error handling

#### Missing Handler Tests (3 files)
```
❌ application/handlers/StaffCommandHandlers.ts
❌ application/handlers/StaffQueryHandlers.ts
❌ application/handlers/ReviewEventHandler.ts
```

**Impact:** MEDIUM - CQRS command/query handlers

**Estimated Time:** 2 hours (3 files × 40 min)

---

### Priority 3: Infrastructure Layer (Critical for Production)

#### Missing Repository Tests (1 file)
```
⚠️ infrastructure/repositories/SupabaseProviderStaffRepository.ts
   Note: Has integration test but needs unit test
```

**Impact:** HIGH - Core data access

**Estimated Time:** 1 hour

**Test Coverage Needed:**
- CRUD operations with mocked Supabase
- Error handling
- Data mapping
- Query building
- Transaction handling

#### Missing Event Infrastructure Tests (13 files)
```
❌ infrastructure/events/AppointmentCancelledEventHandler.ts
❌ infrastructure/events/AppointmentCompletedEventHandler.ts
❌ infrastructure/events/AppointmentScheduledEventHandler.ts
❌ infrastructure/events/AppointmentsEventConsumer.ts
❌ infrastructure/events/DepartmentEventHandler.ts
❌ infrastructure/events/HybridEventBus.ts
❌ infrastructure/events/IdentityEventConsumer.ts
❌ infrastructure/events/IntegrationEvents.ts
❌ infrastructure/events/PatientEventConsumer.ts
❌ infrastructure/events/PatientRegisteredEventHandler.ts
❌ infrastructure/events/PatientUpdatedEventHandler.ts
❌ infrastructure/events/StaffDomainEventHandler.ts
❌ infrastructure/events/UserCreatedEventHandler.ts
❌ infrastructure/events/UserDeactivatedEventHandler.ts
❌ infrastructure/events/UserRoleChangedEventHandler.ts
```

**Impact:** HIGH - Inter-service communication

**Estimated Time:** 6-8 hours (15 files × 25-30 min)

**Test Coverage Needed:**
- Event consumption
- Event publishing
- Error handling & retries
- Dead letter queue
- Event transformation
- Handler registration

#### Missing Infrastructure Utilities (4 files)
```
❌ infrastructure/clients/DepartmentServiceClient.ts
❌ infrastructure/resilience/CircuitBreaker.ts
❌ infrastructure/messaging/SupabaseEventBus.ts
❌ infrastructure/monitoring/HealthChecks.ts
```

**Impact:** MEDIUM - Supporting infrastructure

**Estimated Time:** 3 hours (4 files × 45 min)

---

### Priority 4: Presentation Layer (API Layer)

#### Missing Controller Tests (1 file)
```
❌ presentation/controllers/StaffController.ts
```

**Impact:** HIGH - Primary API endpoint

**Estimated Time:** 2 hours

**Test Coverage Needed:**
- All HTTP endpoints
- Request validation
- Response formatting
- Error handling
- Authentication checks
- Authorization checks

#### Missing Middleware Tests (2 files)
```
❌ presentation/middleware/AuthenticationMiddleware.ts
❌ presentation/middleware/RateLimitMiddleware.ts
```

**Impact:** HIGH - Security & performance

**Estimated Time:** 1.5 hours (2 files × 45 min)

#### Missing DTO Tests (1 file)
```
❌ presentation/dtos/StaffDTOs.ts
```

**Impact:** MEDIUM - Data validation

**Estimated Time:** 1 hour

#### Missing Route Tests (1 file)
```
❌ presentation/routes/staffRoutes.ts
```

**Impact:** LOW - Routes are simple wiring

**Estimated Time:** 30 minutes

---

## 📋 Prioritized Implementation Plan

### Phase 1: Complete Domain Layer (30 min) ✅ HIGHEST PRIORITY
**Goal:** 100% domain coverage

**Files to Test (2):**
1. ✅ StaffDepartmentAssignedEvent.ts (15 min)
2. ✅ StaffSpecializationAddedEvent.ts (15 min)

**Expected Coverage:** Domain layer 100%

---

### Phase 2: Critical Application Use Cases (3-4 hours)
**Goal:** 90%+ application coverage

**Files to Test (9):**
1. ✅ AddStaffCertificationUseCase.ts (25 min)
2. ✅ AddStaffSpecializationUseCase.ts (25 min)
3. ✅ GetStaffSpecializationsUseCase.ts (20 min)
4. ✅ RemoveStaffSpecializationUseCase.ts (25 min)
5. ✅ SearchStaffUseCase.ts (30 min) - Enable skipped test
6. ✅ StaffCommandHandlers.ts (40 min)
7. ✅ StaffQueryHandlers.ts (40 min)
8. ✅ ReviewEventHandler.ts (30 min)

**Expected Coverage:** Application layer 90%+

---

### Phase 3: Presentation Layer Core (4-5 hours)
**Goal:** 80%+ presentation coverage

**Files to Test (5):**
1. ✅ StaffController.ts (2 hours) - All endpoints
2. ✅ AuthenticationMiddleware.ts (45 min)
3. ✅ RateLimitMiddleware.ts (45 min)
4. ✅ StaffDTOs.ts (1 hour)
5. ✅ staffRoutes.ts (30 min)

**Expected Coverage:** Presentation layer 80%+

---

### Phase 4: Infrastructure Critical (4-5 hours)
**Goal:** 60%+ infrastructure coverage

**Files to Test (5):**
1. ✅ SupabaseProviderStaffRepository.ts (1 hour) - Unit tests
2. ✅ CircuitBreaker.ts (45 min)
3. ✅ DepartmentServiceClient.ts (45 min)
4. ✅ SupabaseEventBus.ts (1 hour)
5. ✅ HealthChecks.ts (45 min)

**Expected Coverage:** Infrastructure layer 60%+

---

### Phase 5: Event Handlers (6-8 hours) - OPTIONAL
**Goal:** Complete event infrastructure

**Files to Test (15):**
- All event handlers and consumers
- Integration with RabbitMQ
- Error handling & retries

**Expected Coverage:** Infrastructure layer 80%+

---

## 🎯 Coverage Goals by Phase

### After Phase 1 (30 min)
- Domain: 100% ✅
- Application: 64%
- Infrastructure: 21%
- Presentation: 22%
- **Overall: ~72%**

### After Phase 2 (4 hours)
- Domain: 100% ✅
- Application: 90%+ ✅
- Infrastructure: 21%
- Presentation: 22%
- **Overall: ~78%**

### After Phase 3 (9 hours)
- Domain: 100% ✅
- Application: 90%+ ✅
- Infrastructure: 21%
- Presentation: 80%+ ✅
- **Overall: ~82%**

### After Phase 4 (14 hours)
- Domain: 100% ✅
- Application: 90%+ ✅
- Infrastructure: 60%+ ⚠️
- Presentation: 80%+ ✅
- **Overall: ~87%**

### After Phase 5 (22 hours) - STRETCH GOAL
- Domain: 100% ✅
- Application: 90%+ ✅
- Infrastructure: 80%+ ✅
- Presentation: 80%+ ✅
- **Overall: ~92%+ ✅ TARGET ACHIEVED**

---

## 📊 Detailed Test Requirements

### Domain Events (Priority 1)

#### StaffDepartmentAssignedEvent.test.ts
```typescript
describe('StaffDepartmentAssignedEvent', () => {
  describe('creation', () => {
    it('should create event with valid data');
    it('should extract staff ID');
    it('should extract department ID');
    it('should include assignment details');
    it('should mark as containing PHI');
  });
  
  describe('event metadata', () => {
    it('should have correct event type');
    it('should include timestamp');
    it('should support correlation ID');
    it('should have version number');
  });
});
```

**Estimated Tests:** 8-10 test cases

#### StaffSpecializationAddedEvent.test.ts
```typescript
describe('StaffSpecializationAddedEvent', () => {
  describe('creation', () => {
    it('should create event with specialization data');
    it('should extract staff ID');
    it('should include specialization code');
    it('should include specialization name');
  });
  
  describe('validation', () => {
    it('should validate specialization code format');
    it('should handle Vietnamese specialization names');
  });
});
```

**Estimated Tests:** 6-8 test cases

---

### Application Use Cases (Priority 2)

#### AddStaffCertificationUseCase.test.ts
```typescript
describe('AddStaffCertificationUseCase', () => {
  describe('execute', () => {
    it('should add certification to staff');
    it('should validate certification type');
    it('should check expiry date');
    it('should publish CertificationAddedEvent');
    it('should handle Vietnamese certification types');
    it('should throw error if staff not found');
    it('should throw error if certification already exists');
  });
});
```

**Estimated Tests:** 7-10 test cases

#### StaffCommandHandlers.test.ts
```typescript
describe('StaffCommandHandlers', () => {
  describe('RegisterStaffCommand', () => {
    it('should handle register staff command');
    it('should validate command data');
    it('should call RegisterStaffUseCase');
    it('should publish events');
  });
  
  describe('UpdateStaffCommand', () => {
    it('should handle update staff command');
    it('should validate updates');
  });
  
  // ... other command handlers
});
```

**Estimated Tests:** 20-25 test cases

---

### Presentation Layer (Priority 3)

#### StaffController.test.ts
```typescript
describe('StaffController', () => {
  describe('POST /api/staff', () => {
    it('should register new staff');
    it('should validate required fields');
    it('should return 201 on success');
    it('should return 400 on validation error');
    it('should require authentication');
  });
  
  describe('GET /api/staff/:id', () => {
    it('should get staff by ID');
    it('should return 404 if not found');
    it('should include all staff details');
  });
  
  describe('PUT /api/staff/:id', () => {
    it('should update staff');
    it('should require authorization');
    it('should validate update data');
  });
  
  describe('DELETE /api/staff/:id', () => {
    it('should deactivate staff');
    it('should require admin role');
  });
  
  // Credentials endpoints
  describe('POST /api/staff/:id/credentials', () => {
    it('should add credential');
    it('should validate credential data');
  });
  
  // Specializations endpoints
  describe('GET /api/staff/:id/specializations', () => {
    it('should get staff specializations');
  });
  
  // Department assignments
  describe('POST /api/staff/:id/departments', () => {
    it('should assign to department');
  });
  
  // Schedule management
  describe('PUT /api/staff/:id/schedule', () => {
    it('should update work schedule');
  });
});
```

**Estimated Tests:** 30-40 test cases

---

### Infrastructure (Priority 4)

#### CircuitBreaker.test.ts
```typescript
describe('CircuitBreaker', () => {
  describe('call', () => {
    it('should execute function in closed state');
    it('should open circuit after threshold failures');
    it('should reject calls in open state');
    it('should transition to half-open after timeout');
    it('should close circuit on successful half-open call');
    it('should reopen on failed half-open call');
  });
  
  describe('state management', () => {
    it('should track failure count');
    it('should reset failure count on success');
    it('should emit state change events');
  });
  
  describe('metrics', () => {
    it('should track total calls');
    it('should track success rate');
    it('should track failure rate');
  });
});
```

**Estimated Tests:** 12-15 test cases

---

## 🚀 Recommended Execution Strategy

### Week 1: Foundation (Phases 1-2)
**Target:** Complete Domain + Critical Application

**Days 1-2:**
- ✅ Phase 1: Domain events (30 min)
- ✅ 4 critical use cases (2 hours)

**Days 3-4:**
- ✅ Remaining 5 use cases (2 hours)
- ✅ Command/Query handlers (2 hours)

**Day 5:**
- ✅ Review and fix any issues
- ✅ Run coverage report

**Expected Result:** 78% overall coverage

---

### Week 2: API Layer (Phase 3)
**Target:** Complete Presentation Layer

**Days 1-2:**
- ✅ StaffController full API (2 hours)

**Day 3:**
- ✅ AuthenticationMiddleware (45 min)
- ✅ RateLimitMiddleware (45 min)

**Day 4:**
- ✅ StaffDTOs validation (1 hour)
- ✅ Routes wiring (30 min)

**Day 5:**
- ✅ Review and integration
- ✅ Run coverage report

**Expected Result:** 82% overall coverage

---

### Week 3: Infrastructure (Phase 4)
**Target:** Critical Infrastructure

**Days 1-2:**
- ✅ Repository unit tests (1 hour)
- ✅ CircuitBreaker (45 min)
- ✅ DepartmentServiceClient (45 min)

**Day 3:**
- ✅ SupabaseEventBus (1 hour)
- ✅ HealthChecks (45 min)

**Days 4-5:**
- ✅ Review and fix
- ✅ Run full coverage
- ✅ Documentation

**Expected Result:** 87% overall coverage

---

## 📈 Success Metrics

### Coverage Targets
- ✅ Domain Layer: 100%
- ✅ Application Layer: 90%+
- ✅ Presentation Layer: 80%+
- ⚠️ Infrastructure Layer: 60%+ (minimum)
- ✅ Overall: 87%+ (stretch: 90%+)

### Quality Metrics
- All tests must pass
- No skipped tests
- Comprehensive edge case coverage
- Vietnamese healthcare compliance verified
- HIPAA compliance scenarios tested
- Clean Architecture principles maintained

---

## 📝 Next Immediate Actions

### Today (2-3 hours)
1. ✅ Create 2 missing domain event tests (30 min)
2. ✅ Create AddStaffCertificationUseCase test (25 min)
3. ✅ Create AddStaffSpecializationUseCase test (25 min)
4. ✅ Create GetStaffSpecializationsUseCase test (20 min)
5. ✅ Create RemoveStaffSpecializationUseCase test (25 min)

**Expected Progress:** Domain 100%, Application +12%

### This Week (14 hours total)
- Complete Phases 1-2
- Reach 78% overall coverage
- All domain and critical application tests

### Target Date for 90% Coverage
**3 weeks from today** (assuming ~5-6 hours/day)

---

## 🎯 Summary

### Current State
- **49 unit test files**
- **71.4% pass rate**
- **~72% coverage** (estimated)

### Missing Tests
- **40 files need unit tests**
- **~22 hours of work** (Phases 1-4)
- **~30 hours total** (including Phase 5)

### Prioritization
1. ✅ **Phase 1** (30 min): Complete domain layer → 100% domain
2. ✅ **Phase 2** (4 hours): Critical use cases → 78% overall
3. ✅ **Phase 3** (5 hours): API layer → 82% overall  
4. ✅ **Phase 4** (5 hours): Infrastructure → 87% overall
5. ⚠️ **Phase 5** (8 hours): Event handlers → 92%+ overall (optional)

### Recommendation
**Focus on Phases 1-4** to reach 87% coverage in 3 weeks. Phase 5 (event handlers) can be added later for 90%+ coverage if needed.

---

**Report Generated:** 2025-10-24  
**Status:** Ready for implementation  
**Next Step:** Start Phase 1 (Domain Events)
