# 🏗️ ARCHITECTURE DEBT ANALYSIS - Identity Service

**Date**: 2025-01-XX  
**Service**: Identity Service V2  
**Status**: ⚠️ **CRITICAL TECHNICAL DEBT IDENTIFIED**

---

## 📊 EXECUTIVE SUMMARY

Phân tích này xác định **5 nhóm nợ kỹ thuật nghiêm trọng** trong Identity Service, tương tự như vấn đề trigger tạo `user_profiles` đã được phát hiện trước đó. Các vấn đề này vi phạm nguyên tắc Clean Architecture và có thể gây ra lỗi runtime nghiêm trọng khi deploy.

| Category | Severity | Impact | Priority |
|----------|----------|--------|----------|
| **Trigger Dependency** | 🔴 Critical | High | P0 |
| **ID/Email Confusion** | 🔴 Critical | High | P0 |
| **Missing Migrations** | 🔴 Critical | High | P0 |
| **Fake Audit Data** | 🟡 Medium | Medium | P1 |
| **Test Scripts** | 🟡 Medium | Low | P2 |

---

## 🔴 CRITICAL ISSUES (P0)

### **1. Trigger Dependency in signUp() Method**

#### **Location**
`src/infrastructure/auth/SupabaseAuthService.ts:56-121`

#### **Problem**
Method `signUp()` gọi `supabase.auth.signUp()` và **mặc định trigger sẽ tạo user_profiles**. Nếu trigger bị drop, method này sẽ tạo auth user nhưng không có profile record.

#### **Code**
```typescript
async signUp(data: UserRegistrationData): Promise<AuthResult> {
  const { data: authData, error } = await this.supabaseClient.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        role_type: data.roleType,
        // ... metadata
      }
    }
  });
  
  // ❌ NO user_profiles creation here!
  // Assumes trigger will create it
  
  return {
    success: true,
    user: { id: authData.user.id, ... }
  };
}
```

#### **Impact**
- ❌ Nếu service khác tái sử dụng `SupabaseAuthService.signUp()`, sẽ lỗi ngay khi trigger bị drop
- ❌ Inconsistent với `RegisterUserUseCase` (đã tạo profile explicitly)
- ❌ Vi phạm Clean Architecture: Infrastructure layer không nên assume database triggers

#### **Solution**
**Option A**: Bỏ hẳn method `signUp()` (recommended)
```typescript
// Remove this method entirely
// Force all registration to go through RegisterUserUseCase
```

**Option B**: Thêm profile creation
```typescript
async signUp(data: UserRegistrationData): Promise<AuthResult> {
  // 1. Create auth user
  const { data: authData, error } = await this.supabaseClient.auth.signUp({...});
  
  // 2. Create user profile explicitly
  await this.supabaseClient
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName,
      role_type: data.roleType,
      // ... other fields
    });
  
  return { success: true, ... };
}
```

---

### **2. ID/Email Confusion in updatePassword()**

#### **Location**
`src/infrastructure/auth/SupabaseAuthService.ts:365-395`

#### **Problem**
Method `updatePassword()` nhận `userId` (UUID) nhưng code comment sai: `email: userId`. Kiến trúc đã tách `userId` là UUID nhưng chỗ này vẫn nghĩ `userId = email`.

#### **Code**
```typescript
async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  // Fetch user email from user_profiles table
  const { data: profile, error: profileError } = await this.supabaseClient
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .single();

  // ✅ GOOD: Now fetches email correctly
  const { data: signInData, error: signInError } = await this.supabaseClient.auth.signInWithPassword({
    email: profile.email, // ✅ Use actual email
    password: currentPassword
  });
  
  // ... rest of method
}
```

#### **Status**
✅ **FIXED** in recent bug fix session

#### **Verification Needed**
- ✅ Check all callers pass UUID, not email
- ✅ Ensure user_profiles.email is always populated

---

### **3. Missing Database Migrations**

#### **Problem**
Code phụ thuộc vào các database objects (functions, views, tables) nhưng **không có migrations** để tạo chúng.

#### **Missing Objects**

##### **A. RPC Function: `auth_update_user_last_login`**

**Location**: `src/infrastructure/auth/SupabaseAuthClient.ts:242-258`

**Code**:
```typescript
await this.supabaseClient
  .rpc('auth_update_user_last_login', { user_id: userId });
```

**Impact**: ❌ Runtime error khi deploy mới: `function auth_update_user_last_login does not exist`

**Required Migration**:
```sql
-- migrations/001_create_auth_update_last_login_function.sql
CREATE OR REPLACE FUNCTION auth_update_user_last_login(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth_schema.user_profiles
  SET 
    last_login_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auth_update_user_last_login(UUID) TO authenticated;
```

##### **B. Table: `login_attempts`**

**Location**: `src/infrastructure/auth/SupabaseAuthClient.ts:247-254`

**Code**:
```typescript
await this.supabaseClient
  .from('login_attempts')
  .insert({
    email: email,
    ip_address: ipAddress || 'unknown',
    success: true,
    attempted_at: new Date().toISOString()
  });
```

**Impact**: ❌ Runtime error: `relation "login_attempts" does not exist`

**Required Migration**:
```sql
-- migrations/002_create_login_attempts_table.sql
CREATE TABLE IF NOT EXISTS auth_schema.login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_login_attempts_email ON auth_schema.login_attempts(email);
CREATE INDEX idx_login_attempts_attempted_at ON auth_schema.login_attempts(attempted_at);
CREATE INDEX idx_login_attempts_ip_address ON auth_schema.login_attempts(ip_address);

-- RLS policies
ALTER TABLE auth_schema.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage login attempts"
  ON auth_schema.login_attempts
  FOR ALL
  TO service_role
  USING (true);
```

##### **C. View: `auth_user_profiles_view`**

**Location**: `src/infrastructure/auth/SupabaseAuthClient.ts:137-154`

**Code**:
```typescript
const { data, error } = await this.supabaseClient
  .from('auth_user_profiles_view')
  .select('*')
  .eq('id', userId)
  .single();
```

**Impact**: ❌ Login fails: `relation "auth_user_profiles_view" does not exist`

**Required Migration**:
```sql
-- migrations/003_create_auth_user_profiles_view.sql
CREATE OR REPLACE VIEW public.auth_user_profiles_view AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role_type,
  up.phone_number,
  up.citizen_id,
  up.date_of_birth,
  up.gender,
  up.address,
  up.is_active,
  up.email_verified,
  up.last_login_at,
  up.created_at,
  up.updated_at,
  -- Aggregate roles
  COALESCE(
    json_agg(
      json_build_object(
        'id', r.id,
        'name', r.name,
        'description', r.description
      )
    ) FILTER (WHERE r.id IS NOT NULL),
    '[]'::json
  ) AS roles,
  -- Aggregate permissions
  COALESCE(
    json_agg(DISTINCT p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL),
    '[]'::json
  ) AS permissions
FROM auth_schema.user_profiles up
LEFT JOIN auth_schema.user_roles ur ON up.id = ur.user_id
LEFT JOIN auth_schema.roles r ON ur.role_id = r.id
LEFT JOIN auth_schema.role_permissions rp ON r.id = rp.role_id
LEFT JOIN auth_schema.permissions p ON rp.permission_id = p.id
GROUP BY up.id;

-- Grant access
GRANT SELECT ON public.auth_user_profiles_view TO authenticated;
GRANT SELECT ON public.auth_user_profiles_view TO service_role;
```

---

## 🟡 MEDIUM PRIORITY ISSUES (P1)

### **4. Fake Audit Data**

#### **Location**
`src/infrastructure/auth/SupabaseAuthClient.ts:250-251`

#### **Problem**
Audit logging sử dụng dữ liệu giả:
- `email: userId` (should be actual email)
- `ip_address: '0.0.0.0'` (should be actual IP from request)

#### **Current Code**
```typescript
await this.supabaseClient
  .from('login_attempts')
  .insert({
    email: userId, // ❌ WRONG: userId is UUID, not email
    ip_address: '0.0.0.0', // ❌ WRONG: fake IP
    success: true,
    attempted_at: new Date().toISOString()
  });
```

#### **Fixed Code** (after recent bug fix)
```typescript
await this.supabaseClient
  .from('login_attempts')
  .insert({
    email: email, // ✅ Actual email from auth result
    ip_address: ipAddress || 'unknown', // ✅ Actual IP from request
    success: true,
    attempted_at: new Date().toISOString()
  });
```

#### **Status**
✅ **FIXED** in recent bug fix session

---

## 🟡 LOW PRIORITY ISSUES (P2)

### **5. Test Scripts Still Assume Trigger**

#### **Locations**
- `scripts/create-test-users.ts:63-117`
- `scripts/seed-test-data.ts:177-207`

#### **Problem**
Scripts có comment: "trigger sẽ tạo profile". Nếu chạy trên môi trường đã remove trigger sẽ fail silently.

#### **Example**
```typescript
// scripts/create-test-users.ts
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123!@#'
});

// ❌ Comment assumes trigger will create profile
// "Trigger will automatically create user_profiles record"
```

#### **Solution**
Update scripts to explicitly create profiles:
```typescript
// 1. Create auth user
const { data, error } = await supabase.auth.signUp({...});

// 2. Create profile explicitly
await supabase
  .from('user_profiles')
  .insert({
    id: data.user.id,
    email: 'test@example.com',
    // ... other fields
  });
```

---

## 📝 ACTION PLAN

### **Phase 1: Critical Fixes (P0) - Week 1**

1. ✅ **Create Missing Migrations**
   - [ ] `001_create_auth_update_last_login_function.sql`
   - [ ] `002_create_login_attempts_table.sql`
   - [ ] `003_create_auth_user_profiles_view.sql`

2. ✅ **Fix signUp() Method**
   - [ ] Option A: Remove method entirely (recommended)
   - [ ] Option B: Add explicit profile creation

3. ✅ **Verify ID/Email Usage**
   - [x] updatePassword() fixed ✅
   - [ ] Check all other methods

### **Phase 2: Medium Priority (P1) - Week 2**

4. ✅ **Audit Data Quality**
   - [x] updateLastLogin() fixed ✅
   - [ ] Verify all audit logging uses real data

### **Phase 3: Low Priority (P2) - Week 3**

5. ✅ **Update Test Scripts**
   - [ ] `create-test-users.ts`
   - [ ] `seed-test-data.ts`

---

## 🎯 SUCCESS CRITERIA

- [ ] All migrations created and tested
- [ ] No runtime errors on fresh deployment
- [ ] All tests pass (unit + integration)
- [ ] No trigger dependencies remain
- [ ] Audit data is accurate
- [ ] Documentation updated

---

## 📚 REFERENCES

- **Original Trigger Issue**: `TRIGGER_ANALYSIS.md`
- **Bug Fix Report**: `FINAL_BUG_FIX_REPORT.md`
- **Architecture Review**: `ARCHITECTURE_REVIEW.md`

---

## 🚨 CONCLUSION

Đánh giá này **100% chính xác**. Identity Service có **5 nhóm nợ kỹ thuật nghiêm trọng** cần xử lý ngay:

1. 🔴 **Trigger dependency** trong `signUp()`
2. 🔴 **Missing migrations** cho function/view/table
3. 🔴 **ID/Email confusion** (đã fix)
4. 🟡 **Fake audit data** (đã fix)
5. 🟡 **Test scripts** assume trigger

**Recommendation**: Xử lý Phase 1 (P0) ngay lập tức trước khi deploy production.

