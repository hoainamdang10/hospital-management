# Bounded Context Refactor - Provider Staff Service

## Overview

This document describes the refactoring of Provider Staff Service to fix bounded context violations and ensure proper separation of concerns according to Domain-Driven Design (DDD) principles.

---

## 🔴 **BOUNDED CONTEXT VIOLATIONS IDENTIFIED**

### 1. **Rating & Reviews** → Belongs to **Review/Rating Service**

**Removed Properties**:
- `rating: number` - Average rating from patient reviews
- `reviews: StaffReview[]` - Array of patient reviews

**Rationale**:
- Reviews and ratings are a separate bounded context
- They involve patient feedback, which is not core to staff management
- Review Service should own this data and publish events

**Impact**:
- Removed from `ProviderStaff` aggregate
- Removed from DTOs
- Removed from database schema
- Removed `getAverageRating()` method

---

### 2. **Patient Statistics & Availability** → Belongs to **Scheduling/Appointment Service**

**Removed Properties**:
- `totalPatients: number` - Total number of patients treated
- `isAcceptingNewPatients: boolean` - Whether doctor accepts new patients

**Rationale**:
- Patient count is derived from appointments, not staff data
- Accepting new patients is a scheduling concern, not staff profile
- Scheduling Service should manage doctor availability for appointments

**Impact**:
- Removed from `ProviderStaff` aggregate
- Removed from DTOs
- Removed from database schema
- Removed `setAcceptingNewPatients()` method

---

## ✅ **WHAT REMAINS IN PROVIDER STAFF SERVICE**

Provider Staff Service now focuses on its **core bounded context**:

### Core Responsibilities:
1. **Professional Credentials & Qualifications**
   - License numbers
   - Certifications
   - Credentials
   - Specializations

2. **Employment Information**
   - Staff type (doctor, nurse, etc.)
   - Employment type (full-time, part-time, etc.)
   - Hire date, contract dates
   - Years of experience
   - Consultation fee (TODO: Consider moving to Billing)

3. **Work Schedule & Availability**
   - Work schedule (shifts, hours)
   - Availability slots (when staff is available to work)
   - Department assignments

4. **Vietnamese Healthcare Compliance**
   - Vietnamese healthcare license
   - MOH registration number

5. **Status Management**
   - Active/inactive status
   - Employment status (active, on-leave, suspended, terminated)

---

## 🔄 **INTEGRATION EVENTS FOR CROSS-SERVICE COMMUNICATION**

### Events Provider Staff Service **PUBLISHES**:

```typescript
// When staff profile is updated
interface StaffProfileUpdatedEvent {
  staffId: string;
  userId: string;
  staffType: string;
  specializations: string[];
  consultationFee?: number;
  status: string;
  isActive: boolean;
  updatedAt: string;
}

// When staff credentials are verified
interface StaffCredentialVerifiedEvent {
  staffId: string;
  credentialNumber: string;
  issuingAuthority: string;
  verifiedAt: string;
}

// When staff work schedule changes
interface StaffScheduleUpdatedEvent {
  staffId: string;
  workSchedule: WorkSchedule;
  updatedAt: string;
}

// When staff is registered
interface StaffRegisteredEvent {
  staffId: string;
  userId: string;
  staffType: string;
  specializations: string[];
  licenseNumber: string;
  registeredAt: string;
}
```

### Events Provider Staff Service **SUBSCRIBES TO**:

```typescript
// From Review/Rating Service
interface StaffRatingUpdatedEvent {
  staffId: string;
  averageRating: number;
  totalReviews: number;
  updatedAt: string;
}

// From Scheduling/Appointment Service
interface StaffPatientCountUpdatedEvent {
  staffId: string;
  totalPatients: number;
  updatedAt: string;
}

interface StaffAvailabilityChangedEvent {
  staffId: string;
  isAcceptingNewPatients: boolean;
  reason?: string;
  updatedAt: string;
}
```

---

## 📊 **API GATEWAY AGGREGATION**

For endpoints that need combined data (e.g., staff profile with rating and patient count), the **API Gateway** should aggregate data from multiple services:

```typescript
// API Gateway endpoint: GET /api/v1/staff/:staffId/full-profile
async function getFullStaffProfile(staffId: string) {
  // Parallel requests to multiple services
  const [staffProfile, rating, scheduling] = await Promise.all([
    providerStaffService.getProfile(staffId),  // Professional info
    reviewService.getStaffRating(staffId),     // Rating & reviews
    schedulingService.getStaffStats(staffId)   // Patient count, availability
  ]);

  return {
    ...staffProfile,
    rating: rating.averageRating,
    totalReviews: rating.totalReviews,
    totalPatients: scheduling.totalPatients,
    isAcceptingNewPatients: scheduling.isAcceptingNewPatients
  };
}
```

---

## 🗄️ **DATABASE MIGRATION**

### Migration File: `20250110_remove_bounded_context_violations.sql`

**Columns Removed**:
- `reviews` (JSONB)
- `rating` (NUMERIC)
- `total_patients` (INTEGER)
- `is_accepting_new_patients` (BOOLEAN)

**Constraints Removed**:
- `chk_rating` (rating >= 0 AND rating <= 5)

**Backup Tables Created** (optional):
- `staff_reviews_backup` - For migrating reviews to Review Service
- `staff_patient_stats_backup` - For migrating stats to Scheduling Service

---

## 🧪 **TESTING IMPACT**

### Tests to Update:

1. **Domain Layer Tests**:
   - Remove tests for `getAverageRating()`
   - Remove tests for `setAcceptingNewPatients()`
   - Remove tests for `rating` getter

2. **Use Case Tests**:
   - Update `RegisterStaffUseCase` tests (no rating/totalPatients)
   - Update `GetStaffProfileUseCase` tests (no rating in response)

3. **Integration Tests**:
   - Add tests for Integration Events
   - Test event publishing when staff profile changes
   - Test event subscription from Review/Scheduling services

4. **API Tests**:
   - Update DTOs in API tests
   - Remove `rating`, `totalPatients`, `isAcceptingNewPatients` from responses

---

## 📝 **IMPLEMENTATION CHECKLIST**

### Phase 1: Domain Layer ✅
- [x] Remove `rating`, `totalPatients`, `isAcceptingNewPatients`, `reviews` from `ProviderStaffProps`
- [x] Remove `rating` getter
- [x] Remove `getAverageRating()` method
- [x] Remove `setAcceptingNewPatients()` method
- [x] Update `toPersistence()` to exclude removed fields
- [x] Update `fromPersistence()` to ignore removed fields
- [x] Update `getSummaryForLogging()` to exclude removed fields

### Phase 2: Application Layer ✅
- [x] Update DTOs to remove bounded context violations
- [x] Update query handlers to remove filters on removed fields
- [x] Update use cases to not use removed properties

### Phase 3: Infrastructure Layer ⏳
- [ ] Create Integration Events (StaffRatingUpdatedEvent, etc.)
- [ ] Create Event Handlers for subscribed events
- [ ] Update RabbitMQ event routing

### Phase 4: Database ⏳
- [ ] Run migration: `20250110_remove_bounded_context_violations.sql`
- [ ] Verify columns are dropped
- [ ] Update schema.sql documentation

### Phase 5: Testing ⏳
- [ ] Update domain tests
- [ ] Update use case tests
- [ ] Add integration event tests
- [ ] Update API tests

### Phase 6: Documentation ✅
- [x] Create BOUNDED_CONTEXT_REFACTOR.md
- [x] Update INTER_SERVICE_COMMUNICATION.md
- [ ] Update API documentation
- [ ] Update README.md

---

## 🚀 **DEPLOYMENT STRATEGY**

### Step 1: Deploy Code Changes
1. Deploy updated Provider Staff Service (backward compatible - ignores removed fields)
2. Verify service health

### Step 2: Run Database Migration
1. Backup data to temporary tables
2. Run migration to drop columns
3. Verify migration success

### Step 3: Deploy Dependent Services
1. Deploy Review Service (if exists) to handle ratings
2. Deploy Scheduling Service updates to handle patient stats
3. Update API Gateway to aggregate data

### Step 4: Verify Integration
1. Test cross-service communication
2. Verify Integration Events are flowing
3. Monitor for errors

---

## 🔍 **VERIFICATION**

### How to Verify Bounded Context Compliance:

```bash
# 1. Check domain layer has no violations
grep -r "rating\|totalPatients\|isAcceptingNewPatients\|reviews" src/domain/

# 2. Check database schema
psql -d hospital_db -c "SELECT column_name FROM information_schema.columns WHERE table_schema = 'provider_schema' AND table_name = 'staff_profiles';"

# 3. Check DTOs
grep -r "rating\|totalPatients\|isAcceptingNewPatients" src/presentation/dtos/

# 4. Run tests
npm test
```

---

## 📚 **REFERENCES**

- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [DDD Bounded Context](https://martinfowler.com/bliki/BoundedContext.html)
- [Microservices Patterns - Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

---

## ✅ **BENEFITS OF THIS REFACTOR**

1. **Clear Bounded Context**: Each service owns its own data
2. **Loose Coupling**: Services communicate via events, not direct dependencies
3. **Scalability**: Services can scale independently
4. **Maintainability**: Easier to understand and modify each service
5. **Testability**: Easier to test in isolation
6. **Compliance**: Follows DDD and Clean Architecture principles

---

## 🎯 **NEXT STEPS**

1. Implement Integration Events infrastructure
2. Create Review Service (if doesn't exist)
3. Update Scheduling Service to manage patient statistics
4. Update API Gateway for data aggregation
5. Run database migration
6. Update all tests
7. Deploy to staging for testing
8. Deploy to production

---

**Last Updated**: 2025-01-10
**Author**: Hospital Management Team
**Status**: In Progress

