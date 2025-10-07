# Option 1: Pure RBAC Implementation Plan

**Date**: 2025-01-06  
**Status**: 📋 PLANNING  
**Complexity**: ⚠️ HIGH  
**Estimated Time**: 3-4 days

---

## 📋 EXECUTIVE SUMMARY

Option 1 (Pure RBAC) là thiết kế RBAC chuẩn industry standard với database-driven permissions. Đây là thiết kế phức tạp nhất nhưng cũng flexible nhất.

**Key Changes**:
- ✅ Database schema: 5 tables (roles, permissions, user_roles, role_permissions, user_permissions)
- ✅ Domain model: Remove embedded permissions, add Permission entity
- ✅ Repository: Query database for permissions instead of hardcoded
- ✅ Application layer: Update use cases to handle multiple roles
- ✅ Migrations: Create new tables, seed data
- ✅ Tests: Update all tests

---

## 🗄️ PART 1: DATABASE SCHEMA CHANGES

### 1.1. New Tables

```sql
-- 1. Permissions table (master data)
CREATE TABLE auth_schema.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_name TEXT UNIQUE NOT NULL,  -- e.g., 'read:patients'
  resource_type TEXT NOT NULL,           -- e.g., 'patients'
  action TEXT NOT NULL,                  -- e.g., 'read'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Healthcare roles table (simplified)
CREATE TABLE auth_schema.healthcare_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name TEXT UNIQUE NOT NULL,        -- e.g., 'doctor'
  role_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User-Role assignments (many-to-many)
CREATE TABLE auth_schema.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_schema.user_profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES auth_schema.healthcare_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT,
  UNIQUE(user_id, role_id)
);

-- 4. Role-Permission mappings (many-to-many)
CREATE TABLE auth_schema.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES auth_schema.healthcare_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES auth_schema.permissions(id) ON DELETE CASCADE,
  conditions JSONB,  -- Optional: context-based conditions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 5. User-Permission overrides (many-to-many)
CREATE TABLE auth_schema.user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_schema.user_profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES auth_schema.permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by TEXT,
  expires_at TIMESTAMPTZ,  -- Optional: time-bound permissions
  UNIQUE(user_id, permission_id)
);

-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON auth_schema.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON auth_schema.user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON auth_schema.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON auth_schema.role_permissions(permission_id);
CREATE INDEX idx_user_permissions_user_id ON auth_schema.user_permissions(user_id);
```

### 1.2. Drop Old Columns

```sql
-- Remove role_type from user_profiles (no longer needed)
ALTER TABLE auth_schema.user_profiles DROP COLUMN IF EXISTS role_type;
```

### 1.3. Seed Data

```sql
-- Seed permissions
INSERT INTO auth_schema.permissions (permission_name, resource_type, action, description) VALUES
  ('*', '*', '*', 'All permissions (admin only)'),
  ('read:patients', 'patients', 'read', 'View patient records'),
  ('write:patients', 'patients', 'write', 'Create/update patient records'),
  ('delete:patients', 'patients', 'delete', 'Delete patient records'),
  ('read:medical_records', 'medical_records', 'read', 'View medical records'),
  ('write:medical_records', 'medical_records', 'write', 'Create/update medical records'),
  ('read:appointments', 'appointments', 'read', 'View appointments'),
  ('write:appointments', 'appointments', 'write', 'Create/update appointments'),
  ('read:prescriptions', 'prescriptions', 'read', 'View prescriptions'),
  ('write:prescriptions', 'prescriptions', 'write', 'Create/update prescriptions');

-- Seed roles
INSERT INTO auth_schema.healthcare_roles (role_name, role_description) VALUES
  ('admin', 'System administrator'),
  ('doctor', 'Medical doctor'),
  ('nurse', 'Registered nurse'),
  ('receptionist', 'Front desk receptionist'),
  ('pharmacist', 'Pharmacist'),
  ('lab_technician', 'Laboratory technician'),
  ('patient', 'Patient'),
  ('billing_staff', 'Billing staff');

-- Seed role-permission mappings
-- Admin: all permissions
INSERT INTO auth_schema.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth_schema.healthcare_roles r
CROSS JOIN auth_schema.permissions p
WHERE r.role_name = 'admin' AND p.permission_name = '*';

-- Doctor: read/write patients, medical records, prescriptions
INSERT INTO auth_schema.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth_schema.healthcare_roles r
CROSS JOIN auth_schema.permissions p
WHERE r.role_name = 'doctor' 
  AND p.permission_name IN (
    'read:patients', 'write:patients',
    'read:medical_records', 'write:medical_records',
    'read:prescriptions', 'write:prescriptions',
    'read:appointments'
  );

-- Nurse: read/write patients, medical records
INSERT INTO auth_schema.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth_schema.healthcare_roles r
CROSS JOIN auth_schema.permissions p
WHERE r.role_name = 'nurse' 
  AND p.permission_name IN (
    'read:patients', 'write:patients',
    'read:medical_records', 'write:medical_records',
    'read:appointments'
  );

-- Receptionist: read/write appointments, read patients
INSERT INTO auth_schema.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth_schema.healthcare_roles r
CROSS JOIN auth_schema.permissions p
WHERE r.role_name = 'receptionist' 
  AND p.permission_name IN (
    'read:patients',
    'read:appointments', 'write:appointments'
  );

-- Patient: read own records only (handled by application logic)
INSERT INTO auth_schema.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM auth_schema.healthcare_roles r
CROSS JOIN auth_schema.permissions p
WHERE r.role_name = 'patient' 
  AND p.permission_name IN (
    'read:patients',
    'read:medical_records',
    'read:appointments'
  );
```

---

## 🏗️ PART 2: DOMAIN MODEL CHANGES

### 2.1. New Permission Entity

**File**: `src/domain/entities/Permission.ts`

```typescript
export interface PermissionProps {
  name: string;           // e.g., 'read:patients'
  resourceType: string;   // e.g., 'patients'
  action: string;         // e.g., 'read'
  description?: string;
}

export class Permission {
  private constructor(private props: PermissionProps) {}

  static create(props: PermissionProps): Permission {
    return new Permission(props);
  }

  get name(): string {
    return this.props.name;
  }

  get resourceType(): string {
    return this.props.resourceType;
  }

  get action(): string {
    return this.props.action;
  }

  matches(resource: string, action: string): boolean {
    // Wildcard support
    if (this.props.name === '*') return true;
    if (this.props.resourceType === '*') return true;
    if (this.props.action === '*' && this.props.resourceType === resource) return true;

    return this.props.resourceType === resource && this.props.action === action;
  }
}
```

### 2.2. Update HealthcareRole Entity

**File**: `src/domain/entities/HealthcareRole.ts`

```typescript
// REMOVE embedded permissions
export interface HealthcareRoleProps {
  type: HealthcareRoleType;
  name: string;
  nameVietnamese: string;
  description: string;
  // ❌ REMOVE: permissions: string[];
  isActive: boolean;
  hasHIPAATraining: boolean;
}

export class HealthcareRole {
  // ... existing code ...

  // ❌ REMOVE: get permissions(): string[]
  // ❌ REMOVE: fromRoleType() factory method with hardcoded permissions
}
```

### 2.3. Update User Aggregate

**File**: `src/domain/aggregates/User.ts`

```typescript
export interface UserProps {
  // ... existing props ...
  // ❌ REMOVE: healthcareRole: HealthcareRole;
  // ✅ ADD: roles: HealthcareRole[];  // Multiple roles
}

export class User extends AggregateRoot<UserProps> {
  // ... existing code ...

  // ✅ ADD: Support multiple roles
  get roles(): HealthcareRole[] {
    return this.props.roles;
  }

  hasRole(roleType: HealthcareRoleType): boolean {
    return this.props.roles.some(r => r.type === roleType);
  }

  // ❌ REMOVE: get healthcareRole(): HealthcareRole
}
```

---

## 🔧 PART 3: REPOSITORY CHANGES

### 3.1. Update SupabaseUserRepository

**File**: `src/infrastructure/repositories/SupabaseUserRepository.ts`

```typescript
// ✅ UPDATE: getUserRoles() to query user_roles table
async getUserRoles(userId: UserId): Promise<string[]> {
  const { data, error } = await this.supabaseClient
    .from('user_roles')
    .select(`
      healthcare_roles (
        role_name
      )
    `)
    .eq('user_id', userId.value);

  if (error) throw new Error(`Failed to get user roles: ${error.message}`);

  return data?.map(r => r.healthcare_roles.role_name) || [];
}

// ✅ UPDATE: getUserPermissions() to query database
async getUserPermissions(userId: UserId): Promise<string[]> {
  const permissions = new Set<string>();

  // 1. Get permissions from roles
  const { data: rolePerms, error: roleError } = await this.supabaseClient
    .from('user_roles')
    .select(`
      healthcare_roles!inner (
        role_permissions!inner (
          permissions (
            permission_name
          )
        )
      )
    `)
    .eq('user_id', userId.value);

  if (roleError) throw new Error(`Failed to get role permissions: ${roleError.message}`);

  rolePerms?.forEach(r => {
    r.healthcare_roles.role_permissions.forEach(rp => {
      permissions.add(rp.permissions.permission_name);
    });
  });

  // 2. Get user-specific permission overrides
  const { data: userPerms, error: userError } = await this.supabaseClient
    .from('user_permissions')
    .select(`
      permissions (
        permission_name
      )
    `)
    .eq('user_id', userId.value)
    .or('expires_at.is.null,expires_at.gt.now()');  // Not expired

  if (userError) throw new Error(`Failed to get user permissions: ${userError.message}`);

  userPerms?.forEach(up => {
    permissions.add(up.permissions.permission_name);
  });

  return Array.from(permissions);
}

// ✅ ADD: New method to check permission
async hasPermission(userId: UserId, resource: string, action: string): Promise<boolean> {
  const permissions = await this.getUserPermissions(userId);

  // Check wildcard
  if (permissions.includes('*')) return true;

  // Check exact match
  const permissionName = `${action}:${resource}`;
  if (permissions.includes(permissionName)) return true;

  // Check resource wildcard
  if (permissions.includes(`*:${resource}`)) return true;

  return false;
}
```

---

## 📦 PART 4: APPLICATION LAYER CHANGES

### 4.1. Update Use Cases

**File**: `src/application/use-cases/RegisterUserUseCase.ts`

```typescript
// ✅ UPDATE: Assign default role(s) to new user
async execute(data: UserRegistrationData): Promise<UserRegistrationResult> {
  // ... existing code ...

  // Assign default role
  const defaultRoleId = await this.getDefaultRoleId(data.roleType);
  await this.assignRoleToUser(user.id, defaultRoleId);

  // ... existing code ...
}

private async getDefaultRoleId(roleType: string): Promise<string> {
  const { data, error } = await this.supabaseClient
    .from('healthcare_roles')
    .select('id')
    .eq('role_name', roleType.toLowerCase())
    .single();

  if (error) throw new Error(`Role not found: ${roleType}`);
  return data.id;
}

private async assignRoleToUser(userId: string, roleId: string): Promise<void> {
  const { error } = await this.supabaseClient
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleId,
      assigned_by: 'system'
    });

  if (error) throw new Error(`Failed to assign role: ${error.message}`);
}
```

---

## 🧪 PART 5: TESTING CHANGES

### 5.1. Update Unit Tests

**File**: `tests/unit/infrastructure/repositories/SupabaseUserRepository.test.ts`

```typescript
describe('getUserRoles', () => {
  it('should return multiple roles for user', async () => {
    // Mock Supabase response
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { healthcare_roles: { role_name: 'doctor' } },
            { healthcare_roles: { role_name: 'admin' } }
          ],
          error: null
        })
      })
    });

    const roles = await repository.getUserRoles(userId);

    expect(roles).toEqual(['doctor', 'admin']);
  });
});

describe('getUserPermissions', () => {
  it('should return permissions from roles and user overrides', async () => {
    // ... test implementation ...
  });
});

describe('hasPermission', () => {
  it('should return true for wildcard permission', async () => {
    // ... test implementation ...
  });

  it('should return true for exact permission match', async () => {
    // ... test implementation ...
  });
});
```

---

## 📝 PART 6: MIGRATION SCRIPTS

### 6.1. Create Migration

**File**: `migrations/002_implement_pure_rbac.sql`

```sql
-- See PART 1 for full SQL
```

### 6.2. Rollback Script

**File**: `migrations/002_implement_pure_rbac_rollback.sql`

```sql
-- Drop new tables
DROP TABLE IF EXISTS auth_schema.user_permissions;
DROP TABLE IF EXISTS auth_schema.role_permissions;
DROP TABLE IF EXISTS auth_schema.user_roles;
DROP TABLE IF EXISTS auth_schema.permissions;
DROP TABLE IF EXISTS auth_schema.healthcare_roles;

-- Restore role_type column
ALTER TABLE auth_schema.user_profiles 
ADD COLUMN role_type TEXT DEFAULT 'patient';
```

---

## 📊 SUMMARY OF CHANGES

### Database (5 tables)
- ✅ CREATE `permissions` table
- ✅ CREATE `healthcare_roles` table (simplified)
- ✅ CREATE `user_roles` table
- ✅ CREATE `role_permissions` table
- ✅ CREATE `user_permissions` table
- ✅ DROP `user_profiles.role_type` column
- ✅ SEED default permissions, roles, mappings

### Domain Layer (3 files)
- ✅ CREATE `Permission.ts` entity
- ✅ UPDATE `HealthcareRole.ts` (remove embedded permissions)
- ✅ UPDATE `User.ts` aggregate (support multiple roles)

### Infrastructure Layer (1 file)
- ✅ UPDATE `SupabaseUserRepository.ts`:
  - `getUserRoles()` - query `user_roles` table
  - `getUserPermissions()` - query database
  - `hasPermission()` - new method

### Application Layer (1+ files)
- ✅ UPDATE `RegisterUserUseCase.ts` (assign roles)
- ✅ UPDATE other use cases as needed

### Tests (3+ files)
- ✅ UPDATE `SupabaseUserRepository.test.ts`
- ✅ UPDATE integration tests
- ✅ CREATE new permission tests

---

## ⏱️ ESTIMATED EFFORT

| Task | Time | Complexity |
|------|------|------------|
| Database schema | 2 hours | Medium |
| Domain model | 3 hours | High |
| Repository | 4 hours | High |
| Application layer | 2 hours | Medium |
| Tests | 4 hours | High |
| Documentation | 1 hour | Low |
| **TOTAL** | **16 hours** | **HIGH** |

---

## ⚠️ RISKS & CHALLENGES

1. **Breaking Changes**: Major refactor, affects all layers
2. **Data Migration**: Need to migrate existing users to new schema
3. **Performance**: More complex queries, may need caching
4. **Testing**: Extensive testing required
5. **Learning Curve**: Team needs to understand new design

---

## ✅ BENEFITS

1. ✅ Industry standard RBAC
2. ✅ Fully database-driven
3. ✅ Supports multiple roles
4. ✅ Supports permission overrides
5. ✅ Highly flexible
6. ✅ No code changes for permission updates

---

**Next Steps**: Chờ feedback từ bạn để quyết định có implement Option 1 không.

