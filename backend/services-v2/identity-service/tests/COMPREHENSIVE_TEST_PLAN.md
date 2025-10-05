# Identity Service - Comprehensive Test Plan

## 📊 Current Coverage Status

**Existing Tests:**
- ✅ Integration tests: Authentication, RBAC
- ✅ Unit test: RedisCacheService
- ❌ **Missing**: 90% of use cases, repositories, services

**Target Coverage:** 90%+ for critical paths

---

## 🎯 Phase 1: Application Layer - Use Cases (Priority: CRITICAL)

### 1.1 RegisterUserUseCase
**File:** `tests/unit/application/use-cases/RegisterUserUseCase.test.ts`

**Test Cases:**
- ✅ Happy Path
  - Should register user with valid data
  - Should hash password correctly
  - Should create user profile
  - Should assign default role
  - Should send verification email
  - Should return user without password

- ❌ Validation Errors
  - Should reject invalid email format
  - Should reject weak password
  - Should reject duplicate email
  - Should reject missing required fields
  - Should validate Vietnamese phone number format

- ❌ Business Rules
  - Should enforce password complexity (8+ chars, uppercase, lowercase, number, special)
  - Should validate national ID format (12 digits)
  - Should check email domain whitelist (if configured)

- ❌ Error Handling
  - Should handle database connection failure
  - Should handle email service failure (graceful degradation)
  - Should rollback on partial failure
  - Should log errors properly

- ❌ Circuit Breaker
  - Should open circuit after 5 consecutive failures
  - Should half-open after timeout
  - Should close circuit on success

**Mocks Required:**
- IUserRepository
- IAuthService
- ILogger
- ICircuitBreaker

---

### 1.2 AuthenticateUserUseCase
**File:** `tests/unit/application/use-cases/AuthenticateUserUseCase.test.ts`

**Test Cases:**
- ✅ Happy Path
  - Should authenticate with valid credentials
  - Should return JWT token
  - Should update last login timestamp
  - Should create session record

- ❌ Authentication Failures
  - Should reject invalid password
  - Should reject non-existent user
  - Should reject unverified email
  - Should reject deactivated user
  - Should reject locked account (after 5 failed attempts)

- ❌ MFA Flow
  - Should require MFA if enabled
  - Should return temporary token for MFA
  - Should not return full access token without MFA

- ❌ Rate Limiting
  - Should track failed login attempts
  - Should lock account after 5 failures
  - Should reset counter on success
  - Should unlock after 30 minutes

- ❌ Security
  - Should not reveal if email exists (timing attack prevention)
  - Should log all authentication attempts
  - Should detect suspicious patterns (multiple IPs, rapid attempts)

**Mocks Required:**
- IUserRepository
- IAuthService
- ILogger
- ICircuitBreaker

---

### 1.3 UpdateUserUseCase
**File:** `tests/unit/application/use-cases/UpdateUserUseCase.test.ts`

**Test Cases:**
- ✅ Happy Path
  - Should update user profile
  - Should update only provided fields
  - Should preserve unchanged fields
  - Should update timestamp

- ❌ Validation
  - Should reject invalid email format
  - Should reject invalid phone format
  - Should validate role changes (admin only)

- ❌ Authorization
  - Should allow user to update own profile
  - Should allow admin to update any profile
  - Should reject unauthorized updates
  - Should prevent privilege escalation

- ❌ Audit Trail
  - Should log all profile changes
  - Should record who made the change
  - Should track field-level changes

**Mocks Required:**
- IUserRepository
- IPermissionService
- ILogger

---

### 1.4 DeleteUserUseCase
**File:** `tests/unit/application/use-cases/DeleteUserUseCase.test.ts`

**Test Cases:**
- ✅ Happy Path (Soft Delete)
  - Should mark user as deleted
  - Should preserve data for audit
  - Should revoke all sessions
  - Should anonymize PHI after retention period

- ❌ Authorization
  - Should allow admin to delete users
  - Should allow user to delete own account
  - Should reject unauthorized deletion
  - Should prevent deleting last admin

- ❌ Cascade Effects
  - Should handle related data (appointments, medical records)
  - Should notify dependent services
  - Should maintain referential integrity

- ❌ GDPR Compliance
  - Should support "right to be forgotten"
  - Should export user data before deletion
  - Should log deletion request

**Mocks Required:**
- IUserRepository
- IPermissionService
- ILogger
- Event Publisher

---

### 1.5 ForgotPasswordUseCase
**File:** `tests/unit/application/use-cases/ForgotPasswordUseCase.test.ts`

**Test Cases:**
- ✅ Happy Path
  - Should generate reset token
  - Should send reset email
  - Should set token expiration (1 hour)
  - Should log request

- ❌ Security
  - Should not reveal if email exists
  - Should rate limit requests (max 3 per hour)
  - Should invalidate old tokens
  - Should use cryptographically secure tokens

- ❌ Error Handling
  - Should handle email service failure gracefully
  - Should log errors without exposing details

**Mocks Required:**
- IUserRepository
- IAuthService
- ILogger

---

### 1.6 ResetPasswordUseCase
**File:** `tests/unit/application/use-cases/ResetPasswordUseCase.test.ts`

**Test Cases:**
- ✅ Happy Path
  - Should reset password with valid token
  - Should hash new password
  - Should invalidate reset token
  - Should revoke all sessions
  - Should send confirmation email

- ❌ Validation
  - Should reject expired token
  - Should reject invalid token
  - Should reject weak password
  - Should reject reused password (last 5)

- ❌ Security
  - Should prevent token reuse
  - Should log password changes
  - Should notify user of password change

**Mocks Required:**
- IUserRepository
- IAuthService
- ILogger

---

### 1.7 VerifyEmailUseCase
**File:** `tests/unit/application/use-cases/VerifyEmailUseCase.test.ts`

**Test Cases:**
- ✅ Happy Path
  - Should verify email with valid token
  - Should mark email as verified
  - Should activate account
  - Should send welcome email

- ❌ Validation
  - Should reject expired token
  - Should reject invalid token
  - Should reject already verified email

- ❌ Error Handling
  - Should handle database errors
  - Should log verification attempts

**Mocks Required:**
- IUserRepository
- IAuthService
- ILogger

---

### 1.8 LogoutUserUseCase
**File:** `tests/unit/application/use-cases/LogoutUserUseCase.test.ts`

**Test Cases:**
- ✅ Happy Path
  - Should revoke session
  - Should invalidate refresh token
  - Should clear cache
  - Should log logout

- ❌ Edge Cases
  - Should handle already logged out user
  - Should handle invalid session
  - Should handle cache failure gracefully

**Mocks Required:**
- IUserRepository
- IAuthService
- ILogger

---

### 1.9 ListUsersUseCase
**File:** `tests/unit/application/use-cases/ListUsersUseCase.test.ts`

**Test Cases:**
- ✅ Happy Path
  - Should list users with pagination
  - Should filter by role
  - Should filter by status
  - Should sort by field
  - Should exclude sensitive data

- ❌ Authorization
  - Should allow admin to list all users
  - Should allow receptionist to list patients
  - Should reject unauthorized access

- ❌ Performance
  - Should limit page size (max 100)
  - Should use cursor-based pagination
  - Should cache results

**Mocks Required:**
- IUserRepository
- IPermissionService
- ILogger

---

### 1.10 MFA Use Cases

#### EnableMFAUseCase
**File:** `tests/unit/application/use-cases/EnableMFAUseCase.test.ts`

**Test Cases:**
- Should generate TOTP secret
- Should return QR code
- Should require password confirmation
- Should verify initial code before enabling

#### VerifyMFAUseCase
**File:** `tests/unit/application/use-cases/VerifyMFAUseCase.test.ts`

**Test Cases:**
- Should verify TOTP code
- Should handle time drift (±30 seconds)
- Should prevent code reuse
- Should lock after 5 failed attempts

#### DisableMFAUseCase
**File:** `tests/unit/application/use-cases/DisableMFAUseCase.test.ts`

**Test Cases:**
- Should disable MFA with password confirmation
- Should require admin approval for sensitive roles
- Should log MFA status changes

---

## 🎯 Phase 2: Infrastructure Layer (Priority: HIGH)

### 2.1 SupabaseUserRepository
**File:** `tests/unit/infrastructure/repositories/SupabaseUserRepository.test.ts`

**Test Cases:**
- CRUD operations (create, findById, findByEmail, update, delete)
- Data mapping (domain ↔ database)
- Error handling (connection errors, constraint violations)
- Transaction support
- Retry logic with exponential backoff
- Circuit breaker integration

### 2.2 SupabaseAuthClient
**File:** `tests/unit/infrastructure/auth/SupabaseAuthClient.test.ts`

**Test Cases:**
- Sign up, sign in, sign out
- Token generation and validation
- Password reset flow
- Email verification
- Error mapping (Supabase errors → domain errors)

### 2.3 PermissionService
**File:** `tests/unit/infrastructure/services/PermissionService.test.ts`

**Test Cases:**
- Check permission
- Get user permissions
- Cache permissions
- Handle cache miss
- Refresh permissions

---

## 🎯 Phase 3: Presentation Layer (Priority: MEDIUM)

### 3.1 RBAC Middleware (Expand existing tests)
**File:** `tests/unit/presentation/middleware/rbac.test.ts`

**Additional Test Cases:**
- Token expired
- User without profile
- Cache failure (fallback to database)
- Multiple roles
- Permission inheritance

---

## 📝 Test Utilities to Create

### Mock Factories
**File:** `tests/helpers/mockFactories.ts`
- `createMockUserRepository()`
- `createMockAuthService()`
- `createMockPermissionService()`
- `createMockLogger()`
- `createMockCircuitBreaker()`

### Test Data Builders
**File:** `tests/helpers/testDataBuilders.ts`
- `UserBuilder` - Fluent API for creating test users
- `TokenBuilder` - Create test JWT tokens
- `PermissionBuilder` - Create test permissions

---

## 🚀 Execution Plan

### Week 1: Critical Use Cases
- Day 1-2: RegisterUserUseCase, AuthenticateUserUseCase
- Day 3-4: UpdateUserUseCase, DeleteUserUseCase
- Day 5: ForgotPasswordUseCase, ResetPasswordUseCase

### Week 2: Remaining Use Cases + Infrastructure
- Day 1: VerifyEmailUseCase, LogoutUserUseCase, ListUsersUseCase
- Day 2-3: MFA Use Cases
- Day 4-5: SupabaseUserRepository, SupabaseAuthClient

### Week 3: Services + Middleware
- Day 1-2: PermissionService
- Day 3: RBAC Middleware expansion
- Day 4-5: Integration test improvements

---

## 📊 Success Criteria

- ✅ 90%+ code coverage for use cases
- ✅ 85%+ code coverage for infrastructure
- ✅ All critical paths tested (happy + error)
- ✅ Circuit breaker behavior verified
- ✅ Security scenarios covered
- ✅ Performance tests for list operations
- ✅ All tests pass in CI/CD pipeline

