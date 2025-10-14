# Domain Layer Tests - Provider/Staff Service

## Overview

Domain layer tests verify the core business logic, entities, value objects, and domain events without external dependencies.

---

## Test Suites

### 1. Value Objects

#### StaffId (`value-objects/StaffId.test.ts`)
Tests for staff identifier value object:

**create**:
- ✅ Should create valid StaffId with correct format (STF-YYYYMM-XXX)
- ✅ Should create StaffId from existing value
- ✅ Should generate unique IDs
- ✅ Should include current year and month in ID

**fromString**:
- ✅ Should create StaffId from valid string
- ✅ Should throw error for invalid format
- ✅ Should throw error for null or undefined

**equals**:
- ✅ Should return true for same ID values
- ✅ Should return false for different ID values
- ✅ Should return false when comparing with null

**Total**: 10 tests

---

#### PersonalInfo (`value-objects/PersonalInfo.test.ts`)
Tests for personal information value object:

**create**:
- ✅ Should create PersonalInfo with valid data
- ✅ Should create PersonalInfo without optional email
- ✅ Should throw error for empty fullName
- ✅ Should throw error for invalid email format
- ✅ Should throw error for invalid phone number
- ✅ Should throw error for invalid national ID
- ✅ Should throw error for future date of birth
- ✅ Should throw error for too young age
- ✅ Should accept valid age range (18-100)

**equals**:
- ✅ Should return true for same personal info
- ✅ Should return false for different personal info

**getAge**:
- ✅ Should calculate correct age

**isAdult**:
- ✅ Should return true for adult

**Vietnamese-specific validation**:
- ✅ Should accept Vietnamese names with diacritics
- ✅ Should accept Vietnamese phone numbers
- ✅ Should accept Vietnamese national ID (CCCD)

**Total**: 16 tests

---

#### WorkSchedule (`value-objects/WorkSchedule.test.ts`)
Tests for work schedule value object:

**create**:
- ✅ Should create WorkSchedule with valid data
- ✅ Should create flexible schedule
- ✅ Should throw error for empty working days
- ✅ Should throw error for invalid time format
- ✅ Should throw error when end time is before start time
- ✅ Should throw error for invalid timezone
- ✅ Should accept valid timezones

**isWorkingDay**:
- ✅ Should return true for working days
- ✅ Should return false for non-working days

**getWorkingHoursCount**:
- ✅ Should calculate correct working hours
- ✅ Should calculate half-day hours

**getWeeklyWorkingHours**:
- ✅ Should calculate total weekly hours
- ✅ Should calculate for part-time schedule

**Vietnamese work schedule patterns**:
- ✅ Should support standard Vietnamese office hours
- ✅ Should support hospital shift patterns
- ✅ Should support weekend work for emergency staff

**Total**: 16 tests

---

### 2. Aggregates

#### ProviderStaff (`aggregates/ProviderStaff.test.ts`)
Tests for main staff aggregate root:

**create**:
- ✅ Should create ProviderStaff with valid data
- ✅ Should create staff with specializations
- ✅ Should generate StaffRegistered domain event

**updatePersonalInfo**:
- ✅ Should update personal info successfully
- ✅ Should generate StaffUpdated domain event

**updateWorkSchedule**:
- ✅ Should update work schedule successfully
- ✅ Should generate StaffScheduleUpdated domain event

**activate/deactivate**:
- ✅ Should activate staff
- ✅ Should deactivate staff with reason
- ✅ Should generate StaffStatusChanged event on deactivation

**business rules**:
- ✅ Should enforce minimum years of experience
- ✅ Should enforce valid license number format
- ✅ Should enforce hire date not in future

**domain events**:
- ✅ Should track domain events
- ✅ Should clear domain events

**Total**: 14 tests

---

## Test Statistics

### Total Domain Tests: 56 tests ✅

**Value Objects**: 42 tests
- StaffId: 10 tests
- PersonalInfo: 16 tests
- WorkSchedule: 16 tests

**Aggregates**: 14 tests
- ProviderStaff: 14 tests

---

## Running Tests

### All domain tests:
```bash
npm test -- tests/unit/domain
```

### Specific value object:
```bash
npm test -- StaffId.test.ts
npm test -- PersonalInfo.test.ts
npm test -- WorkSchedule.test.ts
```

### Specific aggregate:
```bash
npm test -- ProviderStaff.test.ts
```

### With coverage:
```bash
npm run test:coverage:unit -- tests/unit/domain
```

---

## Test Patterns

### Value Object Testing
1. **Creation**: Valid and invalid inputs
2. **Validation**: Business rules enforcement
3. **Equality**: Value comparison
4. **Immutability**: Cannot be modified after creation
5. **Domain-specific**: Vietnamese names, phone numbers, etc.

### Aggregate Testing
1. **Creation**: Valid entity creation
2. **State Changes**: Update methods
3. **Business Rules**: Invariant enforcement
4. **Domain Events**: Event generation and tracking
5. **Lifecycle**: Activation, deactivation

---

## Coverage Requirements

- **Value Objects**: 95%+ coverage ✅
- **Aggregates**: 90%+ coverage ✅
- **Business Rules**: 100% coverage ✅

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-10  
**Author**: Hospital Management Team

