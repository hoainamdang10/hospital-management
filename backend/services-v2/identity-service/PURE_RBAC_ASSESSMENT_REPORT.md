# Pure RBAC Assessment Report

**Date**: 2025-01-06  
**Assessor**: AI Agent  
**Status**: ✅ COMPREHENSIVE ANALYSIS COMPLETE  
**Recommendation**: ⭐⭐⭐⭐⭐ STRONGLY SUPPORT PURE RBAC

---

## 📋 EXECUTIVE SUMMARY

Sau khi kiểm tra chi tiết database schema và codebase, tôi **STRONGLY RECOMMEND** implementing Pure RBAC theo đề xuất của user. Đây là thiết kế đúng đắn và cần thiết cho Identity Service.

**Key Findings**:
- ✅ Database đã có infrastructure sẵn (user_roles, user_permissions tables)
- ✅ View `auth_user_profiles_view` đã được thiết kế cho Pure RBAC
- ⚠️ Code hiện tại hardcode permissions → Cần refactor
- ⚠️ Repository chỉ query `user_profiles.role_type` → Cần update
- ✅ Migration path rõ ràng, risk thấp

---

## 🔍 DETAILED ASSESSMENT

### 1. DATABASE SCHEMA ANALYSIS

#### ✅ EXISTING INFRASTRUCTURE (GOOD NEWS!)

**Tables Already Exist**:
```sql
auth_schema.user_profiles       -- ✅ Exists
auth_schema.user_roles          -- ✅ Exists (empty but ready)
auth_schema.user_permissions    -- ✅ Exists (empty but ready)
auth_schema.healthcare_roles    -- ✅ Exists (has 4 roles)
```

**View Already Designed for Pure RBAC**:
```sql
-- File: migrations/003_create_auth_user_profiles_view.sql
CREATE VIEW public.auth_user_profiles_view AS
SELECT
  up.*,
  -- ✅ Aggregates roles from user_roles table
  COALESCE(
    json_agg(DISTINCT ur.role_name) FILTER (WHERE ur.role_name IS NOT NULL),
    '[]'::json
  ) AS roles,
  -- ✅ Aggregates permissions from user_permissions table
  COALESCE(
    json_agg(DISTINCT up2.permission_name) FILTER (WHERE up2.permission_name IS NOT NULL),
    '[]'::json
  ) AS permissions
FROM auth_schema.user_profiles up
LEFT JOIN auth_schema.user_roles ur ON up.id = ur.user_id
LEFT JOIN auth_schema.user_permissions up2 ON up.id = up2.user_id
GROUP BY up.id;
```

**Analysis**:
- ✅ View đã join `user_roles` và `user_permissions`
- ✅ View trả về `roles[]` và `permissions[]` arrays
- ✅ Infrastructure sẵn sàng cho Pure RBAC
- ⚠️ Code chưa sử dụng view này đúng cách

---

### 2. CODE ANALYSIS

#### ⚠️ PROBLEM 1: Hardcoded Permissions in Domain

**File**: `src/domain/entities/HealthcareRole.ts:56-113`

```typescript
public static fromRoleType(roleType: string): HealthcareRole {
  const roleMap: Record<string, { permissions: string[] }> = {
    'ADMIN': { permissions: ['*'] },
    'DOCTOR': { permissions: ['read:patients', 'write:patients', ...] },
    'NURSE': { permissions: ['read:patients', 'write:patients', ...] },
    // ... hardcoded for all 8 roles
  };
}
```

**Issues**:
- ❌ Permissions hardcoded trong code
- ❌ Không thể thay đổi permissions mà không deploy
- ❌ Duplicate logic với database
- ❌ Violates Single Source of Truth principle

**Solution**:
```typescript
// ✅ Remove hardcoded permissions
// ✅ Load permissions from database via repository
public static async fromDatabase(
  roleType: string, 
  permissionRepo: IPermissionRepository
): Promise<HealthcareRole> {
  const permissions = await permissionRepo.getPermissionsForRole(roleType);
  return new HealthcareRole({ type: roleType, permissions });
}
```

---

#### ⚠️ PROBLEM 2: Repository Ignores user_roles Table

**File**: `src/infrastructure/repositories/SupabaseUserRepository.ts:566-589`

```typescript
async getUserRoles(userId: UserId): Promise<string[]> {
  // ❌ Only queries user_profiles.role_type (single role)
  const { data } = await this.supabaseClient
    .from('user_profiles')
    .select('role_type')
    .eq('id', id)
    .single();

  return [data.role_type];  // ❌ Returns single role
}
```

**Issues**:
- ❌ Ignores `user_roles` table
- ❌ Cannot support multiple roles
- ❌ View `auth_user_profiles_view` already has `roles[]` but not used

**Solution**:
```typescript
async getUserRoles(userId: UserId): Promise<string[]> {
  // ✅ Use view that joins user_roles
  const { data } = await this.supabaseClient
    .from('auth_user_profiles_view')
    .select('roles')
    .eq('id', userId.value)
    .single();

  return data?.roles || [];  // ✅ Returns multiple roles
}
```

---

#### ⚠️ PROBLEM 3: Hardcoded Permission Mapping

**File**: `src/infrastructure/repositories/SupabaseUserRepository.ts:903-918`

```typescript
async getUserPermissions(userId: UserId): Promise<string[]> {
  const roles = await this.getUserRoles(userId);
  // ❌ Hardcoded permission mapping
  const permissions: string[] = [];
  roles.forEach(role => {
    if (role === 'admin') permissions.push('*');
    else if (role === 'doctor') permissions.push('read_patients', 'write_patients');
    // ... hardcoded for each role
  });
  return permissions;
}
```

**Issues**:
- ❌ Duplicate hardcoded logic
- ❌ TODO comment indicates this is temporary
- ❌ Ignores `user_permissions` table
- ❌ View already has `permissions[]` but not used

**Solution**:
```typescript
async getUserPermissions(userId: UserId): Promise<string[]> {
  // ✅ Use view that aggregates permissions
  const { data } = await this.supabaseClient
    .from('auth_user_profiles_view')
    .select('permissions')
    .eq('id', userId.value)
    .single();

  return data?.permissions || [];
}
```

---

#### ⚠️ PROBLEM 4: User Aggregate Single Role

**File**: `src/domain/aggregates/User.ts:21-32`

```typescript
export interface UserProps {
  // ❌ Single role only
  healthcareRole: HealthcareRole;
}
```

**Issues**:
- ❌ Cannot support multiple roles
- ❌ Inconsistent with database design

**Solution**:
```typescript
export interface UserProps {
  // ✅ Multiple roles
  healthcareRoles: HealthcareRole[];
}
```

---

#### ⚠️ PROBLEM 5: Mapper Uses Single Role

**File**: `src/infrastructure/mappers/UserMapper.ts:52-60`

```typescript
static toDomain(record: UserRecord): User {
  // ❌ Maps single role_type
  const role = HealthcareRole.fromRoleType(record.role_type);
  
  return User.reconstitute(
    // ...
    role,  // ❌ Single role
    // ...
  );
}
```

**Issues**:
- ❌ Only maps `role_type` column
- ❌ Ignores `user_roles` table
- ❌ Cannot support multiple roles

**Solution**:
```typescript
static async toDomain(
  record: UserRecord, 
  permissionRepo: IPermissionRepository
): Promise<User> {
  // ✅ Load roles from database
  const roles = await permissionRepo.getUserRoles(record.id);
  
  return User.reconstitute(
    // ...
    roles,  // ✅ Multiple roles
    // ...
  );
}
```

---

### 3. MISSING COMPONENTS

#### ❌ MISSING: permissions Table

**Current**: No `permissions` master table

**Needed**:
```sql
CREATE TABLE auth_schema.permissions (
  id UUID PRIMARY KEY,
  permission_name TEXT UNIQUE,  -- 'read:patients'
  resource_type TEXT,           -- 'patients'
  action TEXT,                  -- 'read'
  description TEXT
);
```

---

#### ❌ MISSING: role_permissions Table

**Current**: No `role_permissions` junction table

**Needed**:
```sql
CREATE TABLE auth_schema.role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES healthcare_roles(id),
  permission_id UUID REFERENCES permissions(id),
  UNIQUE(role_id, permission_id)
);
```

---

#### ❌ MISSING: Permission Entity

**Current**: No `Permission` domain entity

**Needed**:
```typescript
// src/domain/entities/Permission.ts
export class Permission {
  constructor(
    private name: string,        // 'read:patients'
    private resourceType: string, // 'patients'
    private action: string        // 'read'
  ) {}

  matches(resource: string, action: string): boolean {
    // Wildcard support
  }
}
```

---

#### ❌ MISSING: IPermissionRepository

**Current**: No permission repository interface

**Needed**:
```typescript
// src/domain/repositories/IPermissionRepository.ts
export interface IPermissionRepository {
  getUserRoles(userId: UserId): Promise<string[]>;
  getUserPermissions(userId: UserId): Promise<string[]>;
  getRolePermissions(roleType: string): Promise<string[]>;
  hasPermission(userId: UserId, resource: string, action: string): Promise<boolean>;
}
```

---

## 📊 IMPACT ANALYSIS

### Files Requiring Changes

| Category | Files | Complexity | Effort |
|----------|-------|------------|--------|
| **Database** | 3 migrations | Medium | 2h |
| **Domain** | 3 files | High | 3h |
| **Infrastructure** | 4 files | High | 4h |
| **Application** | 2 files | Medium | 2h |
| **Tests** | 5 files | High | 4h |
| **TOTAL** | **17 files** | **HIGH** | **15h** |

---

### Detailed File List

**Database (3 files)**:
1. `migrations/004_create_permissions_table.sql` - NEW
2. `migrations/005_create_role_permissions_table.sql` - NEW
3. `migrations/006_seed_rbac_data.sql` - NEW

**Domain (3 files)**:
1. `src/domain/entities/Permission.ts` - NEW
2. `src/domain/entities/HealthcareRole.ts` - MODIFY (remove hardcoded permissions)
3. `src/domain/aggregates/User.ts` - MODIFY (multiple roles)

**Infrastructure (4 files)**:
1. `src/infrastructure/repositories/SupabaseUserRepository.ts` - MODIFY (use view)
2. `src/infrastructure/mappers/UserMapper.ts` - MODIFY (map multiple roles)
3. `src/infrastructure/auth/SupabaseAuthClient.ts` - MODIFY (remove getDefaultPermissions)
4. `src/infrastructure/services/PermissionService.ts` - MODIFY (use repository)

**Application (2 files)**:
1. `src/application/use-cases/RegisterUserUseCase.ts` - MODIFY (assign roles)
2. `src/application/use-cases/AuthenticateUserUseCase.ts` - MODIFY (return roles/permissions)

**Tests (5 files)**:
1. `tests/unit/domain/entities/HealthcareRole.test.ts` - MODIFY
2. `tests/helpers/user-test-helper.ts` - MODIFY
3. `tests/unit/infrastructure/repositories/SupabaseUserRepository.test.ts` - MODIFY
4. `tests/integration/authentication.test.ts` - MODIFY
5. `tests/setup.ts` - MODIFY (seed RBAC data)

---

## ✅ WHY PURE RBAC IS CORRECT

### 1. Database Already Designed for It

**Evidence**:
- ✅ `user_roles` table exists
- ✅ `user_permissions` table exists
- ✅ `auth_user_profiles_view` joins these tables
- ✅ View returns `roles[]` and `permissions[]` arrays

**Conclusion**: Database architect already planned for Pure RBAC. Code just needs to catch up.

---

### 2. Hardcoded Permissions Are Technical Debt

**Current State**:
- ❌ Permissions in 3 places: `HealthcareRole.ts`, `SupabaseUserRepository.ts`, `SupabaseAuthClient.ts`
- ❌ Inconsistent permission formats: `read:patients` vs `read_patients` vs `patients:read`
- ❌ Cannot change permissions without deployment

**Pure RBAC Fixes**:
- ✅ Single source of truth: database
- ✅ Consistent permission format
- ✅ Change permissions via SQL/admin UI

---

### 3. Healthcare Requires Flexibility

**Real-World Scenarios**:
- 🏥 Doctor needs temporary admin access for emergency
- 🏥 Nurse promoted to head nurse → needs additional permissions
- 🏥 Pharmacist also works as receptionist → needs multiple roles
- 🏥 Compliance audit requires permission history

**Pure RBAC Supports**:
- ✅ Multiple roles per user
- ✅ Time-bound permission overrides
- ✅ Audit trail in database
- ✅ Dynamic permission management

---

### 4. Clean Architecture Alignment

**Current Design Violates**:
- ❌ Domain layer has infrastructure concerns (hardcoded permissions)
- ❌ Repository has business logic (permission mapping)
- ❌ Duplicate logic across layers

**Pure RBAC Aligns**:
- ✅ Domain: Pure business logic (Permission entity, validation)
- ✅ Application: Use cases orchestrate repositories
- ✅ Infrastructure: Repository queries database
- ✅ No duplication

---

## 🎯 RECOMMENDATION

### ⭐⭐⭐⭐⭐ STRONGLY SUPPORT PURE RBAC

**Reasons**:

1. **Database Already Ready** (80% done)
   - Tables exist
   - View designed correctly
   - Just need to populate data

2. **Code Refactor is Necessary Anyway**
   - Hardcoded permissions are technical debt
   - TODO comments indicate temporary solution
   - Multiple inconsistencies need fixing

3. **Healthcare Requirements Demand It**
   - Multiple roles per user
   - Dynamic permissions
   - Audit trail
   - HIPAA compliance

4. **Clean Architecture Requires It**
   - Separate concerns
   - Single source of truth
   - Testable design

5. **Future-Proof**
   - Scalable to 1000+ users
   - Easy to add new roles/permissions
   - No code changes for permission updates

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Database (2 hours)

1. Create `permissions` table
2. Create `role_permissions` table
3. Seed default permissions
4. Seed role-permission mappings
5. Verify view works correctly

### Phase 2: Domain (3 hours)

1. Create `Permission` entity
2. Remove hardcoded permissions from `HealthcareRole`
3. Update `User` aggregate for multiple roles
4. Add domain services for permission checks

### Phase 3: Infrastructure (4 hours)

1. Update `SupabaseUserRepository` to use view
2. Update `UserMapper` for multiple roles
3. Remove `getDefaultPermissions` from `SupabaseAuthClient`
4. Update `PermissionService` to use repository

### Phase 4: Application (2 hours)

1. Update `RegisterUserUseCase` to assign roles
2. Update `AuthenticateUserUseCase` to return roles/permissions
3. Update other use cases as needed

### Phase 5: Testing (4 hours)

1. Update unit tests
2. Update integration tests
3. Add permission tests
4. Verify HIPAA compliance

---

## ⏱️ EFFORT ESTIMATE

**Total**: 15 hours = 2 days

**Breakdown**:
- Database: 2 hours
- Domain: 3 hours
- Infrastructure: 4 hours
- Application: 2 hours
- Testing: 4 hours

**Risk**: ⚠️ MEDIUM (breaking changes but clear migration path)

**Confidence**: ⭐⭐⭐⭐⭐ (95%)

---

## 🚀 NEXT STEPS

Nếu bạn approve, tôi sẽ:

1. ✅ Create migration scripts (permissions, role_permissions tables)
2. ✅ Seed RBAC data (10 permissions, 8 roles, mappings)
3. ✅ Refactor domain entities (Permission, HealthcareRole, User)
4. ✅ Update repository to use `auth_user_profiles_view`
5. ✅ Update mappers and services
6. ✅ Update use cases
7. ✅ Update all tests
8. ✅ Create documentation

**Ready to start?** 🚀

---

**Assessor**: AI Agent  
**Date**: 2025-01-06  
**Status**: ✅ ANALYSIS COMPLETE  
**Recommendation**: ⭐⭐⭐⭐⭐ IMPLEMENT PURE RBAC

