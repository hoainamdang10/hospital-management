# Provider Staff Service - Implementation Checklist

**Date**: 2025-01-11  
**Purpose**: Step-by-step checklist for developers implementing the refactoring  
**Estimated Total Effort**: 13-18 days

---

## 📋 PHASE 1: Domain Layer Refactoring ✅ (COMPLETED)

### 1.1 Remove Bounded Context Violations from Domain Model
- [x] Open `src/domain/aggregates/ProviderStaff.ts`
- [x] Remove `rating: number` from `ProviderStaffProps`
- [x] Remove `reviews: StaffReview[]` from `ProviderStaffProps`
- [x] Remove `totalPatients: number` from `ProviderStaffProps`
- [x] Remove `isAcceptingNewPatients: boolean` from `ProviderStaffProps`
- [x] Remove `rating` getter method
- [x] Remove `getAverageRating()` method
- [x] Remove `setAcceptingNewPatients()` method
- [x] Update `toPersistence()` to exclude removed fields
- [x] Update `fromPersistence()` to ignore removed fields
- [x] Update `getSummaryForLogging()` to exclude removed fields
- [x] Run domain tests: `npm run test:domain`
- [x] Verify all domain tests pass

### 1.2 Update Domain Events
- [x] Review `src/domain/events/` directory
- [x] Ensure events don't reference removed properties
- [x] Add new events if needed (StaffProfileUpdated, etc.)

---

## 📋 PHASE 2: Application Layer Updates ✅ (COMPLETED)

### 2.1 Update DTOs
- [x] Open `src/presentation/dtos/StaffResponseDto.ts`
- [x] Remove `rating`, `totalPatients`, `isAcceptingNewPatients`, `reviews` fields
- [x] Open `src/presentation/dtos/RegisterStaffDto.ts`
- [x] Remove any references to removed fields
- [x] Update `src/presentation/dtos/UpdateStaffDto.ts` if exists
- [x] Run DTO validation tests

### 2.2 Update Use Cases
- [x] Open `src/application/use-cases/RegisterStaffUseCase.ts`
- [x] Remove logic related to removed fields
- [x] Open `src/application/use-cases/GetStaffProfileUseCase.ts`
- [x] Update response mapping to exclude removed fields
- [x] Open `src/application/use-cases/UpdateStaffUseCase.ts`
- [x] Remove update logic for removed fields
- [x] Run use case tests: `npm run test:use-cases`

### 2.3 Update Query Handlers
- [x] Review all query handlers in `src/application/queries/`
- [x] Remove filters/sorting on removed fields
- [x] Update response DTOs

---

## 📋 PHASE 3: Integration Events Infrastructure ⏳ (IN PROGRESS)

### 3.1 Create Event Definitions (Day 1)
- [ ] Create directory: `src/domain/events/integration/`
- [ ] Create `StaffRegisteredEvent.ts`:
  ```typescript
  export interface StaffRegisteredEvent extends DomainEvent {
    eventType: 'StaffRegistered';
    aggregateId: string;
    payload: {
      staffId: string;
      userId: string;
      staffType: StaffType;
      specializations: string[];
      licenseNumber: string;
      registeredAt: string;
    };
  }
  ```
- [ ] Create `StaffProfileUpdatedEvent.ts`
- [ ] Create `StaffCredentialVerifiedEvent.ts`
- [ ] Create `StaffScheduleUpdatedEvent.ts`
- [ ] Create `StaffRatingUpdatedEvent.ts` (subscribed event)
- [ ] Create `StaffPatientCountUpdatedEvent.ts` (subscribed event)
- [ ] Create `StaffAvailabilityChangedEvent.ts` (subscribed event)
- [ ] Export all events from `src/domain/events/integration/index.ts`

### 3.2 Implement Event Publisher (Day 2)
- [ ] Create `src/infrastructure/events/StaffEventPublisher.ts`
- [ ] Implement `publishStaffRegistered(event)` method
- [ ] Implement `publishStaffProfileUpdated(event)` method
- [ ] Implement `publishStaffCredentialVerified(event)` method
- [ ] Implement `publishStaffScheduleUpdated(event)` method
- [ ] Add error handling and retry logic
- [ ] Add logging for all published events
- [ ] Write unit tests for event publisher

### 3.3 Implement Event Handlers (Day 3)
- [ ] Create directory: `src/infrastructure/events/handlers/`
- [ ] Create `StaffRatingUpdatedHandler.ts`:
  ```typescript
  export class StaffRatingUpdatedHandler {
    async handle(event: StaffRatingUpdatedEvent): Promise<void> {
      // Store in cache or read model
      await this.cache.set(`staff:${event.payload.staffId}:rating`, ...);
    }
  }
  ```
- [ ] Create `StaffPatientCountUpdatedHandler.ts`
- [ ] Create `StaffAvailabilityChangedHandler.ts`
- [ ] Add error handling in all handlers
- [ ] Add logging in all handlers
- [ ] Write unit tests for all handlers

### 3.4 Update RabbitMQ Configuration (Day 4)
- [ ] Open `src/infrastructure/messaging/RabbitMQConfig.ts`
- [ ] Define exchanges:
  ```typescript
  export const STAFF_EXCHANGES = {
    STAFF_EVENTS: 'staff.events',
    REVIEW_EVENTS: 'review.events',
    SCHEDULING_EVENTS: 'scheduling.events'
  };
  ```
- [ ] Define queues:
  ```typescript
  export const STAFF_QUEUES = {
    STAFF_REGISTERED: 'staff.registered.queue',
    STAFF_PROFILE_UPDATED: 'staff.profile.updated.queue',
    STAFF_RATING_UPDATED: 'staff.rating.updated.queue'
  };
  ```
- [ ] Define routing keys
- [ ] Update `src/main.ts` to setup exchanges and queues on startup
- [ ] Test RabbitMQ connection locally

### 3.5 Wire Up Events in Use Cases (Day 5)
- [ ] Open `src/application/use-cases/RegisterStaffUseCase.ts`
- [ ] Inject `StaffEventPublisher` in constructor
- [ ] After saving staff, publish `StaffRegisteredEvent`:
  ```typescript
  await this.staffRepository.save(staff);
  await this.eventPublisher.publishStaffRegistered({
    eventType: 'StaffRegistered',
    aggregateId: staff.id.value,
    occurredOn: new Date(),
    payload: { /* ... */ }
  });
  ```
- [ ] Repeat for `UpdateStaffUseCase` → `StaffProfileUpdatedEvent`
- [ ] Repeat for `VerifyCredentialUseCase` → `StaffCredentialVerifiedEvent`
- [ ] Repeat for `UpdateScheduleUseCase` → `StaffScheduleUpdatedEvent`
- [ ] Run integration tests

### 3.6 Wire Up Event Handlers in Main (Day 5)
- [ ] Open `src/main.ts`
- [ ] Initialize event handlers:
  ```typescript
  const ratingHandler = new StaffRatingUpdatedHandler(cache, logger);
  const patientCountHandler = new StaffPatientCountUpdatedHandler(cache, logger);
  const availabilityHandler = new StaffAvailabilityChangedHandler(cache, logger);
  ```
- [ ] Subscribe to events:
  ```typescript
  await eventBus.subscribe('staff.rating.updated', ratingHandler.handle.bind(ratingHandler));
  await eventBus.subscribe('staff.patient.count.updated', patientCountHandler.handle.bind(patientCountHandler));
  await eventBus.subscribe('staff.availability.changed', availabilityHandler.handle.bind(availabilityHandler));
  ```
- [ ] Test event subscription locally

---

## 📋 PHASE 4: Database Migration ⏳ (NOT STARTED)

### 4.1 Create Migration Script (Day 6)
- [ ] Create file: `migrations/20250111_remove_bounded_context_violations.sql`
- [ ] Add backup tables creation:
  ```sql
  CREATE TABLE provider_schema.staff_reviews_backup AS
  SELECT id, reviews FROM provider_schema.staff_profiles WHERE reviews IS NOT NULL;
  ```
- [ ] Add column drops:
  ```sql
  ALTER TABLE provider_schema.staff_profiles
    DROP COLUMN IF EXISTS reviews,
    DROP COLUMN IF EXISTS rating,
    DROP COLUMN IF EXISTS total_patients,
    DROP COLUMN IF EXISTS is_accepting_new_patients;
  ```
- [ ] Add read model tables:
  ```sql
  CREATE TABLE provider_schema.staff_ratings_view (
    staff_id UUID PRIMARY KEY,
    average_rating NUMERIC(3,2),
    total_reviews INTEGER,
    last_updated_at TIMESTAMP WITH TIME ZONE
  );
  ```
- [ ] Add indexes for read models
- [ ] Test migration on local database

### 4.2 Create Rollback Script (Day 6)
- [ ] Create file: `migrations/20250111_remove_bounded_context_violations_rollback.sql`
- [ ] Add column restoration:
  ```sql
  ALTER TABLE provider_schema.staff_profiles
    ADD COLUMN IF NOT EXISTS reviews JSONB,
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2);
  ```
- [ ] Add data restoration from backup tables
- [ ] Test rollback on local database

### 4.3 Test Migration (Day 7)
- [ ] Backup local database
- [ ] Run migration script
- [ ] Verify columns are dropped: `\d provider_schema.staff_profiles`
- [ ] Verify read model tables exist
- [ ] Test application with migrated database
- [ ] Run rollback script
- [ ] Verify columns are restored
- [ ] Test application with rolled-back database

---

## 📋 PHASE 5: Consolidate Versions ⏳ (NOT STARTED)

### 5.1 Analyze Differences (Day 8)
- [ ] Run: `diff -r provider-staff-service/ provider-staff-service-v2/`
- [ ] Document unique features in v2
- [ ] Document unique features in v1
- [ ] Create comparison matrix

### 5.2 Port Unique Features (Day 9-10)
- [ ] Identify unique use cases in v2
- [ ] Port unique use cases to v1
- [ ] Identify unique domain logic in v2
- [ ] Port unique domain logic to v1
- [ ] Identify unique infrastructure in v2
- [ ] Port unique infrastructure to v1
- [ ] Run tests after each port

### 5.3 Merge Test Suites (Day 10)
- [ ] Merge unit tests from v2 to v1
- [ ] Merge integration tests from v2 to v1
- [ ] Remove duplicate tests
- [ ] Run full test suite: `npm test`
- [ ] Fix any failing tests

### 5.4 Update Documentation (Day 11)
- [ ] Update `README.md` to reflect consolidated version
- [ ] Update API documentation
- [ ] Update deployment guides
- [ ] Update docker-compose.v2.yml to remove v2 service

### 5.5 Delete v2 (Day 11)
- [ ] Verify all features ported
- [ ] Verify all tests passing
- [ ] Delete `provider-staff-service-v2/` directory
- [ ] Update CI/CD pipelines
- [ ] Commit changes with message: "chore: consolidate provider-staff-service versions"

---

## 📋 PHASE 6: Complete Testing ⏳ (NOT STARTED)

### 6.1 Update Domain Tests (Day 12)
- [ ] Open `tests/unit/domain/aggregates/ProviderStaff.test.ts`
- [ ] Remove tests for `getAverageRating()`
- [ ] Remove tests for `setAcceptingNewPatients()`
- [ ] Remove tests for `rating` getter
- [ ] Add tests for new domain events
- [ ] Run: `npm run test:domain`
- [ ] Verify 100% coverage: `npm run test:coverage`

### 6.2 Update Use Case Tests (Day 12)
- [ ] Open `tests/unit/application/use-cases/RegisterStaffUseCase.test.ts`
- [ ] Remove assertions on `rating`, `totalPatients`
- [ ] Add assertions for event publishing
- [ ] Repeat for all use case tests
- [ ] Run: `npm run test:use-cases`

### 6.3 Add Integration Event Tests (Day 13)
- [ ] Create `tests/integration/events/StaffRegisteredEvent.test.ts`
- [ ] Test event publishing to RabbitMQ
- [ ] Test event consumption from RabbitMQ
- [ ] Create `tests/integration/events/StaffRatingUpdatedEvent.test.ts`
- [ ] Test event handler execution
- [ ] Test error scenarios
- [ ] Test retry logic
- [ ] Run: `npm run test:integration`

### 6.4 Update API Tests (Day 14)
- [ ] Open `tests/integration/api/staff.api.test.ts`
- [ ] Update response assertions to exclude removed fields
- [ ] Add tests for new endpoints (if any)
- [ ] Test authentication/authorization
- [ ] Test error scenarios
- [ ] Run: `npm run test:api`

### 6.5 Run Full Test Suite (Day 14)
- [ ] Run: `npm test`
- [ ] Verify all tests pass
- [ ] Run: `npm run test:coverage`
- [ ] Verify coverage >= 90%
- [ ] Fix any failing tests
- [ ] Generate coverage report

---

## 📋 FINAL VERIFICATION CHECKLIST

### Code Quality
- [ ] No bounded context violations in domain layer
- [ ] No references to `rating`, `totalPatients`, `isAcceptingNewPatients`, `reviews` in code
- [ ] All use cases publish appropriate events
- [ ] All event handlers implemented
- [ ] Error handling in all event publishers/handlers
- [ ] Logging in all event publishers/handlers

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All API tests pass
- [ ] Test coverage >= 90%
- [ ] Integration event tests pass
- [ ] No flaky tests

### Documentation
- [ ] README.md updated
- [ ] API documentation updated
- [ ] BOUNDED_CONTEXT_REFACTOR.md complete
- [ ] DETAILED_REFACTORING_ACTION_PLAN.md complete
- [ ] IMPLEMENTATION_CHECKLIST.md complete (this file)
- [ ] Migration scripts documented

### Database
- [ ] Migration script tested on local
- [ ] Rollback script tested on local
- [ ] Migration script tested on staging
- [ ] Backup strategy documented
- [ ] Read model tables created

### Deployment
- [ ] Docker image builds successfully
- [ ] Service starts without errors
- [ ] Health check endpoint works
- [ ] RabbitMQ connection established
- [ ] Redis connection established
- [ ] Supabase connection established

### Integration
- [ ] Events published to RabbitMQ
- [ ] Events consumed from RabbitMQ
- [ ] API Gateway integration tested
- [ ] Identity Service integration tested
- [ ] Cross-service communication tested

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All implementation phases complete
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Documentation updated

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run database migration on staging
- [ ] Verify service health
- [ ] Test all API endpoints
- [ ] Test integration events
- [ ] Monitor logs for 24 hours
- [ ] Performance testing on staging

### Production Deployment
- [ ] Schedule maintenance window
- [ ] Notify stakeholders
- [ ] Backup production database
- [ ] Deploy to production
- [ ] Run database migration
- [ ] Verify service health
- [ ] Test critical endpoints
- [ ] Monitor logs for 48 hours
- [ ] Rollback plan ready

---

## 📞 SUPPORT

**Questions?** Contact:
- Technical Lead: [Name]
- Backend Team Lead: [Name]
- DevOps Lead: [Name]

**Slack Channels**:
- #provider-staff-refactor
- #backend-support
- #devops-support

---

**Last Updated**: 2025-01-11  
**Status**: 🔴 **IN PROGRESS**  
**Completion**: ~40% (Phases 1-2 done, Phases 3-6 in progress)

