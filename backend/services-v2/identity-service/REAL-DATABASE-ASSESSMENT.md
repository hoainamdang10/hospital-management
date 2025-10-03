# 🔍 IDENTITY SERVICE - ĐÁNH GIÁ DỰA TRÊN DATABASE THỰC TẾ

**Ngày đánh giá:** 2025-01-XX  
**Database:** Supabase (ciasxktujslgsdgylimv)  
**Schema:** `auth_schema` + Supabase Auth (`auth.users`)

---

## 📊 1. DATABASE SCHEMA THỰC TẾ

### **1.1. Supabase Auth (`auth.users`)**

Hệ thống SỬ DỤNG Supabase Auth built-in cho authentication:

```sql
auth.users:
  - id (uuid, PK)
  - email (varchar)
  - encrypted_password (varchar) ✅ Password được lưu ở đây
  - email_confirmed_at (timestamptz)
  - confirmation_token (varchar)
  - recovery_token (varchar)
  - last_sign_in_at (timestamptz)
  - raw_app_meta_data (jsonb)
  - raw_user_meta_data (jsonb)
  - created_at (timestamptz)
```

### **1.2. Custom User Profiles (`auth_schema.user_profiles`)**

Extended user information:

```sql
auth_schema.user_profiles:
  - id (uuid, PK) → Links to auth.users.id
  - email (text, NOT NULL, UNIQUE)
  - username (text, nullable)
  - full_name (text, NOT NULL)
  - phone_number (varchar, nullable)
  - avatar_url (text, nullable)
  - role_type (text, NOT NULL) → 'admin', 'doctor', 'patient', 'receptionist'
  - is_active (boolean, default: true)
  - is_verified (boolean, default: false)
  - citizen_id (varchar(12), UNIQUE, nullable)
  - date_of_birth (date, nullable)
  - gender (text, nullable) → 'male', 'female', 'other'
  - address (text, nullable)
  - emergency_contact_name (text, nullable)
  - emergency_contact_phone (varchar, nullable)
  - subscription_tier (text, default: 'free')
  - subscription_expires_at (timestamptz, nullable)
  - created_at (timestamptz, default: now())
  - updated_at (timestamptz, default: now())
  - created_by (uuid, nullable)
  - updated_by (uuid, nullable)
```

### **1.3. User Sessions (`auth_schema.user_sessions`)**

Custom session management:

```sql
auth_schema.user_sessions:
  - id (uuid, PK)
  - user_id (uuid, NOT NULL, FK → user_profiles.id)
  - session_token (text, NOT NULL, UNIQUE)
  - device_info (jsonb, default: '{}')
  - ip_address (inet, nullable)
  - user_agent (text, nullable)
  - expires_at (timestamptz, NOT NULL)
  - is_active (boolean, default: true)
  - created_at (timestamptz, default: now())
  - last_accessed_at (timestamptz, default: now())
```

### **1.4. Supporting Tables**

```sql
auth_schema.healthcare_roles - Role definitions
auth_schema.role_permissions - Granular permissions
auth_schema.password_reset_tokens - Password recovery
auth_schema.two_factor_auth - MFA settings
auth_schema.two_factor_attempts - MFA audit log
auth_schema.login_attempts - Login security tracking
auth_schema.audit_logs - HIPAA audit trail
auth_schema.phi_access_log - PHI access tracking
auth_schema.security_events - Security monitoring
auth_schema.admins - Admin-specific data
```

---

## ⚠️ 2. VẤN ĐỀ NGHIÊM TRỌNG TRONG CODE

### **2.1. Password Hash Field KHÔNG TỒN TẠI**

**Code hiện tại:**
```typescript
// User.ts - Line 15
interface UserProps {
  passwordHash: string; // ❌ Field này KHÔNG có trong database
}
```

**Database thực tế:**
- `auth_schema.user_profiles` KHÔNG có field `password_hash`
- Password được lưu trong `auth.users.encrypted_password` (Supabase Auth)

**Giải pháp:**
- Phải dùng Supabase Auth API để authenticate
- KHÔNG thể tự implement password verification
- Xóa `passwordHash` khỏi User aggregate

### **2.2. Schema Configuration SAI**

**Code hiện tại:**
```typescript
// SupabaseUserRepository.ts
const supabaseClient = createClient(url, key, {
  db: { schema: 'public' } // ❌ SAI - Nên là 'auth_schema'
});
```

**Đúng:**
```typescript
const supabaseClient = createClient(url, key, {
  db: { schema: 'auth_schema' }
});
```

### **2.3. Missing Fields trong Code**

**Database có nhưng code KHÔNG dùng:**
- `username` (text)
- `avatar_url` (text)
- `subscription_tier` (text)
- `subscription_expires_at` (timestamptz)
- `created_by` (uuid)
- `updated_by` (uuid)

**Code có nhưng database KHÔNG có:**
- `passwordHash` (CRITICAL)

---

## ✅ 3. KIẾN TRÚC ĐÚNG

### **3.1. Authentication Flow**

```
User Login Request
    ↓
Identity Service
    ↓
Supabase Auth API (signInWithPassword)
    ↓
auth.users.encrypted_password verification
    ↓
Return JWT token + user data
    ↓
Create session in auth_schema.user_sessions
    ↓
Return to client
```

### **3.2. User Registration Flow**

```
User Register Request
    ↓
Identity Service
    ↓
Supabase Auth API (signUp)
    ↓
Create auth.users record with encrypted_password
    ↓
Create auth_schema.user_profiles record
    ↓
Send verification email
    ↓
Return to client
```

---

## 🔧 4. ACTIONS CẦN THỰC HIỆN

### **Priority 1: Fix Critical Issues**

1. **Xóa `passwordHash` khỏi User aggregate**
   - File: `src/domain/aggregates/User.ts`
   - Xóa field `passwordHash` khỏi `UserProps`
   - Xóa password verification logic

2. **Implement Supabase Auth Integration**
   - Tạo `SupabaseAuthService` wrapper
   - Dùng `supabase.auth.signInWithPassword()`
   - Dùng `supabase.auth.signUp()`
   - Dùng `supabase.auth.resetPasswordForEmail()`

3. **Fix Schema Configuration**
   - Sửa `schema: 'public'` → `schema: 'auth_schema'`
   - File: `src/infrastructure/repositories/SupabaseUserRepository.ts`

### **Priority 2: Complete Missing Features**

4. **User Registration**
   - Tạo `RegisterUserUseCase`
   - Endpoint: `POST /auth/register`
   - Integrate với Supabase Auth

5. **Password Reset**
   - Tạo `ForgotPasswordUseCase`
   - Tạo `ResetPasswordUseCase`
   - Endpoints: `/auth/forgot-password`, `/auth/reset-password`

6. **Email Verification**
   - Tạo `VerifyEmailUseCase`
   - Endpoint: `POST /auth/verify-email`

### **Priority 3: Add Missing Fields**

7. **Update User Aggregate**
   - Thêm `username`, `avatarUrl`, `subscriptionTier`, `subscriptionExpiresAt`
   - Thêm `createdBy`, `updatedBy` cho audit trail

---

## 📋 5. CHECKLIST HOÀN THIỆN

### **Domain Layer**
- [ ] Xóa `passwordHash` khỏi User aggregate
- [ ] Thêm missing fields (username, avatarUrl, subscription)
- [ ] Tạo Value Objects còn thiếu (UserId, PersonalInfo, HealthcareRole)
- [ ] Tạo Domain Events (UserCreatedEvent, UserAuthenticatedEvent, etc.)

### **Application Layer**
- [ ] RegisterUserUseCase
- [ ] ForgotPasswordUseCase
- [ ] ResetPasswordUseCase
- [ ] VerifyEmailUseCase
- [ ] RefreshTokenUseCase

### **Infrastructure Layer**
- [ ] SupabaseAuthService (wrapper cho Supabase Auth API)
- [ ] Fix schema configuration
- [ ] Implement JWT token handling
- [ ] Implement MFA/2FA logic

### **Presentation Layer**
- [ ] Tách controllers ra khỏi main.ts
- [ ] Tạo DTOs cho request/response validation
- [ ] Tạo middleware cho authentication
- [ ] Add endpoints còn thiếu

---

## 🎯 6. KẾT LUẬN

**Tình trạng hiện tại:**
- ❌ Code KHÔNG khớp với database thực tế
- ❌ Thiếu integration với Supabase Auth
- ❌ Thiếu nhiều features cơ bản (register, password reset, email verification)
- ✅ Infrastructure patterns tốt (Circuit Breaker, Graceful Degradation)
- ✅ Database schema đầy đủ và chuẩn

**Ước tính công việc:**
- **Critical Fixes:** 2-3 ngày
- **Missing Features:** 3-4 ngày
- **Testing & Documentation:** 1-2 ngày
- **Tổng:** ~1 tuần

**Khuyến nghị:**
1. Ưu tiên fix critical issues trước (passwordHash, Supabase Auth)
2. Implement user registration ngay sau đó
3. Hoàn thiện password reset và email verification
4. Cuối cùng mới refactor presentation layer

---

**Người đánh giá:** AI Assistant  
**Trạng thái:** ⚠️ NEEDS MAJOR REFACTORING  
**Next Steps:** Xem section 4 - ACTIONS CẦN THỰC HIỆN

