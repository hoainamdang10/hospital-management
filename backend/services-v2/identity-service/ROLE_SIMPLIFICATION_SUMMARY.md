# Role Simplification Summary

**Date**: 2025-01-06  
**Version**: 2.0.0  
**Change Type**: Major - Role Structure Simplification

---

## 📊 Overview

Simplified Identity Service from **8 roles** to **5 core roles** for graduation project scope.

---

## 🔄 Changes Made

### Before (8 Roles)
1. ADMIN
2. DOCTOR
3. NURSE
4. RECEPTIONIST
5. PHARMACIST ❌ (Removed)
6. LAB_TECHNICIAN ❌ (Removed)
7. PATIENT
8. BILLING_STAFF ❌ (Removed)

### After (5 Core Roles)
1. **ADMIN** - System administrator (includes billing management)
2. **DOCTOR** - Medical doctor (includes pharmacy orders & lab orders)
3. **NURSE** - Registered nurse (includes pharmacy dispensing & lab specimen collection)
4. **RECEPTIONIST** - Front desk (includes billing & payment processing)
5. **PATIENT** - Patient user

---

## 🔀 Permission Redistribution

### PHARMACIST → NURSE + DOCTOR

**Pharmacy Permissions Distributed**:

**To NURSE** (Dispensing):
- `prescriptions:dispense` - Dispense medication
- `medications:read` - View medication inventory
- `medications:update` - Update medication inventory

**To DOCTOR** (Prescribing):
- `prescriptions:create` - Write prescription
- `prescriptions:read` - View prescription
- `prescriptions:update` - Modify prescription

**Rationale**: 
- Doctors prescribe medications (clinical decision)
- Nurses dispense medications (operational task)
- Eliminates need for separate pharmacist role

---

### LAB_TECHNICIAN → NURSE + DOCTOR

**Lab Permissions Distributed**:

**To NURSE** (Specimen Collection):
- `lab-orders:read` - View lab order
- `lab-orders:update` - Update order status
- `lab-specimens:create` - Collect specimen
- `lab-specimens:read` - View specimen

**To DOCTOR** (Ordering):
- `lab-orders:create` - Order lab test
- `lab-orders:read` - View lab order
- `lab-results:read` - View lab results

**Rationale**:
- Doctors order lab tests (clinical decision)
- Nurses collect specimens (operational task)
- Eliminates need for separate lab technician role

---

### BILLING_STAFF → RECEPTIONIST + ADMIN

**Billing Permissions Distributed**:

**To RECEPTIONIST** (Operational):
- `billing:create` - Create invoice
- `billing:read` - View invoice
- `billing:update` - Update invoice
- `payments:create` - Process payment
- `payments:read` - View payment

**To ADMIN** (Management):
- `billing:create` - Create invoice
- `billing:read` - View invoice
- `billing:update` - Update invoice
- `billing:delete` - Delete invoice
- `payments:create` - Process payment
- `payments:read` - View payment
- `payments:update` - Update payment
- `payments:delete` - Delete payment

**Rationale**:
- Receptionists handle day-to-day billing (operational)
- Admins manage billing system (administrative)
- Eliminates need for separate billing staff role

---

## 📝 Files Modified

### 1. Domain Layer
**File**: `src/domain/entities/HealthcareRole.ts`

**Changes**:
- Updated `HealthcareRoleType` to only include 5 roles
- Updated `fromRoleType()` method to remove deprecated roles
- Updated role descriptions to reflect merged responsibilities
- Updated `isMedicalStaff()` to only include DOCTOR, NURSE
- Updated `isAdministrativeStaff()` to only include ADMIN, RECEPTIONIST

**Before**:
```typescript
export type HealthcareRoleType =
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN'
  | 'PATIENT'
  | 'BILLING_STAFF';
```

**After**:
```typescript
export type HealthcareRoleType =
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PATIENT';
```

---

### 2. Database Migration
**File**: `migrations/005_simplify_roles_to_5_core.sql`

**Changes**:
1. **Backup existing data** (role_permissions, user_roles)
2. **Migrate users** from deprecated roles:
   - PHARMACIST → NURSE
   - LAB_TECHNICIAN → NURSE
   - BILLING_STAFF → RECEPTIONIST
3. **Add pharmacy permissions** to NURSE & DOCTOR
4. **Add lab permissions** to NURSE & DOCTOR
5. **Add billing permissions** to RECEPTIONIST & ADMIN
6. **Delete deprecated role permissions**
7. **Deactivate deprecated roles** (mark as inactive, keep for audit trail)
8. **Update role descriptions** to reflect merged responsibilities
9. **Verification** - Confirm 5 active roles

**Rollback Instructions**:
```sql
-- Restore from backup
INSERT INTO auth_schema.role_permissions 
SELECT * FROM auth_schema.role_permissions_backup_20250106;

INSERT INTO auth_schema.user_roles 
SELECT * FROM auth_schema.user_roles_backup_20250106;

-- Reactivate deprecated roles
UPDATE auth_schema.healthcare_roles 
SET is_active = true 
WHERE role_name IN ('pharmacist', 'lab_technician', 'billing_staff');
```

---

### 3. Documentation
**Files Updated**:
- `IDENTITY_SERVICE_AUDIT.md` - Updated role list and descriptions
- `ROLE_SIMPLIFICATION_SUMMARY.md` - This document

---

## ✅ Benefits

### 1. Simplified Architecture
- **Before**: 8 roles, complex permission matrix
- **After**: 5 roles, clear permission boundaries
- **Impact**: Easier to understand, maintain, and test

### 2. Reduced Complexity
- **Before**: 8 role types, 8 role definitions, 8 permission sets
- **After**: 5 role types, 5 role definitions, 5 permission sets
- **Impact**: 37.5% reduction in role complexity

### 3. Better Scope for Graduation Project
- **Before**: Too many roles for graduation project scope
- **After**: Core roles only, focused on essential functionality
- **Impact**: More achievable project scope

### 4. Clearer Responsibilities
- **Before**: Overlapping responsibilities (e.g., who dispenses medication?)
- **After**: Clear boundaries (Doctor prescribes, Nurse dispenses)
- **Impact**: Easier to implement and test

### 5. Easier Testing
- **Before**: 8 roles × N permissions = complex test matrix
- **After**: 5 roles × N permissions = manageable test matrix
- **Impact**: Faster test development and execution

---

## 🎯 Migration Impact

### User Impact
- **Existing PHARMACIST users** → Automatically migrated to NURSE
- **Existing LAB_TECHNICIAN users** → Automatically migrated to NURSE
- **Existing BILLING_STAFF users** → Automatically migrated to RECEPTIONIST
- **No data loss** - All users retain access to system
- **Permission upgrade** - Users gain additional permissions from merged roles

### System Impact
- **No breaking changes** - All existing permissions still work
- **Backward compatible** - Old role names marked as deprecated, not deleted
- **Audit trail preserved** - Deprecated roles kept in database for history
- **Permission expansion** - NURSE, DOCTOR, RECEPTIONIST gain new permissions

### Development Impact
- **TypeScript types updated** - Only 5 roles in `HealthcareRoleType`
- **Validation updated** - Only 5 roles accepted in registration
- **Tests updated** - Remove tests for deprecated roles
- **Documentation updated** - All docs reflect 5 core roles

---

## 📋 Next Steps

### Immediate (P0)
1. ✅ Update `HealthcareRole.ts` domain entity
2. ✅ Create migration `005_simplify_roles_to_5_core.sql`
3. ✅ Update documentation
4. ⏳ Run migration on Supabase
5. ⏳ Update tests to remove deprecated roles
6. ⏳ Verify all endpoints work with 5 roles

### Short-term (P1)
7. ⏳ Update frontend to only show 5 roles
8. ⏳ Update API documentation
9. ⏳ Update role boundaries document
10. ⏳ Update permission matrix

### Long-term (P2)
11. ⏳ Remove deprecated role code after 1 month
12. ⏳ Archive backup tables after 3 months

---

## 🔍 Verification Checklist

- [x] Domain entity updated (`HealthcareRole.ts`)
- [x] Migration created (`005_simplify_roles_to_5_core.sql`)
- [x] Documentation updated (`IDENTITY_SERVICE_AUDIT.md`)
- [ ] Migration executed on Supabase
- [ ] Tests updated and passing
- [ ] Frontend updated
- [ ] API documentation updated
- [ ] Role boundaries document updated
- [ ] Permission matrix updated

---

## 📞 Support

If you encounter issues after migration:

1. **Check user role**: `SELECT * FROM auth_schema.user_roles WHERE user_id = '<user_id>';`
2. **Check permissions**: `SELECT * FROM auth_schema.role_permissions WHERE role_id = '<role_id>';`
3. **Rollback if needed**: Follow rollback instructions in migration file
4. **Contact**: Hospital Management Team

---

**Status**: ✅ Code updated, migration ready to execute  
**Next Action**: Run migration on Supabase database

