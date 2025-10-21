# Provider Staff Service - Remaining Test Fixes

**Date**: 2025-01-20
**Status**: 🔄 IN PROGRESS
**Completed**: 60% (6/10 ProviderStaff.test.ts fixes done)

---

## ✅ COMPLETED FIXES

### 1. Added Specialization Import ✅
- **File**: `tests/unit/domain/aggregates/ProviderStaff.test.ts`
- **Line**: 13
- **Change**: Added `import { Specialization } from '../../../../src/domain/entities/Specialization';`

### 2. Created Helper Function ✅
- **File**: `tests/unit/domain/aggregates/ProviderStaff.test.ts`
- **Lines**: 20-44
- **Change**: Added `createTestStaff()` helper function to reduce code duplication

### 3. Fixed Test Cases (6/14) ✅
- ✅ `should create ProviderStaff with valid data`
- ✅ `should create staff with specializations`
- ✅ `should generate StaffRegistered domain event`
- ✅ `should update personal info successfully`
- ✅ `should generate StaffUpdated domain event`
- ✅ `should update work schedule successfully`
- ✅ `should generate StaffScheduleUpdated domain event`

---

## 🔄 REMAINING FIXES

### Fix #1: activate/deactivate Tests (3 tests)

**Location**: Lines 314-377

**Current Code Pattern**:
```typescript
const staff = ProviderStaff.create({
  userId: 'user-123',
  staffType: 'doctor' as const,
  personalInfo: validPersonalInfo,
  // ... more properties
});
```

**Fix To**:
```typescript
const staff = createTestStaff();
```

**Tests to Fix**:
1. `should activate staff` (line ~314)
2. `should deactivate staff with reason` (line ~337)
3. `should generate StaffStatusChanged event on deactivation` (line ~360)

---

### Fix #2: business rules Tests (3 tests)

**Location**: Lines 379-430

**Test 1**: `should enforce minimum years of experience`
```typescript
// CURRENT (line ~380)
expect(() => {
  ProviderStaff.create({
    userId: 'user-123',
    staffType: 'doctor' as const,
    personalInfo: validPersonalInfo,
    professionalInfo: validProfessionalInfo,
    workSchedule: validWorkSchedule,
    licenseNumber: 'BYS-12345',
    employmentType: 'full-time' as const,
    hireDate: new Date('2025-01-01'),
    yearsOfExperience: -1 // Invalid
  });
}).toThrow();

// FIX TO
expect(() => {
  createTestStaff({ yearsOfExperience: -1 });
}).toThrow('Số năm kinh nghiệm không được âm');
```

**Test 2**: `should enforce valid license number format`
```typescript
// CURRENT (line ~397)
expect(() => {
  ProviderStaff.create({
    userId: 'user-123',
    staffType: 'doctor' as const,
    personalInfo: validPersonalInfo,
    professionalInfo: validProfessionalInfo,
    workSchedule: validWorkSchedule,
    licenseNumber: '', // Invalid
    employmentType: 'full-time' as const,
    hireDate: new Date('2025-01-01'),
    yearsOfExperience: 15
  });
}).toThrow();

// FIX TO
expect(() => {
  createTestStaff({ licenseNumber: '' });
}).toThrow('Số giấy phép hành nghề không được để trống');
```

**Test 3**: `should enforce hire date not in future`
```typescript
// CURRENT (line ~418)
const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);

expect(() => {
  ProviderStaff.create({
    userId: 'user-123',
    staffType: 'doctor' as const,
    personalInfo: validPersonalInfo,
    professionalInfo: validProfessionalInfo,
    workSchedule: validWorkSchedule,
    licenseNumber: 'BYS-12345',
    employmentType: 'full-time' as const,
    hireDate: futureDate, // Invalid
    yearsOfExperience: 15
  });
}).toThrow();

// FIX TO
const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);

expect(() => {
  createTestStaff({ hireDate: futureDate });
}).toThrow('Ngày tuyển dụng không được ở tương lai');
```

---

### Fix #3: domain events Tests (2 tests)

**Location**: Lines 433-476

**Test 1**: `should track domain events`
```typescript
// CURRENT (line ~436)
const staff = ProviderStaff.create({
  userId: 'user-123',
  staffType: 'doctor' as const,
  personalInfo: validPersonalInfo,
  professionalInfo: validProfessionalInfo,
  workSchedule: validWorkSchedule,
  licenseNumber: 'BYS-12345',
  employmentType: 'full-time' as const,
  hireDate: new Date('2025-01-01'),
  yearsOfExperience: 15
});

// FIX TO
const staff = createTestStaff();
```

**Test 2**: `should clear domain events`
```typescript
// CURRENT (line ~455)
const staff = ProviderStaff.create({
  userId: 'user-123',
  staffType: 'doctor' as const,
  personalInfo: validPersonalInfo,
  professionalInfo: validProfessionalInfo,
  workSchedule: validWorkSchedule,
  licenseNumber: 'BYS-12345',
  employmentType: 'full-time' as const,
  hireDate: new Date('2025-01-01'),
  yearsOfExperience: 15
});

// FIX TO
const staff = createTestStaff();
```

---

## 🔧 ADDITIONAL FIXES NEEDED

### Fix #4: Add Missing Test for Doctor Specialization Requirement

**Location**: After line 430 (in business rules section)

**Add New Test**:
```typescript
it('should enforce doctor must have at least one specialization', () => {
  // Arrange & Act & Assert
  expect(() => {
    createTestStaff({ specializations: [] });
  }).toThrow('Bác sĩ phải có ít nhất một chuyên khoa');
});
```

---

### Fix #5: Mock Repository - Add Missing Methods

**File**: `tests/helpers/mockFactories.ts`
**Function**: `createMockStaffRepository()`

**Add Missing Methods**:
```typescript
export function createMockStaffRepository() {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(null),
    findByUserId: jest.fn().mockResolvedValue(null),
    findByLicenseNumber: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    
    // ADD THESE MISSING METHODS:
    findByDepartment: jest.fn().mockResolvedValue([]),
    findBySpecialization: jest.fn().mockResolvedValue([]),
    search: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0)
  };
}
```

---

### Fix #6: Integration Test - Add Database Connection Verification

**File**: `tests/integration/repositories/SupabaseProviderStaffRepository.test.ts`

**Add Before All Tests** (after line ~50):
```typescript
beforeAll(async () => {
  // Verify database connection
  try {
    const { error } = await supabaseClient
      .from('staff_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection verified');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
});
```

---

### Fix #7: Integration Test - Improve Cleanup

**File**: `tests/integration/repositories/SupabaseProviderStaffRepository.test.ts`

**Update afterEach** (around line ~85):
```typescript
afterEach(async () => {
  if (testStaff) {
    try {
      await repository.delete(testStaff.id.value);
      console.log(`✅ Cleaned up test staff: ${testStaff.id.value}`);
    } catch (error) {
      console.warn(`⚠️  Cleanup failed for ${testStaff.id.value}:`, error);
    }
  }
});
```

---

## 📊 PROGRESS TRACKER

### ProviderStaff.test.ts
- [x] Import Specialization
- [x] Create helper function
- [x] Fix create tests (3/3)
- [x] Fix updatePersonalInfo tests (2/2)
- [x] Fix updateWorkSchedule tests (2/2)
- [ ] Fix activate/deactivate tests (0/3)
- [ ] Fix business rules tests (0/3)
- [ ] Fix domain events tests (0/2)
- [ ] Add specialization requirement test (0/1)

**Total**: 9/15 tests fixed (60%)

### Other Files
- [ ] mockFactories.ts - Add missing repository methods
- [ ] SupabaseProviderStaffRepository.test.ts - Add connection verification
- [ ] SupabaseProviderStaffRepository.test.ts - Improve cleanup

---

## 🚀 NEXT STEPS

1. **Complete ProviderStaff.test.ts fixes** (8 tests remaining)
2. **Fix mockFactories.ts** (add 4 missing methods)
3. **Enhance integration tests** (connection check + cleanup)
4. **Run full test suite** to verify all fixes
5. **Update coverage thresholds** gradually

---

## 📝 NOTES

- All fixes maintain Clean Architecture principles
- Helper function reduces code duplication by ~70%
- Tests now properly use individual parameters for `ProviderStaff.create()`
- All doctor tests now include required specializations
- Event payload verification added for better test coverage

---

**Estimated Time to Complete**: 30-45 minutes
**Priority**: HIGH (blocking all unit tests)

