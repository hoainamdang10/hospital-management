# Provider Staff Service - Detailed Refactoring Action Plan

**Date**: 2025-01-11  
**Status**: 🔴 **CRITICAL - MUST COMPLETE BEFORE PRODUCTION**  
**Estimated Effort**: 1-2 Sprints (10-20 days)  
**Priority**: P0 (Critical)

---

## 📊 EXECUTIVE SUMMARY

Provider Staff Service hiện tại có **3 vấn đề nghiêm trọng** cần khắc phục trước khi deploy production:

1. **Bounded Context Violations** - Service đang quản lý data thuộc về Review Service và Scheduling Service
2. **Version Duplication** - Tồn tại 2 versions (provider-staff-service và provider-staff-service-v2)
3. **Anti-patterns** - Một số patterns không tuân thủ Clean Architecture

**Impact**: Service hiện tại ở mức **B+ (85/100)**, cần đạt **A (90+/100)** để production-ready.

---

## 🎯 REFACTORING GOALS

### Goal 1: Fix Bounded Context Violations ✅ (Partially Done)
**Status**: Domain layer đã được refactor, còn lại infrastructure và testing

**Violations Identified**:
1. ❌ `rating: number` - Belongs to Review/Rating Service
2. ❌ `reviews: StaffReview[]` - Belongs to Review/Rating Service
3. ❌ `totalPatients: number` - Belongs to Scheduling/Appointment Service
4. ❌ `isAcceptingNewPatients: boolean` - Belongs to Scheduling/Appointment Service

**What Remains in Provider Staff Service**:
- ✅ Professional credentials (license, certifications)
- ✅ Employment information (hire date, contract, years of experience)
- ✅ Specializations
- ✅ Work schedule & availability
- ✅ Department assignments
- ⚠️ Consultation fee (TODO: Consider moving to Billing Service)

### Goal 2: Consolidate Versions
**Status**: Not started

**Current State**:
- `provider-staff-service/` - Main version with bounded context refactor
- `provider-staff-service-v2/` - Older version, needs to be deprecated

**Target State**:
- Single consolidated version in `provider-staff-service/`
- Remove `provider-staff-service-v2/`

### Goal 3: Complete Testing
**Status**: Partial coverage

**Current State**:
- ✅ Unit tests for domain layer
- ✅ Some integration tests
- ❌ Missing integration event tests
- ❌ Missing API tests for refactored endpoints

**Target State**:
- ✅ 100% unit test coverage for domain
- ✅ Comprehensive integration tests
- ✅ Integration event tests
- ✅ API tests with updated DTOs

---

## 📋 DETAILED ACTION PLAN

### PHASE 1: Complete Domain Layer Refactoring ✅ (DONE)

**Status**: ✅ **COMPLETED**

**Completed Tasks**:
- [x] Remove `rating`, `totalPatients`, `isAcceptingNewPatients`, `reviews` from `ProviderStaffProps`
- [x] Remove `rating` getter
- [x] Remove `getAverageRating()` method
- [x] Remove `setAcceptingNewPatients()` method
- [x] Update `toPersistence()` to exclude removed fields
- [x] Update `fromPersistence()` to ignore removed fields
- [x] Update `getSummaryForLogging()` to exclude removed fields

**Verification**:
```bash
# Check domain layer has no violations
cd backend/services-v2/provider-staff-service
grep -r "rating\|totalPatients\|isAcceptingNewPatients\|reviews" src/domain/
# Should return no results
```

---

### PHASE 2: Update Application Layer ✅ (DONE)

**Status**: ✅ **COMPLETED**

**Completed Tasks**:
- [x] Update DTOs to remove bounded context violations
- [x] Update query handlers to remove filters on removed fields
- [x] Update use cases to not use removed properties

**Files Updated**:
- `src/presentation/dtos/StaffResponseDto.ts`
- `src/presentation/dtos/RegisterStaffDto.ts`
- `src/application/use-cases/RegisterStaffUseCase.ts`
- `src/application/use-cases/GetStaffProfileUseCase.ts`

---

### PHASE 3: Implement Integration Events Infrastructure ⏳ (IN PROGRESS)

**Status**: ⏳ **IN PROGRESS** (Priority: P0)

**Estimated Effort**: 3-5 days

#### 3.1 Create Event Definitions

**File**: `src/domain/events/integration/`

**Events to Publish**:
```typescript
// StaffRegisteredEvent.ts
export interface StaffRegisteredEvent extends DomainEvent {
  eventType: 'StaffRegistered';
  aggregateId: string; // staffId
  payload: {
    staffId: string;
    userId: string;
    staffType: StaffType;
    specializations: string[];
    licenseNumber: string;
    registeredAt: string;
  };
}

// StaffProfileUpdatedEvent.ts
export interface StaffProfileUpdatedEvent extends DomainEvent {
  eventType: 'StaffProfileUpdated';
  aggregateId: string;
  payload: {
    staffId: string;
    userId: string;
    staffType: StaffType;
    specializations: string[];
    consultationFee?: number;
    status: StaffStatus;
    isActive: boolean;
    updatedAt: string;
  };
}

// StaffCredentialVerifiedEvent.ts
export interface StaffCredentialVerifiedEvent extends DomainEvent {
  eventType: 'StaffCredentialVerified';
  aggregateId: string;
  payload: {
    staffId: string;
    credentialNumber: string;
    issuingAuthority: string;
    verifiedAt: string;
  };
}

// StaffScheduleUpdatedEvent.ts
export interface StaffScheduleUpdatedEvent extends DomainEvent {
  eventType: 'StaffScheduleUpdated';
  aggregateId: string;
  payload: {
    staffId: string;
    workSchedule: WorkSchedule;
    updatedAt: string;
  };
}
```

**Events to Subscribe**:
```typescript
// From Review/Rating Service
export interface StaffRatingUpdatedEvent {
  eventType: 'StaffRatingUpdated';
  payload: {
    staffId: string;
    averageRating: number;
    totalReviews: number;
    updatedAt: string;
  };
}

// From Scheduling/Appointment Service
export interface StaffPatientCountUpdatedEvent {
  eventType: 'StaffPatientCountUpdated';
  payload: {
    staffId: string;
    totalPatients: number;
    updatedAt: string;
  };
}

export interface StaffAvailabilityChangedEvent {
  eventType: 'StaffAvailabilityChanged';
  payload: {
    staffId: string;
    isAcceptingNewPatients: boolean;
    reason?: string;
    updatedAt: string;
  };
}
```

#### 3.2 Implement Event Publishers

**File**: `src/infrastructure/events/StaffEventPublisher.ts`

```typescript
export class StaffEventPublisher {
  constructor(
    private eventBus: IEventBus,
    private logger: ILogger
  ) {}

  async publishStaffRegistered(event: StaffRegisteredEvent): Promise<void> {
    await this.eventBus.publish('staff.registered', event);
    this.logger.info('Published StaffRegisteredEvent', { staffId: event.aggregateId });
  }

  async publishStaffProfileUpdated(event: StaffProfileUpdatedEvent): Promise<void> {
    await this.eventBus.publish('staff.profile.updated', event);
    this.logger.info('Published StaffProfileUpdatedEvent', { staffId: event.aggregateId });
  }

  // ... other publishers
}
```

#### 3.3 Implement Event Handlers (Subscribers)

**File**: `src/infrastructure/events/handlers/`

```typescript
// StaffRatingUpdatedHandler.ts
export class StaffRatingUpdatedHandler {
  constructor(
    private staffRepository: IStaffRepository,
    private logger: ILogger
  ) {}

  async handle(event: StaffRatingUpdatedEvent): Promise<void> {
    // Store rating in read model or cache for quick access
    // Do NOT store in staff aggregate (bounded context violation)
    this.logger.info('Received StaffRatingUpdatedEvent', {
      staffId: event.payload.staffId,
      rating: event.payload.averageRating
    });
    
    // Option 1: Store in Redis cache
    await this.cache.set(
      `staff:${event.payload.staffId}:rating`,
      event.payload.averageRating,
      3600 // 1 hour TTL
    );
    
    // Option 2: Store in read model table (provider_schema.staff_ratings_view)
    // This is for query optimization only, not part of aggregate
  }
}
```

#### 3.4 Update RabbitMQ Configuration

**File**: `src/infrastructure/messaging/RabbitMQConfig.ts`

```typescript
export const STAFF_EXCHANGES = {
  STAFF_EVENTS: 'staff.events',
  REVIEW_EVENTS: 'review.events',
  SCHEDULING_EVENTS: 'scheduling.events'
};

export const STAFF_QUEUES = {
  STAFF_REGISTERED: 'staff.registered.queue',
  STAFF_PROFILE_UPDATED: 'staff.profile.updated.queue',
  STAFF_RATING_UPDATED: 'staff.rating.updated.queue',
  STAFF_AVAILABILITY_CHANGED: 'staff.availability.changed.queue'
};

export const STAFF_ROUTING_KEYS = {
  STAFF_REGISTERED: 'staff.registered',
  STAFF_PROFILE_UPDATED: 'staff.profile.updated',
  STAFF_RATING_UPDATED: 'staff.rating.updated',
  STAFF_AVAILABILITY_CHANGED: 'staff.availability.changed'
};
```

**Checklist**:
- [ ] Create event definitions in `src/domain/events/integration/`
- [ ] Implement `StaffEventPublisher` in `src/infrastructure/events/`
- [ ] Implement event handlers in `src/infrastructure/events/handlers/`
- [ ] Update RabbitMQ configuration
- [ ] Wire up event publishers in use cases
- [ ] Wire up event handlers in main.ts
- [ ] Test event publishing locally
- [ ] Test event subscription locally

---

### PHASE 4: Database Migration ⏳ (NOT STARTED)

**Status**: ⏳ **NOT STARTED** (Priority: P0)

**Estimated Effort**: 1-2 days

#### 4.1 Create Migration Script

**File**: `migrations/20250111_remove_bounded_context_violations.sql`

```sql
-- Provider Staff Service - Remove Bounded Context Violations
-- Date: 2025-01-11
-- Author: Hospital Management Team

BEGIN;

-- Step 1: Backup data to temporary tables (optional, for safety)
CREATE TABLE IF NOT EXISTS provider_schema.staff_reviews_backup AS
SELECT id, reviews FROM provider_schema.staff_profiles WHERE reviews IS NOT NULL;

CREATE TABLE IF NOT EXISTS provider_schema.staff_patient_stats_backup AS
SELECT id, total_patients, is_accepting_new_patients 
FROM provider_schema.staff_profiles;

-- Step 2: Drop columns with bounded context violations
ALTER TABLE provider_schema.staff_profiles
  DROP COLUMN IF EXISTS reviews,
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS total_patients,
  DROP COLUMN IF EXISTS is_accepting_new_patients;

-- Step 3: Drop related constraints
ALTER TABLE provider_schema.staff_profiles
  DROP CONSTRAINT IF EXISTS chk_rating;

-- Step 4: Create read model table for cached ratings (optional)
CREATE TABLE IF NOT EXISTS provider_schema.staff_ratings_view (
  staff_id UUID PRIMARY KEY REFERENCES provider_schema.staff_profiles(id),
  average_rating NUMERIC(3,2) CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_staff_ratings_staff FOREIGN KEY (staff_id) REFERENCES provider_schema.staff_profiles(id) ON DELETE CASCADE
);

-- Step 5: Create read model table for cached patient stats (optional)
CREATE TABLE IF NOT EXISTS provider_schema.staff_patient_stats_view (
  staff_id UUID PRIMARY KEY REFERENCES provider_schema.staff_profiles(id),
  total_patients INTEGER DEFAULT 0,
  is_accepting_new_patients BOOLEAN DEFAULT TRUE,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_staff_stats_staff FOREIGN KEY (staff_id) REFERENCES provider_schema.staff_profiles(id) ON DELETE CASCADE
);

-- Step 6: Create indexes for read models
CREATE INDEX IF NOT EXISTS idx_staff_ratings_view_staff_id ON provider_schema.staff_ratings_view(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_patient_stats_view_staff_id ON provider_schema.staff_patient_stats_view(staff_id);

COMMIT;
```

#### 4.2 Create Rollback Script

**File**: `migrations/20250111_remove_bounded_context_violations_rollback.sql`

```sql
-- Rollback script (if needed)
BEGIN;

-- Restore columns
ALTER TABLE provider_schema.staff_profiles
  ADD COLUMN IF NOT EXISTS reviews JSONB,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS total_patients INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_accepting_new_patients BOOLEAN DEFAULT TRUE;

-- Restore constraints
ALTER TABLE provider_schema.staff_profiles
  ADD CONSTRAINT chk_rating CHECK (rating >= 0 AND rating <= 5);

-- Restore data from backup (if exists)
UPDATE provider_schema.staff_profiles sp
SET reviews = b.reviews
FROM provider_schema.staff_reviews_backup b
WHERE sp.id = b.id;

UPDATE provider_schema.staff_profiles sp
SET 
  total_patients = b.total_patients,
  is_accepting_new_patients = b.is_accepting_new_patients
FROM provider_schema.staff_patient_stats_backup b
WHERE sp.id = b.id;

COMMIT;
```

**Checklist**:
- [ ] Create migration script
- [ ] Create rollback script
- [ ] Test migration on local database
- [ ] Test rollback on local database
- [ ] Backup production database
- [ ] Run migration on staging
- [ ] Verify migration success on staging
- [ ] Run migration on production (during maintenance window)

---

### PHASE 5: Consolidate Versions ⏳ (NOT STARTED)

**Status**: ⏳ **NOT STARTED** (Priority: P1)

**Estimated Effort**: 2-3 days

#### 5.1 Analyze Differences

**Task**: Compare `provider-staff-service/` and `provider-staff-service-v2/`

```bash
# Compare directory structures
diff -r provider-staff-service/ provider-staff-service-v2/

# Identify unique features in v2
# Identify unique features in v1
# Identify common code
```

#### 5.2 Merge Strategy

**Option 1: Keep v1, Deprecate v2** (Recommended)
- `provider-staff-service/` is the main version with bounded context refactor
- Migrate any unique features from v2 to v1
- Delete `provider-staff-service-v2/`

**Option 2: Keep v2, Deprecate v1**
- Only if v2 has significant improvements
- Apply bounded context refactor to v2
- Delete `provider-staff-service/`

**Recommendation**: **Option 1** - Keep v1 because it already has bounded context refactor

#### 5.3 Migration Steps

1. **Identify Unique Features in v2**:
   ```bash
   # List files only in v2
   diff -qr provider-staff-service/ provider-staff-service-v2/ | grep "Only in provider-staff-service-v2"
   ```

2. **Port Unique Features to v1**:
   - Copy unique use cases
   - Copy unique domain logic
   - Copy unique infrastructure implementations

3. **Update Tests**:
   - Merge test suites
   - Remove duplicate tests
   - Add missing tests

4. **Update Documentation**:
   - Update README.md
   - Update API documentation
   - Update deployment guides

5. **Delete v2**:
   ```bash
   rm -rf provider-staff-service-v2/
   ```

**Checklist**:
- [ ] Analyze differences between v1 and v2
- [ ] Document unique features in v2
- [ ] Port unique features to v1
- [ ] Update tests
- [ ] Update documentation
- [ ] Delete provider-staff-service-v2/
- [ ] Update docker-compose.v2.yml
- [ ] Update CI/CD pipelines

---

### PHASE 6: Complete Testing ⏳ (NOT STARTED)

**Status**: ⏳ **NOT STARTED** (Priority: P0)

**Estimated Effort**: 3-4 days

#### 6.1 Update Domain Tests

**Files**: `tests/unit/domain/`

**Tasks**:
- [ ] Remove tests for `getAverageRating()`
- [ ] Remove tests for `setAcceptingNewPatients()`
- [ ] Remove tests for `rating` getter
- [ ] Add tests for new domain events
- [ ] Verify 100% coverage for domain layer

#### 6.2 Update Use Case Tests

**Files**: `tests/unit/application/use-cases/`

**Tasks**:
- [ ] Update `RegisterStaffUseCase` tests (no rating/totalPatients)
- [ ] Update `GetStaffProfileUseCase` tests (no rating in response)
- [ ] Add tests for event publishing in use cases
- [ ] Verify all use cases have tests

#### 6.3 Add Integration Event Tests

**Files**: `tests/integration/events/`

**Tasks**:
- [ ] Test `StaffRegisteredEvent` publishing
- [ ] Test `StaffProfileUpdatedEvent` publishing
- [ ] Test `StaffRatingUpdatedEvent` subscription
- [ ] Test `StaffAvailabilityChangedEvent` subscription
- [ ] Test event handler error scenarios
- [ ] Test event retry logic

#### 6.4 Update API Tests

**Files**: `tests/integration/api/`

**Tasks**:
- [ ] Update DTOs in API tests
- [ ] Remove `rating`, `totalPatients`, `isAcceptingNewPatients` from response assertions
- [ ] Add tests for new endpoints (if any)
- [ ] Test error scenarios
- [ ] Test authentication/authorization

**Checklist**:
- [ ] Update domain tests
- [ ] Update use case tests
- [ ] Add integration event tests
- [ ] Update API tests
- [ ] Run full test suite: `npm test`
- [ ] Verify test coverage >= 90%
- [ ] Fix any failing tests

---

## 🚀 DEPLOYMENT STRATEGY

### Pre-Deployment Checklist

- [ ] All phases completed
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Database migration tested on staging
- [ ] Integration events tested on staging
- [ ] Performance testing completed
- [ ] Security audit completed

### Deployment Steps

#### Step 1: Deploy to Staging
1. Deploy updated Provider Staff Service
2. Run database migration
3. Verify service health
4. Test integration events
5. Test API endpoints
6. Monitor logs for errors

#### Step 2: Deploy to Production
1. Schedule maintenance window
2. Backup production database
3. Deploy updated Provider Staff Service
4. Run database migration
5. Verify service health
6. Monitor for 24 hours
7. Rollback if issues detected

---

## 📊 SUCCESS METRICS

### Technical Metrics
- [ ] 0 bounded context violations
- [ ] 1 consolidated version (not 2)
- [ ] >= 90% test coverage
- [ ] 0 failing tests
- [ ] < 200ms average API response time
- [ ] 100% integration event delivery

### Quality Metrics
- [ ] Architecture score >= 9.0/10
- [ ] Bounded context score >= 9.0/10
- [ ] Overall grade >= A (90/100)
- [ ] Production-ready status: ✅ YES

---

## 🎯 TIMELINE

| Phase | Estimated Effort | Priority | Status |
|-------|-----------------|----------|--------|
| Phase 1: Domain Layer | 2 days | P0 | ✅ DONE |
| Phase 2: Application Layer | 2 days | P0 | ✅ DONE |
| Phase 3: Integration Events | 3-5 days | P0 | ⏳ IN PROGRESS |
| Phase 4: Database Migration | 1-2 days | P0 | ⏳ NOT STARTED |
| Phase 5: Consolidate Versions | 2-3 days | P1 | ⏳ NOT STARTED |
| Phase 6: Complete Testing | 3-4 days | P0 | ⏳ NOT STARTED |
| **TOTAL** | **13-18 days** | | **~40% Complete** |

**Target Completion**: End of Sprint 2 (2 weeks from now)

---

## 👥 TEAM ASSIGNMENTS

### Backend Developer 1
- Phase 3: Integration Events Infrastructure
- Phase 4: Database Migration

### Backend Developer 2
- Phase 5: Consolidate Versions
- Phase 6: Complete Testing

### DevOps Engineer
- Database migration scripts
- Deployment automation
- Monitoring setup

### QA Engineer
- Test plan creation
- Integration testing
- Performance testing

---

## 📞 SUPPORT & ESCALATION

**Technical Lead**: [Name]  
**Product Owner**: [Name]  
**Escalation Path**: Technical Lead → Engineering Manager → CTO

**Communication Channels**:
- Daily standups: Progress updates
- Slack: #provider-staff-refactor
- Jira: PROV-XXX tickets

---

## 📚 ADDITIONAL RESOURCES

### Related Documents
- [BOUNDED_CONTEXT_REFACTOR.md](./BOUNDED_CONTEXT_REFACTOR.md) - Original refactoring documentation
- [INTER_SERVICE_COMMUNICATION.md](./INTER_SERVICE_COMMUNICATION.md) - Event-driven communication patterns
- [COMPREHENSIVE_PRODUCTION_READINESS_ASSESSMENT.md](../COMPREHENSIVE_PRODUCTION_READINESS_ASSESSMENT.md) - Overall system assessment

### Code Examples

#### Example: Publishing Event in Use Case
```typescript
// src/application/use-cases/RegisterStaffUseCase.ts
export class RegisterStaffUseCase {
  constructor(
    private staffRepository: IStaffRepository,
    private eventPublisher: StaffEventPublisher,
    private logger: ILogger
  ) {}

  async execute(command: RegisterStaffCommand): Promise<RegisterStaffResult> {
    // 1. Create staff aggregate
    const staff = ProviderStaff.create(/* ... */);

    // 2. Save to repository
    await this.staffRepository.save(staff);

    // 3. Publish domain event
    const event: StaffRegisteredEvent = {
      eventType: 'StaffRegistered',
      aggregateId: staff.id.value,
      occurredOn: new Date(),
      payload: {
        staffId: staff.id.value,
        userId: command.userId,
        staffType: staff.staffType,
        specializations: staff.specializations.map(s => s.name),
        licenseNumber: staff.licenseNumber,
        registeredAt: new Date().toISOString()
      }
    };

    await this.eventPublisher.publishStaffRegistered(event);

    return {
      success: true,
      staffId: staff.id.value
    };
  }
}
```

#### Example: Handling Subscribed Event
```typescript
// src/infrastructure/events/handlers/StaffRatingUpdatedHandler.ts
export class StaffRatingUpdatedHandler {
  constructor(
    private cache: ICache,
    private logger: ILogger
  ) {}

  async handle(event: StaffRatingUpdatedEvent): Promise<void> {
    try {
      // Store in cache for quick access (read model)
      await this.cache.set(
        `staff:${event.payload.staffId}:rating`,
        JSON.stringify({
          averageRating: event.payload.averageRating,
          totalReviews: event.payload.totalReviews,
          updatedAt: event.payload.updatedAt
        }),
        3600 // 1 hour TTL
      );

      this.logger.info('Cached staff rating', {
        staffId: event.payload.staffId,
        rating: event.payload.averageRating
      });
    } catch (error) {
      this.logger.error('Failed to cache staff rating', {
        staffId: event.payload.staffId,
        error: error.message
      });
      // Don't throw - this is a non-critical operation
    }
  }
}
```

### Testing Examples

#### Example: Integration Event Test
```typescript
// tests/integration/events/StaffRegisteredEvent.test.ts
describe('StaffRegisteredEvent Integration', () => {
  let eventBus: IEventBus;
  let eventPublisher: StaffEventPublisher;

  beforeAll(async () => {
    // Setup RabbitMQ connection
    eventBus = await setupTestEventBus();
    eventPublisher = new StaffEventPublisher(eventBus, logger);
  });

  it('should publish StaffRegisteredEvent to RabbitMQ', async () => {
    // Arrange
    const event: StaffRegisteredEvent = {
      eventType: 'StaffRegistered',
      aggregateId: 'DOC-GEN-202501-001',
      occurredOn: new Date(),
      payload: {
        staffId: 'DOC-GEN-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        specializations: ['Cardiology'],
        licenseNumber: 'DOC-12345',
        registeredAt: new Date().toISOString()
      }
    };

    // Act
    await eventPublisher.publishStaffRegistered(event);

    // Assert
    // Wait for event to be consumed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify event was published to correct exchange/queue
    const messages = await getMessagesFromQueue('staff.registered.queue');
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.staffId).toBe('DOC-GEN-202501-001');
  });
});
```

---

**Last Updated**: 2025-01-11
**Next Review**: 2025-01-18
**Status**: 🔴 **IN PROGRESS - CRITICAL PRIORITY**

