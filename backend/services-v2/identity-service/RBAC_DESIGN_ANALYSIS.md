# RBAC Design Analysis - Identity Service

**Date**: 2025-01-06  
**Status**: ⚠️ **DESIGN MISMATCH DETECTED**  
**Version**: 2.0.0

---

## 📋 EXECUTIVE SUMMARY

Phát hiện **mismatch nghiêm trọng** giữa Domain Model và Database Schema trong RBAC system. Code domain model sử dụng `HealthcareRole` entity với permissions embedded, nhưng database có cấu trúc RBAC phức tạp hơn với nhiều junction tables.

---

## 🔍 CURRENT STATE ANALYSIS

### 1. Domain Model (Code)

**File**: `src/domain/entities/HealthcareRole.ts`

**Design**: **Embedded Permissions Pattern**

```typescript
interface HealthcareRoleProps {
  type: HealthcareRoleType;  // ADMIN, DOCTOR, PATIENT, etc.
  name: string;
  nameVietnamese: string;
  description: string;
  permissions: string[];     // ✅ Permissions embedded in role
  isActive: boolean;
  hasHIPAATraining: boolean;
}
```

**Characteristics**:
- ✅ Simple, flat structure
- ✅ Permissions hardcoded in code (lines 56-113)
- ✅ Fast permission checks (in-memory)
- ❌ Cannot modify permissions without code changes
- ❌ No database-driven RBAC

**Example**:
```typescript
'ADMIN': {
  permissions: ['*'],  // All permissions
  hipaa: true
},
'DOCTOR': {
  permissions: ['read:patients', 'write:patients', 'read:medical_records'],
  hipaa: true
}
```

---

### 2. Database Schema

**Design**: **Relational RBAC with Junction Tables**

**Tables**:
1. `healthcare_roles` - Role definitions (master data)
2. `user_roles` - User → Role assignments (many-to-many)
3. `user_permissions` - User → Permission overrides (many-to-many)
4. `role_permissions` - Role → Permission mappings (many-to-many)

**Characteristics**:
- ✅ Flexible, database-driven
- ✅ Can modify permissions without code changes
- ✅ Supports permission overrides per user
- ✅ Granular control with conditions (JSONB)
- ❌ More complex queries
- ❌ Requires proper data seeding

---

### 3. Repository Implementation

**File**: `src/infrastructure/repositories/SupabaseUserRepository.ts`

**Method**: `getUserRoles(userId)` (lines 552-595)

**Current Implementation**:
```typescript
async getUserRoles(userId: UserId): Promise<string[]> {
  // Query user_profiles.role_type (single role)
  const { data } = await this.supabaseClient
    .from('user_profiles')
    .select('role_type')
    .eq('id', id)
    .single();
  
  // Return single role as array
  return data ? [data.role_type] : [];
}
```

**Issues**:
- ❌ Only queries `user_profiles.role_type` (single role)
- ❌ Does NOT query `user_roles` table (many-to-many)
- ❌ Ignores `healthcare_roles` table
- ❌ Ignores `role_permissions` table
- ❌ Cannot support multiple roles per user

---

### 4. Permission Resolution

**Method**: `getUserPermissions(userId)` (lines 903-918)

**Current Implementation**:
```typescript
async getUserPermissions(userId: UserId): Promise<string[]> {
  const roles = await this.getUserRoles(userId);
  
  // Hardcoded permission mapping
  roles.forEach(role => {
    if (role === 'admin') {
      permissions.push('*');
    } else if (role === 'doctor') {
      permissions.push('read_patients', 'write_patients');
    }
  });
  
  return permissions;
}
```

**Issues**:
- ❌ Permissions hardcoded in repository (should be in domain)
- ❌ Does NOT query `role_permissions` table
- ❌ Does NOT query `user_permissions` table (overrides)
- ❌ Duplicates logic from `HealthcareRole` entity

---

## ⚠️ DESIGN MISMATCH PROBLEMS

### Problem 1: Dual Permission Sources

**Code Domain Model**:
```typescript
// Permissions defined in code
HealthcareRole.fromRoleType('DOCTOR')
  .permissions = ['read:patients', 'write:patients']
```

**Database Schema**:
```sql
-- Permissions defined in database
SELECT permission_name, actions 
FROM role_permissions 
WHERE role_id = 'doctor_role_id'
```

**Impact**: 
- ⚠️ Two sources of truth
- ⚠️ Inconsistency risk
- ⚠️ Maintenance nightmare

---

### Problem 2: Unused Database Tables

**Tables Created But Not Used**:
- ❌ `user_roles` - Empty, not queried
- ❌ `role_permissions` - Empty, not queried
- ❌ `user_permissions` - Empty, not queried

**Impact**:
- ⚠️ Wasted database resources
- ⚠️ Confusing schema
- ⚠️ False expectations

---

### Problem 3: Single Role Limitation

**Current**: User can only have ONE role (from `user_profiles.role_type`)

**Database Supports**: User can have MULTIPLE roles (via `user_roles` table)

**Impact**:
- ❌ Cannot assign multiple roles to user
- ❌ Cannot implement role hierarchies
- ❌ Limited flexibility

---

## 🎯 RECOMMENDED SOLUTIONS

### Option A: Simplify Database (Align with Code)

**Action**: Remove unused tables, use embedded permissions

**Changes**:
1. ✅ Keep `healthcare_roles` table (master data)
2. ✅ Keep `user_profiles.role_type` (single role)
3. ❌ Drop `user_roles` table (not used)
4. ❌ Drop `role_permissions` table (not used)
5. ❌ Drop `user_permissions` table (not used)
6. ✅ Store permissions in `healthcare_roles.permissions` (JSONB)

**Pros**:
- ✅ Simple, matches code
- ✅ Fast queries
- ✅ Easy to understand

**Cons**:
- ❌ Less flexible
- ❌ Requires code changes for permission updates
- ❌ Cannot support multiple roles

---

### Option B: Enhance Code (Align with Database)

**Action**: Implement full RBAC system in code

**Changes**:
1. ✅ Update `getUserRoles()` to query `user_roles` table
2. ✅ Update `getUserPermissions()` to query `role_permissions` table
3. ✅ Support `user_permissions` table for overrides
4. ✅ Remove hardcoded permissions from `HealthcareRole` entity
5. ✅ Seed `role_permissions` table with default permissions

**Pros**:
- ✅ Flexible, database-driven
- ✅ Supports multiple roles
- ✅ Supports permission overrides
- ✅ No code changes for permission updates

**Cons**:
- ❌ More complex queries
- ❌ Requires data seeding
- ❌ More code changes

---

### Option C: Hybrid Approach (Recommended)

**Action**: Use database for role assignments, code for permission definitions

**Changes**:
1. ✅ Keep `healthcare_roles` table with embedded permissions (JSONB)
2. ✅ Use `user_roles` table for role assignments (many-to-many)
3. ✅ Update `getUserRoles()` to query `user_roles` table
4. ✅ Keep permission logic in `HealthcareRole` entity (domain)
5. ❌ Drop `role_permissions` table (redundant)
6. ✅ Keep `user_permissions` table for overrides (optional)

**Pros**:
- ✅ Balanced complexity
- ✅ Supports multiple roles
- ✅ Fast permission checks (in-memory)
- ✅ Flexible role assignments

**Cons**:
- ⚠️ Still requires code changes for permission updates
- ⚠️ Hybrid approach may confuse developers

---

## 📊 COMPARISON TABLE

| Feature | Option A (Simple) | Option B (Full RBAC) | Option C (Hybrid) |
|---------|-------------------|----------------------|-------------------|
| Multiple Roles | ❌ No | ✅ Yes | ✅ Yes |
| Permission Overrides | ❌ No | ✅ Yes | ✅ Yes (optional) |
| Database-Driven | ❌ No | ✅ Yes | ⚠️ Partial |
| Code Changes for Permissions | ✅ Required | ❌ Not Required | ✅ Required |
| Query Complexity | ✅ Simple | ❌ Complex | ⚠️ Medium |
| Maintenance | ✅ Easy | ❌ Hard | ⚠️ Medium |
| Flexibility | ❌ Low | ✅ High | ⚠️ Medium |

---

## 🤔 RECOMMENDATION

### **Choose Option C (Hybrid Approach)**

**Rationale**:
1. ✅ Balances simplicity and flexibility
2. ✅ Supports multiple roles (future-proof)
3. ✅ Keeps permission logic in domain (Clean Architecture)
4. ✅ Minimal code changes required
5. ✅ Aligns with current code structure

**Implementation Steps**:
1. Update `getUserRoles()` to query `user_roles` table
2. Seed `user_roles` table with test data
3. Keep `HealthcareRole` entity with embedded permissions
4. Drop `role_permissions` table (redundant)
5. Keep `user_permissions` table for future use

---

## 📝 NEXT ACTIONS

### Immediate (Required)
1. ⚠️ **Decide on Option A, B, or C**
2. ⚠️ Update `getUserRoles()` implementation
3. ⚠️ Seed `user_roles` table with test data
4. ⚠️ Update integration tests

### Future (Optional)
1. 🔄 Implement permission caching
2. 🔄 Add permission audit logging
3. 🔄 Support dynamic permission updates

---

**Author**: Hospital Management Team  
**Version**: 2.0.0  
**Status**: ⚠️ AWAITING DECISION

