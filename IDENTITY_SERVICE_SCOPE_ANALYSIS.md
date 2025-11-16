# Identity Service - Phân Tích Scope Đồ Án Tốt Nghiệp

**Phân tích**: Tính năng nào GIỮ LẠI, tính năng nào BỎ ĐI  
**Mục tiêu**: Tối ưu scope cho demo đồ án tốt nghiệp  
**Thời gian demo**: 15-20 phút

---

## 🎯 CORE FEATURES - PHẢI GIỮ (Essential)

### ✅ 1. Authentication Core (GIỮ 100%)
**Lý do**: Đây là tính năng cốt lõi của Identity Service

#### Endpoints giữ lại:
```typescript
✅ POST /auth/login                    // Login cơ bản - BẮT BUỘC
✅ POST /auth/logout                   // Logout - BẮT BUỘC  
✅ POST /auth/register                 // Patient self-registration - BẮT BUỘC
✅ GET /auth/me                        // Get current user - BẮT BUỘC
✅ POST /auth/refresh                  // Token refresh - CẦN THIẾT
```

#### Use Cases giữ lại:
- `AuthenticateUserUseCase.ts` ✅
- `LogoutUserUseCase.ts` ✅
- `RegisterUserUseCase.ts` ✅
- `RefreshTokenUseCase.ts` ✅

**Demo value**: ⭐⭐⭐⭐⭐ (Essential)

---

### ✅ 2. Role-Based Access Control (GIỮ 100%)
**Lý do**: Core security feature, thể hiện kiến thức về authorization

#### Middleware giữ lại:
```typescript
✅ AuthenticationMiddleware.ts         // Verify JWT token
✅ PermissionMiddleware.ts             // Check permissions
```

#### 5 Roles giữ lại:
```typescript
✅ ADMIN          // Full system access
✅ DOCTOR         // Medical staff  
✅ NURSE          // Medical staff
✅ RECEPTIONIST   // Front desk
✅ PATIENT        // End user
```

#### Permission Format giữ lại:
```typescript
✅ "patients:read"      // Resource:Action format
✅ "appointments:write" 
✅ "*"                  // Admin wildcard
```

**Demo value**: ⭐⭐⭐⭐⭐ (Shows security expertise)

---

### ✅ 3. User Management Core (GIỮ - Simplified)
**Lý do**: CRUD operations cơ bản, cần cho demo

#### Endpoints giữ lại:
```typescript
✅ GET /api/users/:userId              // Get user by ID
✅ PATCH /api/users/:userId            // Update user (partial)
✅ GET /api/users                      // List users (admin only)
❌ PUT /api/users/:userId              // BỎ - Duplicate với PATCH
❌ DELETE /api/users/:userId           // BỎ - Không cần thiết cho demo
```

#### Use Cases giữ lại:
- `GetUserUseCase.ts` ✅
- `UpdateUserUseCase.ts` ✅
- `ListUsersUseCase.ts` ✅
- ❌ `DeleteUserUseCase.ts` - BỎ
- ❌ `ActivateUserUseCase.ts` - BỎ
- ❌ `DeactivateUserUseCase.ts` - BỎ

**Demo value**: ⭐⭐⭐⭐ (Important but simplified)

---

## ⚠️ OPTIONAL FEATURES - XEM XÉT KỸ

### 🤔 4. Email Verification (GIỮ - Simplified)
**Lý do**: Thể hiện email workflow, nhưng có thể đơn giản hóa

#### Giữ lại (simplified):
```typescript
✅ POST /auth/verify-email             // POST endpoint only
✅ POST /auth/resend-verification      // Resend email
❌ GET /auth/verify-email              // BỎ - Duplicate
```

#### Use Cases:
- `VerifyEmailUseCase.ts` ✅
- `ResendVerificationEmailUseCase.ts` ✅

**Demo value**: ⭐⭐⭐ (Nice-to-have, có thể skip nếu thiếu thời gian)

**Đề xuất**: 
- Nếu giữ: Demo bằng cách click link trong email
- Nếu bỏ: Auto-verify users khi register (set `email_confirm: true`)

---

### 🤔 5. Password Management (GIỮ 1-2 features)
**Lý do**: Security feature nhưng không cần thiết cho demo cơ bản

#### Đề xuất giữ lại (tối thiểu):
```typescript
✅ POST /auth/forgot-password          // Forgot password
✅ POST /auth/reset-password           // Reset with token
❌ POST /users/:userId/change-password // BỎ - Ít dùng trong demo
```

#### Use Cases:
- `ForgotPasswordUseCase.ts` ✅
- `ResetPasswordUseCase.ts` ✅
- ❌ `ChangePasswordUseCase.ts` - BỎ
- ❌ `ValidatePasswordUseCase.ts` - BỎ
- ❌ `UpdatePasswordPolicyUseCase.ts` - BỎ
- ❌ `GetPasswordPolicyUseCase.ts` - BỎ

**Demo value**: ⭐⭐ (Low priority, có thể bỏ)

**Đề xuất**: BỎ toàn bộ để giảm complexity, focus vào core authentication

---

### ❌ 6. Staff Invitation Flow (BỎ HOÀN TOÀN)
**Lý do**: Quá phức tạp, không cần thiết cho demo đồ án tốt nghiệp

#### Endpoints bỏ:
```typescript
❌ POST /api/admin/staff/invite        // Invite staff
❌ GET /auth/validate-invitation       // Validate token
❌ POST /auth/activate-staff           // Accept invitation
❌ GET /api/admin/staff/invitations    // List invitations
❌ POST /api/admin/staff/invitations/:id/resend
❌ POST /api/admin/staff/invitations/:id/cancel
```

#### Use Cases bỏ:
- ❌ `ProvisionStaffUseCase.ts`
- ❌ `AcceptStaffInvitationUseCase.ts`
- ❌ `ValidateStaffInvitationUseCase.ts`
- ❌ `ListStaffInvitationsUseCase.ts`
- ❌ `GetStaffInvitationUseCase.ts`
- ❌ `ResendStaffInvitationUseCase.ts`
- ❌ `CancelStaffInvitationUseCase.ts`

**Demo value**: ⭐ (Overkill cho đồ án)

**Thay thế**: Admin tạo staff users trực tiếp trong database seed

---

### ❌ 7. Multi-Factor Authentication (BỎ HOÀN TOÀN)
**Lý do**: Quá phức tạp, framework chưa hoàn chỉnh, không cần thiết

#### Endpoints bỏ:
```typescript
❌ POST /auth/mfa/enable               // Enable MFA
❌ POST /auth/mfa/verify               // Verify MFA code
❌ POST /auth/mfa/disable              // Disable MFA
```

#### Use Cases bỏ:
- ❌ `EnableMFAUseCase.ts`
- ❌ `VerifyMFAUseCase.ts`
- ❌ `DisableMFAUseCase.ts`

**Demo value**: ⭐ (Not implemented properly)

**Đề xuất**: BỎ hoàn toàn, mention trong presentation là "future enhancement"

---

### ❌ 8. Session Management Advanced (BỎ - Simplified)
**Lý do**: Basic session đủ rồi, không cần quản lý phức tạp

#### Endpoints bỏ:
```typescript
❌ GET /api/users/:userId/sessions     // List active sessions
❌ DELETE /api/sessions/:sessionId     // Terminate session
❌ DELETE /api/users/:userId/sessions  // Terminate all sessions
```

#### Use Cases bỏ:
- ❌ `ListActiveSessionsUseCase.ts`
- ❌ `TerminateSessionUseCase.ts`
- ❌ `TerminateAllSessionsUseCase.ts`

**Demo value**: ⭐ (Overkill)

**Giữ lại**: Basic session trong login/logout đã đủ

---

### ❌ 9. Role Assignment (BỎ - Seed trong database)
**Lý do**: Admin không cần assign role qua API trong demo

#### Endpoints bỏ:
```typescript
❌ POST /api/users/:userId/assign-role // Assign role to user
```

#### Use Cases bỏ:
- ❌ `AssignRoleUseCase.ts`

**Demo value**: ⭐ (Không cần thiết)

**Thay thế**: Seed users với roles cố định trong database

---

### ⚠️ 10. Permission Checking APIs (GIỮ - Simplified)
**Lý do**: Hữu ích cho frontend, nhưng đơn giản hóa

#### Giữ lại:
```typescript
✅ GET /api/permissions/:userId        // Get user permissions (for frontend)
❌ POST /api/permissions/check         // BỎ - Frontend tự check
❌ POST /api/permissions/check-role    // BỎ - Không cần
```

#### Use Cases:
- ✅ `CheckPermissionsUseCase.ts` (renamed to GetUserPermissionsUseCase)
- ❌ `CheckPermissionUseCase.ts` - BỎ
- ❌ `CheckRolesUseCase.ts` - BỎ
- ❌ `CheckRoleUseCase.ts` - BỎ

**Demo value**: ⭐⭐⭐ (Useful for frontend)

---

### ❌ 11. Account Lockout Management (BỎ Admin APIs)
**Lý do**: Auto lockout giữ, nhưng bỏ manual admin controls

#### Giữ lại (backend logic only):
```typescript
✅ Auto lockout after 5 failed attempts  // Logic trong AuthenticateUserUseCase
✅ Auto unlock after 30 minutes          // Logic trong AuthenticateUserUseCase
❌ POST /api/admin/unlock-account        // BỎ - Manual unlock API
❌ POST /api/admin/lock-account          // BỎ - Manual lock API
```

#### Use Cases:
- ❌ `LockAccountUseCase.ts` - BỎ
- ❌ `UnlockAccountUseCase.ts` - BỎ

**Demo value**: ⭐⭐ (Auto lockout là đủ)

---

### ❌ 12. Recovery Methods (BỎ HOÀN TOÀN)
**Lý do**: Quá phức tạp, không cần thiết

#### Endpoints bỏ:
```typescript
❌ GET /api/users/:userId/recovery-methods
❌ PUT /api/users/:userId/recovery-methods
❌ GET /api/users/:userId/recovery-history
```

#### Use Cases bỏ:
- ❌ `GetRecoveryMethodsUseCase.ts`
- ❌ `UpdateRecoveryMethodsUseCase.ts`
- ❌ `GetRecoveryHistoryUseCase.ts`
- ❌ `VerifyResetTokenUseCase.ts`
- ❌ `RequestPasswordResetUseCase.ts`
- ❌ `ResetPasswordWithTokenUseCase.ts`

**Demo value**: ⭐ (Overkill)

---

## 📊 TÓM TẮT SCOPE ĐỀ XUẤT

### ✅ GIỮ LẠI (Core Features - 15 endpoints)

**Authentication (5 endpoints)**
```typescript
✅ POST /auth/login
✅ POST /auth/logout
✅ POST /auth/register
✅ GET /auth/me
✅ POST /auth/refresh
```

**User Management (3 endpoints)**
```typescript
✅ GET /api/users/:userId
✅ PATCH /api/users/:userId
✅ GET /api/users
```

**Authorization (1 endpoint)**
```typescript
✅ GET /api/permissions/:userId
```

**Email Verification (2 endpoints) - OPTIONAL**
```typescript
⚠️ POST /auth/verify-email
⚠️ POST /auth/resend-verification
```

**Password Management (2 endpoints) - OPTIONAL**
```typescript
⚠️ POST /auth/forgot-password
⚠️ POST /auth/reset-password
```

**Monitoring (2 endpoints)**
```typescript
✅ GET /health
✅ GET /api-docs
```

### ❌ BỎ ĐI (Advanced Features - ~30 endpoints)

**Staff Invitation Flow** (7 endpoints)
- ❌ All invitation endpoints

**MFA** (3 endpoints)
- ❌ All MFA endpoints

**Session Management** (3 endpoints)
- ❌ Advanced session APIs

**Role Assignment** (1 endpoint)
- ❌ Assign role API

**Account Lockout Management** (2 endpoints)
- ❌ Manual lock/unlock APIs

**Recovery Methods** (6 endpoints)
- ❌ All recovery endpoints

**Permission Checking** (3 endpoints)
- ❌ Check permission/role APIs

**User Management Advanced** (5 endpoints)
- ❌ DELETE, PUT, Activate, Deactivate

---

## 🗂️ FILES CẦN XÓA/COMMENT OUT

### Use Cases cần xóa (26 files):
```bash
# Staff Invitation (7 files)
❌ AcceptStaffInvitationUseCase.ts
❌ ValidateStaffInvitationUseCase.ts
❌ ProvisionStaffUseCase.ts
❌ ListStaffInvitationsUseCase.ts
❌ GetStaffInvitationUseCase.ts
❌ ResendStaffInvitationUseCase.ts
❌ CancelStaffInvitationUseCase.ts

# MFA (3 files)
❌ EnableMFAUseCase.ts
❌ VerifyMFAUseCase.ts
❌ DisableMFAUseCase.ts

# Session Management (3 files)
❌ ListActiveSessionsUseCase.ts
❌ TerminateSessionUseCase.ts
❌ TerminateAllSessionsUseCase.ts

# Account Management (3 files)
❌ LockAccountUseCase.ts
❌ UnlockAccountUseCase.ts
❌ AssignRoleUseCase.ts

# User Management (3 files)
❌ DeleteUserUseCase.ts
❌ ActivateUserUseCase.ts
❌ DeactivateUserUseCase.ts

# Password Policies (2 files)
❌ GetPasswordPolicyUseCase.ts
❌ UpdatePasswordPolicyUseCase.ts

# Recovery (6 files)
❌ GetRecoveryMethodsUseCase.ts
❌ UpdateRecoveryMethodsUseCase.ts
❌ GetRecoveryHistoryUseCase.ts
❌ VerifyResetTokenUseCase.ts
❌ RequestPasswordResetUseCase.ts
❌ ResetPasswordWithTokenUseCase.ts

# Permission Checking (4 files)
❌ CheckPermissionUseCase.ts
❌ CheckRolesUseCase.ts
❌ CheckRoleUseCase.ts
❌ ValidatePasswordUseCase.ts
```

### Routes cần xóa/comment:
```typescript
// File: src/presentation/routes/auth.routes.ts
❌ POST /auth/mfa/enable
❌ POST /auth/mfa/verify
❌ POST /auth/mfa/disable
❌ GET /auth/validate-invitation
❌ POST /auth/activate-staff

// File: src/presentation/routes/user.routes.ts
❌ POST /users/:userId/change-password
❌ POST /users/:userId/assign-role
❌ DELETE /users/:userId
❌ PUT /users/:userId

// File: src/presentation/routes/admin.routes.ts (nếu có)
❌ All staff invitation routes
❌ All session management routes
❌ All account lockout routes
```

---

## 🎯 KẾT QUẢ SAU KHI TỐI ƯU

### Trước khi tối ưu:
- **43 Use Cases**
- **~45 API Endpoints**
- **Complexity**: HIGH (quá nhiều features)
- **Demo time**: 30-40 phút (quá dài)

### Sau khi tối ưu:
- **17 Use Cases** (giảm 60%)
- **15-19 API Endpoints** (giảm 60%)
- **Complexity**: MEDIUM (vừa phải)
- **Demo time**: 15-20 phút (phù hợp)

---

## 📋 ACTION ITEMS

### Step 1: Backup Code
```bash
cd backend/services-v2/identity-service
git checkout -b feature/scope-optimization
git add .
git commit -m "Backup before scope optimization"
```

### Step 2: Xóa Use Cases không cần thiết
```bash
cd src/application/use-cases

# Xóa 26 files listed above
rm AcceptStaffInvitationUseCase.ts
rm ValidateStaffInvitationUseCase.ts
# ... (xóa tất cả files ❌ trong list)
```

### Step 3: Clean up Routes
```typescript
// Comment out hoặc xóa routes không cần thiết
// File: src/presentation/routes/auth.routes.ts
// File: src/presentation/routes/user.routes.ts
```

### Step 4: Update main.ts
```typescript
// Remove unused use case imports
// Remove unused route registrations
```

### Step 5: Update README.md
```markdown
# Update feature list to reflect actual scope
# Remove documentation for removed features
```

### Step 6: Test
```bash
npm run build  # Should compile successfully
npm run dev    # Should start without errors
```

---

## 🎓 DEMO SCRIPT (15 phút)

### Part 1: Authentication (5 phút)
1. **Patient Registration** (2 phút)
   - POST /auth/register
   - Show success response
   - (Optional) Verify email

2. **Login** (2 phút)
   - POST /auth/login as patient
   - POST /auth/login as admin
   - Show JWT tokens

3. **Get Current User** (1 phút)
   - GET /auth/me
   - Show user profile

### Part 2: Authorization (5 phút)
4. **Role-Based Access** (3 phút)
   - Try patient accessing admin endpoint → 403
   - Try admin accessing same endpoint → 200
   - Show permission middleware working

5. **User Management** (2 phút)
   - Admin lists all users
   - Admin views user details
   - Admin updates user info

### Part 3: Architecture (5 phút)
6. **Code Walkthrough** (3 phút)
   - Show Clean Architecture layers
   - Show RBAC implementation
   - Show Supabase integration

7. **Monitoring** (2 phút)
   - GET /health endpoint
   - GET /api-docs Swagger UI
   - Show audit logs in database

---

## 💡 KẾT LUẬN

### Scope đề xuất CUỐI CÙNG:

**GIỮ (Essential - 90% effort reduction)**
- ✅ Core Authentication (5 endpoints)
- ✅ Core User Management (3 endpoints)
- ✅ RBAC & Permissions (1 endpoint)
- ✅ Monitoring (2 endpoints)

**XEM XÉT (Optional - có thể bỏ nếu thiếu thời gian)**
- ⚠️ Email Verification (2 endpoints)
- ⚠️ Password Reset (2 endpoints)

**BỎ (Overkill cho đồ án)**
- ❌ Staff Invitation (7 endpoints)
- ❌ MFA (3 endpoints)
- ❌ Advanced Session Management (3 endpoints)
- ❌ Account Lockout Admin (2 endpoints)
- ❌ Recovery Methods (6 endpoints)
- ❌ Advanced Permission APIs (4 endpoints)

### Lợi ích:
- ✅ Giảm 60% complexity
- ✅ Focus vào core features
- ✅ Dễ demo hơn (15-20 phút)
- ✅ Dễ maintain hơn
- ✅ Vẫn thể hiện đủ kiến thức về architecture & security

### Điểm dự kiến: 8.5-9.0/10
- Architecture vẫn xuất sắc
- Security features đầy đủ (auth + RBAC)
- Code quality cao
- Scope hợp lý cho đồ án tốt nghiệp