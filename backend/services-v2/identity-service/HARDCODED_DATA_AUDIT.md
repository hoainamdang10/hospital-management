# Hardcoded Data Audit Report

**Date**: 2025-01-06
**Service**: Identity Service V2
**Auditor**: AI Agent
**Status**: ⚠️ ISSUES FOUND

## Executive Summary

Audit tìm thấy **7 hardcoded data patterns** trong identity-service, trong đó **2 patterns CRITICAL** cần fix để đảm bảo Pure RBAC hoạt động đúng khi thêm roles mới.

**Severity Breakdown:**
- 🔴 **CRITICAL**: 2 issues (hardcoded role validation)
- 🟡 **MEDIUM**: 1 issue (hardcoded default role)
- 🟢 **LOW**: 4 issues (acceptable hardcoded metadata)

---

## 🔴 CRITICAL ISSUES (Must Fix)

### Issue 1: Hardcoded Role Validation Array

**Severity**: 🔴 CRITICAL
**Impact**: HIGH - Breaks when adding new roles to database
**Locations**: 2 files

#### Location 1: RegisterUserUseCase.ts

**File**: `src/application/use-cases/RegisterUserUseCase.ts`
**Line**: 156

```typescript
const validRoles = ['admin', 'doctor', 'nurse', 'patient', 'receptionist', 'pharmacist', 'lab_technician', 'billing_staff'];
if (!request.roleType || !validRoles.includes(request.roleType.toLowerCase())) {
  return 'Vai trò không hợp lệ';
}
```

**Problem**:
- Hardcoded list of valid roles
- Must update code when adding new roles to database
- Not consistent with Pure RBAC (should query database)

#### Location 2: SupabaseUserRepository.ts

**File**: `src/infrastructure/repositories/SupabaseUserRepository.ts`
**Line**: 343

```typescript
const validRoles = ['admin', 'doctor', 'nurse', 'patient', 'receptionist', 'pharmacist', 'lab_technician', 'billing_staff'];
if (!validRoles.includes(userData.roleType.toLowerCase())) {
  // Rollback: Delete auth user and profile
  throw new Error(`Invalid role type: ${userData.roleType}. Valid roles: ${validRoles.join(', ')}`);
}
```

**Problem**:
- Same hardcoded list duplicated
- Validation happens at repository level (should be domain/application)
- Breaks Pure RBAC principle

**Impact**:
- ❌ Adding new role in database requires code changes
- ❌ No single source of truth
- ❌ Violates Open/Closed Principle
- ❌ Deployment required for role changes

**Recommended Fix**:
```typescript
// Create RoleValidationService
class RoleValidationService {
  constructor(private permissionRepository: IPermissionRepository) {}
  
  async getValidRoles(): Promise<string[]> {
    // Query from healthcare_roles table
    return await this.permissionRepository.getAllRoles();
  }
  
  async isValidRole(roleType: string): Promise<boolean> {
    const validRoles = await this.getValidRoles();
    return validRoles.includes(roleType.toLowerCase());
  }
}

// Usage in RegisterUserUseCase
const isValid = await this.roleValidationService.isValidRole(request.roleType);
if (!isValid) {
  return 'Vai trò không hợp lệ';
}
```

**Estimated Fix Time**: 1 hour

---

## 🟡 MEDIUM ISSUES (Should Fix)

### Issue 2: Hardcoded Default Role 'PATIENT'

**Severity**: 🟡 MEDIUM
**Impact**: MEDIUM - Inconsistent default behavior
**Locations**: 5 occurrences in 1 file

**File**: `src/infrastructure/auth/SupabaseAuthService.ts`
**Lines**: 131, 231, 269, 297, 456

```typescript
role: data.user.user_metadata?.role_type || 'PATIENT'
```

**Problem**:
- Hardcoded default role fallback
- Not configurable
- Assumes 'PATIENT' is always the default
- Duplicated 5 times

**Impact**:
- ⚠️ Cannot change default role without code change
- ⚠️ Not flexible for different deployment scenarios
- ⚠️ Code duplication

**Recommended Fix**:
```typescript
// Add to .env
DEFAULT_USER_ROLE=PATIENT

// Add to config
export const config = {
  defaultUserRole: process.env.DEFAULT_USER_ROLE || 'PATIENT'
};

// Usage
role: data.user.user_metadata?.role_type || config.defaultUserRole
```

**Estimated Fix Time**: 30 minutes

---

## 🟢 LOW ISSUES (Acceptable)

### Issue 3: Hardcoded Role Metadata

**Severity**: 🟢 LOW
**Impact**: LOW - Metadata only, not business logic
**Location**: 1 file

**File**: `src/domain/entities/HealthcareRole.ts`
**Lines**: 74-123

```typescript
const roleMap: Record<string, { name: string; nameVi: string; desc: string; hipaa: boolean }> = {
  'ADMIN': {
    name: 'Administrator',
    nameVi: 'Quản trị viên',
    desc: 'System administrator with full access',
    hipaa: true
  },
  'DOCTOR': { ... },
  // ... 8 roles total
};
```

**Why Acceptable**:
- ✅ Only display metadata (names, descriptions)
- ✅ Not business logic
- ✅ Rarely changes
- ✅ Centralized in one place
- ✅ Used for UI display only

**Recommendation**: Keep as-is. If roles become more dynamic, consider moving to database.

---

### Issue 4: Hardcoded Role Type Checks

**Severity**: 🟢 LOW
**Impact**: LOW - Helper methods only
**Location**: 1 file

**File**: `src/domain/entities/HealthcareRole.ts`
**Lines**: 169, 176

```typescript
public isMedicalStaff(): boolean {
  return ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN'].includes(this.props.type);
}

public isAdministrativeStaff(): boolean {
  return ['ADMIN', 'RECEPTIONIST', 'BILLING_STAFF'].includes(this.props.type);
}
```

**Why Acceptable**:
- ✅ Domain logic (role categorization)
- ✅ Stable business rules
- ✅ Rarely changes
- ✅ Clear and readable

**Recommendation**: Keep as-is. These are domain rules, not configuration.

---

### Issue 5: Hardcoded Route Permissions

**Severity**: 🟢 LOW
**Impact**: LOW - Route-level security
**Location**: 1 file

**File**: `src/main.ts`
**Lines**: 675, 728

```typescript
this.permissionMiddleware.requirePermission({
  permissions: ['users:read', '*'],
  checkOwnership: true,
  ownershipField: 'userId'
})

this.permissionMiddleware.requirePermission({
  permissions: ['users:update', '*'],
  checkOwnership: true,
  ownershipField: 'userId'
})
```

**Why Acceptable**:
- ✅ Route-level security declarations
- ✅ Clear and explicit
- ✅ Easy to audit
- ✅ Standard practice in Express.js

**Recommendation**: Keep as-is. Consider moving to route config file if routes become very numerous.

---

### Issue 6: Hardcoded HealthcareRoleType Union

**Severity**: 🟢 LOW
**Impact**: LOW - TypeScript type safety
**Location**: 1 file

**File**: `src/domain/entities/HealthcareRole.ts`
**Lines**: 17-24

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

**Why Acceptable**:
- ✅ TypeScript type definition
- ✅ Provides compile-time safety
- ✅ Prevents typos
- ✅ Standard TypeScript practice

**Recommendation**: Keep as-is. This is a type definition, not runtime validation.

---

## Summary Table

| Issue | Severity | Location | Impact | Fix Priority | Est. Time |
|-------|----------|----------|--------|--------------|-----------|
| Hardcoded validRoles array | 🔴 CRITICAL | RegisterUserUseCase.ts:156<br>SupabaseUserRepository.ts:343 | HIGH | P0 | 1h |
| Hardcoded default role | 🟡 MEDIUM | SupabaseAuthService.ts (5 places) | MEDIUM | P1 | 30m |
| Hardcoded role metadata | 🟢 LOW | HealthcareRole.ts:74-123 | LOW | P3 | N/A |
| Hardcoded role checks | 🟢 LOW | HealthcareRole.ts:169,176 | LOW | P3 | N/A |
| Hardcoded route permissions | 🟢 LOW | main.ts:675,728 | LOW | P3 | N/A |
| Hardcoded RoleType union | 🟢 LOW | HealthcareRole.ts:17-24 | LOW | P3 | N/A |

---

## Recommended Action Plan

### Phase 1: Critical Fixes (1 hour)

**Goal**: Fix hardcoded role validation

1. **Add getAllRoles() to IPermissionRepository**
   ```typescript
   getAllRoles(): Promise<string[]>;
   ```

2. **Implement in SupabasePermissionRepository**
   ```typescript
   async getAllRoles(): Promise<string[]> {
     const { data } = await this.supabaseClient
       .from('healthcare_roles')
       .select('name')
       .eq('is_active', true);
     return data?.map(r => r.name.toLowerCase()) || [];
   }
   ```

3. **Update RegisterUserUseCase**
   - Remove hardcoded validRoles array
   - Query valid roles from permissionRepository
   - Cache result for performance

4. **Update SupabaseUserRepository**
   - Remove hardcoded validRoles array
   - Query valid roles from permissionRepository
   - Cache result for performance

### Phase 2: Medium Fixes (30 minutes)

**Goal**: Make default role configurable

1. **Add DEFAULT_USER_ROLE to .env**
2. **Update config.ts**
3. **Update SupabaseAuthService** (5 occurrences)

### Phase 3: Optional Improvements (Future)

1. Consider moving route permissions to config file
2. Consider moving role metadata to database
3. Add role management UI

---

## Testing Requirements

After fixes, ensure:

1. ✅ Can add new role to database without code changes
2. ✅ Role validation queries database
3. ✅ Default role is configurable
4. ✅ All existing tests pass
5. ✅ Performance not degraded (use caching)

---

## Conclusion

Identity service có **2 critical hardcoded data issues** cần fix để đảm bảo Pure RBAC hoạt động đúng. Các issues khác là acceptable và không cần fix ngay.

**Recommendation**: Fix Phase 1 (1 hour) trước khi deploy to production.

**Risk if not fixed**:
- ❌ Cannot add new roles without code deployment
- ❌ Violates Pure RBAC principles
- ❌ Maintenance burden increases

**Benefit after fix**:
- ✅ True database-driven RBAC
- ✅ Add roles via database only
- ✅ No code changes needed
- ✅ Easier maintenance

---

**Audited by**: AI Agent
**Date**: 2025-01-06
**Next Review**: After Phase 1 fixes

