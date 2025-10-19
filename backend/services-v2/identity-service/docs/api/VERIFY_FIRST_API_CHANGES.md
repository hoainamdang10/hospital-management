# Verify-First Approach - API Changes Documentation

**Version**: 3.0.0  
**Date**: 2025-01-07  
**Status**: Production-Ready

## Overview

Identity Service đã được nâng cấp lên **Verify-First Approach** để ngăn chặn database pollution từ unverified users. Thay vì tạo user ngay lập tức, hệ thống lưu registration data tạm thời và chỉ tạo user SAU KHI email được verify.

## Breaking Changes

### 1. POST /auth/register

#### Response Changes

**OLD Response (v2.x)**:
```json
{
  "success": true,
  "userId": "uuid-here",
  "email": "user@example.com",
  "message": "Đăng ký thành công!",
  "requiresEmailVerification": true
}
```

**NEW Response (v3.0)**:
```json
{
  "success": true,
  "pendingRegistrationId": "uuid-here",
  "email": "user@example.com",
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. Link xác thực có hiệu lực trong 24 giờ.",
  "requiresEmailVerification": true
}
```

**Key Changes**:
- ✅ `userId` → `pendingRegistrationId` (user chưa được tạo)
- ✅ `requiresEmailVerification` luôn là `true`
- ✅ Message bao gồm thông tin về thời hạn 24 giờ

#### New Error Codes

| Error Code | HTTP Status | Description | Message |
|-----------|-------------|-------------|---------|
| `PENDING_REGISTRATION_EXISTS` | 400 | Email đã có pending registration chưa verify | "Email đã có đăng ký đang chờ xác thực. Vui lòng kiểm tra email hoặc đợi hết hạn để đăng ký lại." |
| `EMAIL_SENDING_FAILED` | 500 | Không thể gửi email verification | "Không thể gửi email xác thực. Vui lòng thử lại sau." |

**Existing Error Codes** (unchanged):
- `USER_ALREADY_EXISTS` - Email đã được đăng ký (user đã verify)
- `VALIDATION_ERROR` - Dữ liệu đầu vào không hợp lệ
- `REGISTRATION_FAILED` - Lỗi hệ thống

---

### 2. POST /auth/verify-email

#### Behavior Changes

**OLD Behavior (v2.x)**:
- Tìm user đã tồn tại
- Cập nhật `is_verified = true`
- Gửi welcome email

**NEW Behavior (v3.0)**:
- Tìm pending registration by token
- **TẠO USER MỚI** từ pending registration data
- Xóa pending registration
- Gửi welcome email

#### Response Changes

**Response Format** (unchanged):
```json
{
  "success": true,
  "userId": "uuid-here",
  "email": "user@example.com",
  "message": "Email đã được xác thực thành công! Tài khoản của bạn đã được tạo. Bạn có thể đăng nhập ngay bây giờ."
}
```

**Key Changes**:
- ✅ `userId` bây giờ là ID của user MỚI TẠO (không phải user đã tồn tại)
- ✅ Message nhấn mạnh "Tài khoản của bạn đã được tạo"

#### New Error Codes

| Error Code | HTTP Status | Description | Message |
|-----------|-------------|-------------|---------|
| `TOKEN_NOT_FOUND` | 404 | Pending registration không tồn tại | "Token xác thực không tồn tại hoặc đã hết hạn" |
| `TOKEN_EXPIRED` | 400 | Token đã hết hạn (>24h) | "Token xác thực đã hết hạn. Vui lòng đăng ký lại." |
| `TOKEN_ALREADY_USED` | 400 | Token đã được sử dụng | "Token xác thực đã được sử dụng" |

**Existing Error Codes** (unchanged):
- `INVALID_TOKEN` - Token format không hợp lệ
- `VERIFICATION_FAILED` - Lỗi hệ thống

---

## Database Changes

### New Table: `pending_registrations`

```sql
CREATE TABLE auth_schema.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  user_data JSONB NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Constraint: Only one active pending registration per email
  CONSTRAINT pending_registrations_email_active_unique 
    UNIQUE (email) WHERE (is_used = FALSE AND expires_at > NOW())
);
```

**Indexes**:
- `idx_pending_registrations_token` - Fast token lookup
- `idx_pending_registrations_email` - Fast email lookup
- `idx_pending_registrations_expires` - Cleanup expired records
- `idx_pending_registrations_active` - Find active pending registrations

**RLS Policies**:
- `service_role` - Full access
- `authenticated` - Read own pending registrations
- `anon` - No access

---

## Migration Guide

### For Frontend Developers

#### 1. Update Registration Response Handling

**OLD Code**:
```typescript
const response = await fetch('/auth/register', {
  method: 'POST',
  body: JSON.stringify(userData)
});

const data = await response.json();

if (data.success) {
  // Store userId
  localStorage.setItem('userId', data.userId);
  
  // Redirect to verification page
  router.push('/auth/verify-email');
}
```

**NEW Code**:
```typescript
const response = await fetch('/auth/register', {
  method: 'POST',
  body: JSON.stringify(userData)
});

const data = await response.json();

if (data.success) {
  // Store pendingRegistrationId (optional, for tracking)
  localStorage.setItem('pendingRegistrationId', data.pendingRegistrationId);
  
  // Show message about 24h expiry
  showNotification(data.message);
  
  // Redirect to verification page
  router.push('/auth/verify-email');
}
```

#### 2. Handle New Error Codes

```typescript
if (!data.success) {
  switch (data.error) {
    case 'PENDING_REGISTRATION_EXISTS':
      showError('Bạn đã đăng ký trước đó. Vui lòng kiểm tra email để xác thực.');
      break;
    
    case 'EMAIL_SENDING_FAILED':
      showError('Không thể gửi email xác thực. Vui lòng thử lại sau.');
      break;
    
    case 'USER_ALREADY_EXISTS':
      showError('Email đã được đăng ký. Vui lòng đăng nhập.');
      router.push('/auth/login');
      break;
    
    default:
      showError(data.message);
  }
}
```

#### 3. Update Verification Success Handling

**OLD Code**:
```typescript
// After verification
if (verifyData.success) {
  showSuccess('Email verified!');
  router.push('/auth/login');
}
```

**NEW Code**:
```typescript
// After verification
if (verifyData.success) {
  // User is NOW CREATED
  showSuccess('Tài khoản đã được tạo thành công! Bạn có thể đăng nhập ngay.');
  
  // Optionally auto-login or redirect to login
  router.push('/auth/login');
}
```

---

## Backward Compatibility

### Breaking Changes Summary

| Aspect | Impact | Migration Required |
|--------|--------|-------------------|
| Registration Response | ✅ Breaking | Update frontend to use `pendingRegistrationId` instead of `userId` |
| Verification Behavior | ⚠️ Behavioral | User created AFTER verification (not before) |
| Error Codes | ✅ Breaking | Handle new error codes: `PENDING_REGISTRATION_EXISTS`, `EMAIL_SENDING_FAILED` |
| Database Schema | ✅ Breaking | Run migration `009_create_pending_registrations_table.sql` |

### Non-Breaking Changes

- ✅ API endpoints unchanged (`/auth/register`, `/auth/verify-email`)
- ✅ Request formats unchanged
- ✅ HTTP status codes unchanged
- ✅ Authentication flow unchanged (JWT tokens)

---

## Testing Checklist

### Manual Testing

- [ ] Register new user → Check `pending_registrations` table
- [ ] Verify email → Check user created in `auth.users` and `user_profiles`
- [ ] Verify email → Check pending registration deleted
- [ ] Try to register with same email twice → Should fail with `PENDING_REGISTRATION_EXISTS`
- [ ] Wait 24h or manually expire token → Verify fails with `TOKEN_EXPIRED`
- [ ] Use same token twice → Second attempt fails with `TOKEN_ALREADY_USED`

### Automated Testing

```bash
# Run unit tests
npm test -- PendingRegistration.test.ts
npm test -- RegisterUserUseCase.verify-first.test.ts
npm test -- VerifyEmailUseCase.verify-first.test.ts

# Run integration tests
npm test -- verify-first-flow.integration.test.ts

# Run all tests with coverage
npm run test:coverage
```

---

## Rollback Plan

If issues arise, rollback to v2.x:

1. **Revert code changes**:
   ```bash
   git revert <commit-hash>
   ```

2. **Drop pending_registrations table**:
   ```sql
   DROP TABLE IF EXISTS auth_schema.pending_registrations CASCADE;
   ```

3. **Restart service**:
   ```bash
   npm run dev:stop
   npm run dev:core
   ```

**Note**: Any pending registrations will be lost during rollback.

---

## Support

For questions or issues:
- **Documentation**: `docs/api/IDENTITY_API_CONTRACT.md`
- **Runbook**: `docs/ops/IDENTITY_RUNBOOK.md`
- **Team**: Hospital Management System V2 Team

