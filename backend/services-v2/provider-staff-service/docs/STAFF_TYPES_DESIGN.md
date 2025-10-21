# Staff Types Design - Provider Staff Service

**Version**: 2.0.0  
**Date**: 2025-01-11  
**Status**: ✅ Implemented

---

## 📋 Overview

Provider Staff Service sử dụng **4 core staff types** được thiết kế để:
1. Phù hợp với quy mô đồ án tốt nghiệp
2. Align với Identity Service healthcare roles
3. Đơn giản hóa development và testing
4. Dễ dàng mở rộng trong tương lai

---

## 🎯 Core Staff Types (4 loại)

### 1. **doctor** (Bác sĩ)
- **Role**: Medical professional
- **Permissions**: patients, appointments, medical_records, prescriptions
- **Requirements**: 
  - Bắt buộc có ít nhất 1 specialization
  - License number (required)
  - Vietnamese healthcare license (optional)
  - MOH registration number (optional)

### 2. **nurse** (Y tá/Điều dưỡng)
- **Role**: Nursing professional
- **Permissions**: patients, appointments, nursing_records
- **Requirements**:
  - License number (required)
  - Nursing certifications

### 3. **admin** (Quản trị viên)
- **Role**: Administrative management
- **Permissions**: Full system access (users, patients, doctors, appointments, medical_records, system)
- **Requirements**:
  - Administrative credentials

### 4. **receptionist** (Lễ tân)
- **Role**: Front desk operations
- **Permissions**: patients, appointments, billing
- **Requirements**:
  - Basic credentials

---

## 🔄 Alignment with Identity Service

### Healthcare Roles Mapping

| Staff Type | Identity Role | Permissions |
|------------|---------------|-------------|
| `doctor` | `doctor` | patients:*, appointments:*, medical_records:*, prescriptions:* |
| `nurse` | `nurse` | patients:read, appointments:*, nursing_records:* |
| `admin` | `admin` | *:* (full access) |
| `receptionist` | `receptionist` | patients:*, appointments:*, billing:* |

**Perfect 1:1 Mapping**: Mỗi staff type tương ứng với 1 role trong Identity Service.

---

## 📊 Database Schema

### Constraint Definition

```sql
CONSTRAINT chk_staff_type CHECK (
  staff_type IN ('doctor', 'nurse', 'admin', 'receptionist')
)
```

### Table Comment

```sql
COMMENT ON TABLE provider_schema.staff_profiles IS 
'Main aggregate root for all healthcare provider staff (4 core types: doctor, nurse, admin, receptionist)';
```

---

## 💻 TypeScript Definition

```typescript
/**
 * Staff Type - 4 Core Types for Hospital Management
 * Aligned with Identity Service healthcare roles
 * 
 * Extensibility: Can be extended in the future by:
 * 1. Adding new type to this union
 * 2. Updating database constraint
 * 3. Adding corresponding role in Identity Service
 * 
 * Future candidates: 'technician', 'pharmacist', 'therapist', 'social_worker'
 */
export type StaffType = 'doctor' | 'nurse' | 'admin' | 'receptionist';
```

---

## 🚀 Extensibility Plan

### Phase 1: Current (4 types)
- ✅ doctor
- ✅ nurse
- ✅ admin
- ✅ receptionist

### Phase 2: Support Staff (Add 2 types)
- ⏳ **technician** (Kỹ thuật viên)
  - X-ray technician
  - Lab technician
  - Medical equipment technician
- ⏳ **pharmacist** (Dược sĩ)
  - Pharmacy operations
  - Medication dispensing

### Phase 3: Specialized Staff (Add 2 types)
- ⏳ **therapist** (Chuyên viên trị liệu)
  - Physical therapy
  - Occupational therapy
  - Speech therapy
- ⏳ **social_worker** (Nhân viên xã hội)
  - Patient support
  - Family counseling

---

## 🔧 How to Extend

### Step 1: Update TypeScript Type
```typescript
// Before
export type StaffType = 'doctor' | 'nurse' | 'admin' | 'receptionist';

// After (adding technician)
export type StaffType = 'doctor' | 'nurse' | 'admin' | 'receptionist' | 'technician';
```

### Step 2: Update Database Constraint
```sql
-- Drop old constraint
ALTER TABLE provider_schema.staff_profiles 
DROP CONSTRAINT chk_staff_type;

-- Add new constraint
ALTER TABLE provider_schema.staff_profiles 
ADD CONSTRAINT chk_staff_type 
CHECK (staff_type IN ('doctor', 'nurse', 'admin', 'receptionist', 'technician'));
```

### Step 3: Add Identity Service Role
```sql
INSERT INTO auth_schema.healthcare_roles (role_name, role_description, permissions)
VALUES (
  'technician',
  'Medical technician',
  '["patients:read", "lab_results:create", "imaging:create"]'::jsonb
);
```

### Step 4: Update Tests
```typescript
// Add test cases for new staff type
it('should create technician staff', () => {
  const staffData = {
    staffType: 'technician' as const,
    // ... other fields
  };
  const staff = ProviderStaff.create(staffData);
  expect(staff.staffType).toBe('technician');
});
```

---

## 📝 Migration History

### 2025-01-11: Reduce to 4 Core Types
- **Migration**: `20250111_reduce_staff_types_to_4_core.sql`
- **Changes**:
  - Removed: technician, pharmacist, therapist
  - Kept: doctor, nurse, admin, receptionist
- **Reason**: Simplify for thesis project scope
- **Impact**: No data loss (no records with removed types)

### 2025-01-10: Remove Bounded Context Violations
- **Migration**: `20250110_remove_bounded_context_violations.sql`
- **Changes**: Removed reviews, rating, total_patients, is_accepting_new_patients
- **Reason**: DDD bounded context compliance

---

## ✅ Benefits of 4 Core Types

1. **Simplicity**: Dễ hiểu, dễ implement, dễ test
2. **Alignment**: Perfect match với Identity Service
3. **Realistic**: Đủ để demo hospital workflow
4. **Extensible**: Dễ dàng thêm types mới
5. **Maintainable**: Ít complexity, ít bugs
6. **Focused**: Focus vào core functionality

---

## 🎓 Academic Justification

### Why 4 Types is Appropriate for Thesis

1. **Scope Management**: Phù hợp với thời gian và resources của đồ án
2. **Core Coverage**: Cover cả clinical (doctor, nurse) và administrative (admin, receptionist)
3. **Real-world Relevance**: Đủ để demo realistic hospital operations
4. **Extensibility Demonstration**: Thể hiện khả năng thiết kế scalable system
5. **Industry Alignment**: Phù hợp với industry best practices

### Research References

- **Healthcare Information Systems**: NCBI Bookshelf - Health Information Systems
- **Hospital Staff Classification**: WHO Healthcare Worker Classification
- **DDD Bounded Contexts**: Domain-Driven Design by Eric Evans

---

## 📚 Related Documentation

- [AGENTS.md](../../../AGENTS.md) - Agent guidelines
- [DEVELOPMENT_RULES.md](../../../DEVELOPMENT_RULES.md) - Development standards
- [DATABASE_SCHEMA.md](../database/schema.sql) - Database schema
- [ProviderStaff.ts](../src/domain/aggregates/ProviderStaff.ts) - Domain model

---

**Last Updated**: 2025-01-11  
**Author**: Hospital Management Team  
**Version**: 2.0.0

