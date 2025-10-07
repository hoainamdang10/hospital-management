# Identity Service - Improvement Recommendations Assessment

**Date**: 2025-01-06  
**Assessor**: AI Agent  
**Status**: Comprehensive Review

---

## 📊 Executive Summary

Đánh giá 7 nhóm đề xuất cải tiến cho Identity Service. Tất cả đề xuất đều **khả thi** và **cần thiết** để đưa service về production-ready state.

**Priority Breakdown**:
- **P0 (Critical)**: 8 items - Must implement before production
- **P1 (High)**: 6 items - Should implement soon
- **P2 (Medium)**: 3 items - Nice to have

---

## 1. API & Luồng Xác Thực

### 1.1. Token Refresh Endpoint ✅ P0 - CRITICAL

**Đề xuất**:
> Thêm endpoint `/auth/refresh` trên `identity-service/src/main.ts` để gọi `SupabaseAuthService.refreshSession()` thay vì bỏ trống; cập nhật client + tests.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ `SupabaseAuthService.refreshSession()` đã có implementation (line 253)
- ✅ Supabase Auth API hỗ trợ refresh token
- ✅ Cần thiết để users không phải re-login khi access token expires (15 min)

**Implementation Plan**:
1. Add endpoint `POST /auth/refresh` in `main.ts`
2. Create `RefreshTokenUseCase` in `application/use-cases/`
3. Call `SupabaseAuthService.refreshSession(refreshToken)`
4. Return new access token + refresh token
5. Add integration tests

**Estimated Effort**: 2-3 hours

**Priority**: P0 - Critical (users cannot stay logged in without this)

---

### 1.2. Login Attempt Tracking & Account Lockout ✅ P0 - CRITICAL

**Đề xuất**:
> Kết nối `AuthenticateUserUseCase` với `SupabaseUserRepository.recordLoginAttempt` và `checkAccountLockout` nhằm ghi nhận thất bại/thành công, khóa tài khoản sau nhiều lần sai; đồng bộ tên cột giữa `login_attempts.success` và `is_successful` trong repository.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ `recordLoginAttempt()` đã có implementation (line 821)
- ✅ `checkAccountLockout()` đã có implementation (line 778)
- ✅ Table `login_attempts` đã tồn tại
- ⚠️ Column name inconsistency: `success` vs `is_successful` cần fix

**Implementation Plan**:
1. Fix column name: Standardize to `is_successful` in database
2. Update `AuthenticateUserUseCase.execute()`:
   - Call `checkAccountLockout()` before authentication
   - Call `recordLoginAttempt(success=false)` on failure
   - Call `recordLoginAttempt(success=true)` on success
3. Implement auto-lockout after 5 failed attempts
4. Add tests for lockout mechanism

**Estimated Effort**: 3-4 hours

**Priority**: P0 - Critical (security requirement)

---

### 1.3. Admin Management Endpoints ✅ P1 - HIGH

**Đề xuất**:
> Bổ sung route/command admin để khóa, mở khóa, reset MFA, resend verify, assign/revoke role — hiện `main.ts` chỉ có invalidate cache. Đi kèm middleware kiểm tra quyền.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ Repository methods đã có: `assignRole()`, `revokeRole()`
- ✅ `PermissionMiddleware.requireAdmin()` đã có
- ✅ Cần thiết cho admin operations

**Missing Endpoints**:
1. `POST /admin/users/:userId/lock` - Lock account
2. `POST /admin/users/:userId/unlock` - Unlock account
3. `POST /admin/users/:userId/reset-mfa` - Reset MFA
4. `POST /admin/users/:userId/resend-verification` - Resend verification email
5. `POST /admin/users/:userId/roles` - Assign role
6. `DELETE /admin/users/:userId/roles/:roleName` - Revoke role

**Implementation Plan**:
1. Create use cases: `LockAccountUseCase`, `UnlockAccountUseCase`, etc.
2. Add endpoints in `main.ts` with `requireAdmin()` middleware
3. Publish domain events: `UserAccountLocked`, `UserAccountUnlocked`, etc.
4. Add integration tests

**Estimated Effort**: 6-8 hours

**Priority**: P1 - High (admin needs these tools)

---

## 2. Quản Lý User Types & Đăng Ký

### 2.1. Restrict Self-Registration to Patients ✅ P0 - CRITICAL

**Đề xuất**:
> Giữ `POST /auth/register` ở phạm vi self-service bệnh nhân: cố định `roleType = patient`, yêu cầu OTP/email trước khi kích hoạt; không cho client truyền tùy ý.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ Security best practice: Users cannot self-assign staff roles
- ✅ Aligns with role boundaries document
- ✅ Easy to implement

**Current Issue**:
```typescript
// main.ts:481 - Currently accepts any roleType from client
const request = {
  roleType: req.body.roleType, // ❌ Security risk!
};
```

**Implementation Plan**:
1. Update `POST /auth/register` to force `roleType = 'PATIENT'`
2. Remove `roleType` from request body
3. Add email verification requirement
4. Update tests

**Estimated Effort**: 1-2 hours

**Priority**: P0 - Critical (security vulnerability)

---

### 2.2. Admin Staff Provisioning Endpoint ✅ P0 - CRITICAL

**Đề xuất**:
> Tạo endpoint riêng cho Admin provisioning staff: sử dụng `SupabaseUserRepository.createAuthUser()` nhưng yêu cầu quyền cao, phát invitation token. Luồng này phải phù hợp research user types.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ `createAuthUser()` đã có implementation (line 263)
- ✅ Aligns with HMS research report (line 20)
- ✅ Cần thiết để admin tạo staff accounts

**Implementation Plan**:
1. Create `POST /admin/staff/register` endpoint
2. Create `ProvisionStaffUseCase`
3. Generate invitation token (expires in 7 days)
4. Send invitation email via Notification service
5. Staff clicks link → sets password → activates account
6. Publish `UserRegistered` event
7. Add tests

**Estimated Effort**: 4-5 hours

**Priority**: P0 - Critical (no way to create staff accounts currently)

---

### 2.3. Sync Permission Matrix ✅ P1 - HIGH

**Đề xuất**:
> Đồng bộ permission matrix trong `backend/services-v2/docs/design/ROLE_BOUNDARIES_AND_USE_CASES.md:1316` để phản ánh đúng boundary (Doctor/Nurse không tự tạo bệnh nhân, patient chỉ quản lý dữ liệu bản thân).

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ Permission matrix đã được update (migration 005)
- ✅ Doctor/Nurse không có `patients:create` permission
- ✅ Cần verify implementation matches documentation

**Implementation Plan**:
1. Verify database permissions match documentation
2. Update any discrepancies
3. Add tests to enforce permission boundaries

**Estimated Effort**: 2-3 hours

**Priority**: P1 - High (documentation accuracy)

---

## 3. RBAC & Phân Quyền

### 3.1. Admin Role Assignment API ✅ P1 - HIGH

**Đề xuất**:
> Khi tạo user, chỉ cho phép assign role qua Admin endpoint; trong `SupabaseUserRepository.createAuthUser()` cần kiểm tra role hợp lệ (đã có check) và ghi audit. Bổ sung API cho việc đổi vai trò từ Admin (hiện chỉ có repo `assignRole`).

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ `assignRole()` đã có implementation
- ✅ Role validation đã có
- ✅ Cần expose via API endpoint

**Implementation Plan**:
1. Add `POST /admin/users/:userId/roles` endpoint
2. Create `AssignRoleUseCase`
3. Validate role exists and is active
4. Publish `UserRoleChanged` event
5. Add audit logging
6. Add tests

**Estimated Effort**: 3-4 hours

**Priority**: P1 - High (admin needs this)

---

### 3.2. Own Resource Permission Check ✅ P1 - HIGH

**Đề xuất**:
> Hoàn thiện kiểm tra quyền "own resource" trong middleware `PermissionMiddleware` khi truy cập `/api/v1/users/me` và hành động khác; bổ sung test.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ `PermissionMiddleware` đã có `checkOwnership` logic
- ✅ Cần verify implementation is correct
- ✅ Cần add comprehensive tests

**Implementation Plan**:
1. Review `PermissionMiddleware.requirePermission()` ownership check
2. Add tests for:
   - Patient accessing own data ✅
   - Patient accessing other patient data ❌
   - Doctor accessing assigned patient data ✅
   - Doctor accessing unassigned patient data ❌
3. Document ownership rules

**Estimated Effort**: 2-3 hours

**Priority**: P1 - High (security requirement)

---

## 4. Event-Driven & Tích Hợp

### 4.1. Event Publishing ✅ P0 - CRITICAL

**Đề xuất**:
> Domain event đã được add nhưng chưa publish. Thêm lớp publisher (RabbitMQ/Supabase queue) để phát `UserRegistered`, `AccountActivated`, `RoleAssigned` sau khi use case hoàn tất; cập nhật docs event catalog.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ Domain events đã có (line 88 in User.ts)
- ✅ RabbitMQ infrastructure đã có (docker-compose)
- ✅ Cần thiết cho event-driven architecture

**Implementation Plan**:
1. Create `EventPublisher` service (RabbitMQ client)
2. Update use cases to publish events:
   - `RegisterUserUseCase` → `UserRegistered`
   - `VerifyEmailUseCase` → `UserActivated`
   - `AssignRoleUseCase` → `UserRoleChanged`
   - `AuthenticateUserUseCase` → `UserLoggedIn`
   - `LogoutUserUseCase` → `UserLoggedOut`
3. Configure RabbitMQ exchanges and queues
4. Add event payload schemas to documentation
5. Add tests

**Estimated Effort**: 6-8 hours

**Priority**: P0 - Critical (other services depend on these events)

---

### 4.2. Notification Integration ✅ P2 - MEDIUM

**Đề xuất**:
> Tạo subscriber mock hoặc gửi Notification (email/MFA) thông qua Notifications service; tối thiểu log payload để các service khác có căn cứ.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ Notification service đã có (in development)
- ✅ Cần thiết cho email verification, password reset, etc.
- ⚠️ Can use mock for now, real integration later

**Implementation Plan**:
1. Create `NotificationClient` interface
2. Implement `MockNotificationClient` for testing
3. Send notifications for:
   - Email verification
   - Password reset
   - Account locked
   - MFA setup
4. Add real RabbitMQ integration later

**Estimated Effort**: 4-5 hours

**Priority**: P2 - Medium (can use mock for now)

---

## 5. Dữ Liệu & Clean Boundary

### 5.1. PersonalInfo Scope ✅ P2 - MEDIUM

**Đề xuất**:
> Rà soát `PersonalInfo` để chỉ lưu thông tin tối thiểu phục vụ xác thực; chuyển các trường chuyên ngành (địa chỉ, liên hệ khẩn cấp) sang Patient/Provider service nếu không bắt buộc nằm ở Identity.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ Identity service should only store authentication-related data
- ✅ Patient/Provider services should own domain-specific data
- ✅ Aligns with bounded context principles

**Current PersonalInfo** (line 7):
```typescript
interface PersonalInfoProps {
  fullName: string;
  phoneNumber?: string;
  citizenId?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string; // ❌ Should be in Patient/Provider service
}
```

**Recommended PersonalInfo**:
```typescript
interface PersonalInfoProps {
  fullName: string; // ✅ For display in UI
  phoneNumber?: string; // ✅ For MFA
  // Remove: citizenId, dateOfBirth, gender, address
}
```

**Implementation Plan**:
1. Remove non-essential fields from `PersonalInfo`
2. Update `User` aggregate
3. Update database schema (migration)
4. Patient/Provider services will store full profile via events

**Estimated Effort**: 3-4 hours

**Priority**: P2 - Medium (architectural improvement, not blocking)

---

### 5.2. Schema Boundary Enforcement ✅ P1 - HIGH

**Đề xuất**:
> Đảm bảo `SupabaseUserRepository` chỉ thao tác với schema Identity; mọi đồng bộ hồ sơ bệnh nhân cần đi qua event/API riêng.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ Identity service should only access `auth_schema`
- ✅ Patient/Provider services own their schemas
- ✅ Communication via events only

**Implementation Plan**:
1. Audit `SupabaseUserRepository` for cross-schema queries
2. Remove any direct access to `patient_schema` or `provider_schema`
3. Ensure all cross-service communication via events
4. Add tests to enforce boundary

**Estimated Effort**: 2-3 hours

**Priority**: P1 - High (architectural integrity)

---

## 6. Tài Liệu & Kiểm Thử

### 6.1. Update README Status ✅ P2 - MEDIUM

**Đề xuất**:
> Cập nhật `identity-service/README.md:395` nhằm phản ánh trạng thái thực tế (trước khi hoàn thiện chưa thể đánh dấu "Account lockout ✅", "Token refresh ✅").

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ Documentation accuracy is important
- ✅ Easy to fix

**Implementation Plan**:
1. Update README.md feature list
2. Mark incomplete features as "⏳ In Progress" or "❌ Not Implemented"
3. Add roadmap section

**Estimated Effort**: 30 minutes

**Priority**: P2 - Medium (documentation)

---

### 6.2. API Documentation ✅ P1 - HIGH

**Đề xuất**:
> Viết tài liệu API chi tiết (request, response, lỗi) cho các endpoint mới; cập nhật `docs/design/ROLE_BOUNDARIES_AND_USE_CASES.md` sau khi điều chỉnh permission/use case.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ API contract document skeleton already exists
- ✅ Cần thiết cho frontend integration
- ✅ Cần thiết cho testing

**Implementation Plan**:
1. Complete `docs/api/IDENTITY_API_CONTRACT.md`
2. Document all endpoints with:
   - Request schema
   - Response schema
   - Error codes
   - Examples
3. Update role boundaries document
4. Generate OpenAPI/Swagger spec

**Estimated Effort**: 4-5 hours

**Priority**: P1 - High (frontend needs this)

---

### 6.3. Integration Tests ✅ P1 - HIGH

**Đề xuất**:
> Bổ sung test: integration cho refresh token, lockout, admin provisioning/invite, sự kiện phát ra; cập nhật runbook và test plan.

**Đánh giá**: ✅ **Khả thi & Cần thiết**

**Lý do**:
- ✅ Test infrastructure already exists (29/29 tests passing)
- ✅ Cần thiết để verify new features
- ✅ Cần thiết cho CI/CD

**Missing Tests**:
1. Token refresh flow
2. Account lockout after 5 failed attempts
3. Admin staff provisioning
4. Event publishing
5. Ownership permission checks

**Implementation Plan**:
1. Add integration tests for each new feature
2. Update test plan document
3. Update runbook with troubleshooting steps
4. Ensure 90%+ code coverage

**Estimated Effort**: 6-8 hours

**Priority**: P1 - High (quality assurance)

---

## 📊 Summary

### Priority Breakdown

**P0 - Critical (Must implement before production):**
1. ✅ Token Refresh Endpoint (2-3h)
2. ✅ Login Attempt Tracking & Account Lockout (3-4h)
3. ✅ Restrict Self-Registration to Patients (1-2h)
4. ✅ Admin Staff Provisioning Endpoint (4-5h)
5. ✅ Event Publishing (6-8h)

**Total P0 Effort**: 16-22 hours (~3-4 days)

**P1 - High (Should implement soon):**
1. ✅ Admin Management Endpoints (6-8h)
2. ✅ Sync Permission Matrix (2-3h)
3. ✅ Admin Role Assignment API (3-4h)
4. ✅ Own Resource Permission Check (2-3h)
5. ✅ Schema Boundary Enforcement (2-3h)
6. ✅ API Documentation (4-5h)
7. ✅ Integration Tests (6-8h)

**Total P1 Effort**: 25-34 hours (~5-7 days)

**P2 - Medium (Nice to have):**
1. ✅ Notification Integration (4-5h)
2. ✅ PersonalInfo Scope (3-4h)
3. ✅ Update README Status (0.5h)

**Total P2 Effort**: 7.5-9.5 hours (~1-2 days)

---

## 🎯 Recommended Implementation Order

### Phase 1: Security & Core Features (P0)
1. Restrict Self-Registration to Patients (1-2h)
2. Token Refresh Endpoint (2-3h)
3. Login Attempt Tracking & Account Lockout (3-4h)
4. Admin Staff Provisioning Endpoint (4-5h)
5. Event Publishing (6-8h)

**Phase 1 Total**: 16-22 hours

### Phase 2: Admin Tools & Documentation (P1)
6. Admin Management Endpoints (6-8h)
7. Admin Role Assignment API (3-4h)
8. API Documentation (4-5h)
9. Integration Tests (6-8h)

**Phase 2 Total**: 19-25 hours

### Phase 3: Refinement (P1 + P2)
10. Own Resource Permission Check (2-3h)
11. Schema Boundary Enforcement (2-3h)
12. Sync Permission Matrix (2-3h)
13. PersonalInfo Scope (3-4h)
14. Notification Integration (4-5h)
15. Update README Status (0.5h)

**Phase 3 Total**: 13.5-18.5 hours

---

## ✅ Conclusion

**All recommendations are feasible and necessary**. Implementing these will:
- ✅ Fix security vulnerabilities (self-registration, lockout)
- ✅ Enable core functionality (token refresh, staff provisioning)
- ✅ Complete event-driven architecture (event publishing)
- ✅ Provide admin tools (lock/unlock, role assignment)
- ✅ Improve documentation (API contract, tests)
- ✅ Enforce clean boundaries (schema isolation, PersonalInfo scope)

**Total Estimated Effort**: 49-66 hours (~10-13 days for 1 developer)

**Recommendation**: Implement in 3 phases over 2-3 weeks.

