# Feature 3: Account Recovery Options - Design Document

**Feature ID**: FEAT-IDENTITY-003  
**Version**: 1.0.0  
**Status**: 🔄 In Development  
**Priority**: High  
**Estimated Effort**: 3-4 days

---

## 📋 OVERVIEW

### Purpose
Cung cấp các tùy chọn khôi phục tài khoản cho users khi quên mật khẩu hoặc mất quyền truy cập. Feature này mở rộng existing password reset flow với thêm recovery methods và tracking.

### Scope
- ✅ **IN SCOPE**: Password reset flow enhancement, recovery method management, recovery history tracking
- ❌ **OUT OF SCOPE**: Security questions (optional for future), SMS recovery (requires SMS service), biometric recovery

### Service Boundary Compliance
✅ **Identity Service SHOULD DO**:
- Manage account recovery methods
- Track recovery attempts
- Validate recovery tokens
- Send recovery emails (via Supabase)

❌ **Identity Service SHOULD NOT DO**:
- Send SMS (Notifications Service responsibility)
- Manage user preferences (Patient/Provider Service responsibility)
- Store medical data

---

## 🎯 REQUIREMENTS

### Functional Requirements

#### FR-1: Recovery Method Management
- Users can view their configured recovery methods
- Users can update recovery email
- System validates recovery email is different from primary email
- System tracks when recovery methods were last updated

#### FR-2: Enhanced Password Reset Flow
- Users can request password reset via primary email
- Users can request password reset via recovery email (if configured)
- System generates secure reset tokens (Supabase built-in)
- System tracks all reset attempts (success/failure)
- System enforces rate limiting (max 3 attempts per hour)

#### FR-3: Recovery History Tracking
- System logs all recovery attempts
- System tracks: timestamp, method used, IP address, success/failure
- Users can view their recovery history
- Admins can view recovery history for compliance

#### FR-4: Security Enhancements
- Reset tokens expire after 1 hour (Supabase default)
- All existing sessions invalidated after successful password reset
- Email notifications sent for all recovery attempts
- Suspicious activity detection (multiple failed attempts)

### Non-Functional Requirements

#### NFR-1: Security
- Recovery tokens must be cryptographically secure
- Rate limiting to prevent brute force
- Audit trail for compliance (HIPAA)

#### NFR-2: Performance
- Recovery method lookup: < 100ms
- Password reset email: < 5s (Supabase limit: 2 emails/hour on free tier)

#### NFR-3: Reliability
- Circuit breaker for Supabase calls
- Graceful degradation if email service unavailable
- Retry logic for transient failures

---

## 🏗️ ARCHITECTURE DESIGN

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Endpoints (main.ts)                             │  │
│  │  - GET    /api/v1/account-recovery/methods           │  │
│  │  - PUT    /api/v1/account-recovery/methods           │  │
│  │  - POST   /api/v1/account-recovery/request-reset     │  │
│  │  - POST   /api/v1/account-recovery/verify-token      │  │
│  │  - POST   /api/v1/account-recovery/reset-password    │  │
│  │  - GET    /api/v1/account-recovery/history           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Use Cases                                           │  │
│  │  - GetRecoveryMethodsUseCase                         │  │
│  │  - UpdateRecoveryMethodsUseCase                      │  │
│  │  - RequestPasswordResetUseCase (enhanced)            │  │
│  │  - VerifyResetTokenUseCase                           │  │
│  │  - ResetPasswordWithTokenUseCase (enhanced)          │  │
│  │  - GetRecoveryHistoryUseCase                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Value Objects                                       │  │
│  │  - RecoveryMethod                                    │  │
│  │  - RecoveryAttempt                                   │  │
│  │                                                      │  │
│  │  Repository Interfaces                               │  │
│  │  - IRecoveryMethodRepository                         │  │
│  │  - IRecoveryHistoryRepository                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Repository Implementations                          │  │
│  │  - SupabaseRecoveryMethodRepository                  │  │
│  │  - SupabaseRecoveryHistoryRepository                 │  │
│  │                                                      │  │
│  │  External Services                                   │  │
│  │  - SupabaseAuthService (existing)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA

### New Tables

#### 1. `auth_schema.recovery_methods`

```sql
CREATE TABLE auth_schema.recovery_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recovery_email TEXT,
  recovery_email_verified BOOLEAN DEFAULT FALSE,
  recovery_email_verified_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_recovery UNIQUE(user_id),
  CONSTRAINT valid_recovery_email CHECK (recovery_email IS NULL OR recovery_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_recovery_methods_user_id ON auth_schema.recovery_methods(user_id);
```

#### 2. `auth_schema.recovery_history`

```sql
CREATE TABLE auth_schema.recovery_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recovery_method TEXT NOT NULL, -- 'primary_email', 'recovery_email'
  attempt_type TEXT NOT NULL, -- 'request_reset', 'verify_token', 'reset_password'
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_recovery_method CHECK (recovery_method IN ('primary_email', 'recovery_email')),
  CONSTRAINT valid_attempt_type CHECK (attempt_type IN ('request_reset', 'verify_token', 'reset_password'))
);

CREATE INDEX idx_recovery_history_user_id ON auth_schema.recovery_history(user_id);
CREATE INDEX idx_recovery_history_attempted_at ON auth_schema.recovery_history(attempted_at DESC);
CREATE INDEX idx_recovery_history_success ON auth_schema.recovery_history(success);
```

---

## 🔄 USE CASE FLOWS

### UC-1: Get Recovery Methods

**Actor**: Authenticated User  
**Precondition**: User is logged in

**Flow**:
1. User requests their recovery methods
2. System retrieves recovery methods from database
3. System returns recovery email (if configured) and verification status

**Response**:
```typescript
{
  success: true,
  recoveryMethods: {
    recoveryEmail: "backup@example.com",
    recoveryEmailVerified: true,
    recoveryEmailVerifiedAt: "2025-01-07T10:00:00Z",
    lastUpdatedAt: "2025-01-07T10:00:00Z"
  }
}
```

---

### UC-2: Update Recovery Methods

**Actor**: Authenticated User  
**Precondition**: User is logged in

**Flow**:
1. User provides new recovery email
2. System validates email format
3. System checks email is different from primary email
4. System updates recovery methods in database
5. System sends verification email to new recovery email
6. System marks recovery email as unverified until verified

**Validation Rules**:
- Recovery email must be valid email format
- Recovery email must be different from primary email
- Recovery email must not be used by another user

---

### UC-3: Request Password Reset (Enhanced)

**Actor**: Any User  
**Precondition**: None

**Flow**:
1. User provides email (primary or recovery)
2. System validates email format
3. System checks rate limiting (max 3 attempts per hour)
4. System finds user by email (primary or recovery)
5. System generates reset token (Supabase)
6. System sends reset email (Supabase)
7. System logs recovery attempt
8. System returns success message (same for existing/non-existing users for security)

**Rate Limiting**:
- Max 3 reset requests per hour per email
- Tracked in recovery_history table

---

### UC-4: Verify Reset Token

**Actor**: Any User  
**Precondition**: User has reset token from email

**Flow**:
1. User provides reset token
2. System verifies token with Supabase
3. System logs verification attempt
4. System returns token validity status

---

### UC-5: Reset Password with Token (Enhanced)

**Actor**: Any User  
**Precondition**: User has valid reset token

**Flow**:
1. User provides reset token and new password
2. System verifies token with Supabase
3. System validates new password against password policy
4. System updates password (Supabase)
5. System invalidates all existing sessions
6. System logs successful reset
7. System sends notification email
8. System returns success message

---

### UC-6: Get Recovery History

**Actor**: Authenticated User or Admin  
**Precondition**: User is logged in

**Flow**:
1. User/Admin requests recovery history
2. System retrieves history from database (last 90 days)
3. System returns paginated history

**Response**:
```typescript
{
  success: true,
  history: [
    {
      id: "uuid",
      recoveryMethod: "primary_email",
      attemptType: "request_reset",
      success: true,
      ipAddress: "192.168.1.1",
      attemptedAt: "2025-01-07T10:00:00Z"
    }
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    totalCount: 5
  }
}
```

---

## 🔐 SECURITY CONSIDERATIONS

### 1. Token Security
- ✅ Use Supabase built-in token generation (cryptographically secure)
- ✅ Tokens expire after 1 hour (Supabase default)
- ✅ Tokens are single-use (invalidated after use)

### 2. Rate Limiting
- ✅ Max 3 reset requests per hour per email
- ✅ Tracked in recovery_history table
- ✅ Returns same message for rate-limited requests (security)

### 3. Audit Trail
- ✅ All recovery attempts logged
- ✅ IP address and user agent tracked
- ✅ Success/failure tracked
- ✅ 90-day retention for compliance

### 4. Email Verification
- ✅ Recovery email must be verified before use
- ✅ Verification email sent automatically
- ✅ Unverified recovery emails cannot be used for reset

---

## 📝 API ENDPOINTS

### 1. GET /api/v1/account-recovery/methods
**Auth**: Required  
**Permission**: Own account or Admin  
**Response**: Recovery methods

### 2. PUT /api/v1/account-recovery/methods
**Auth**: Required  
**Permission**: Own account  
**Body**: `{ recoveryEmail: string }`  
**Response**: Updated recovery methods

### 3. POST /api/v1/account-recovery/request-reset
**Auth**: Not required  
**Body**: `{ email: string, method?: 'primary' | 'recovery' }`  
**Response**: Success message

### 4. POST /api/v1/account-recovery/verify-token
**Auth**: Not required  
**Body**: `{ token: string }`  
**Response**: Token validity

### 5. POST /api/v1/account-recovery/reset-password
**Auth**: Not required  
**Body**: `{ token: string, newPassword: string, confirmPassword: string }`  
**Response**: Success message

### 6. GET /api/v1/account-recovery/history
**Auth**: Required  
**Permission**: Own account or Admin  
**Query**: `?page=1&pageSize=20`  
**Response**: Recovery history

---

## ✅ TESTING STRATEGY

### Unit Tests
- ✅ RecoveryMethod Value Object validation
- ✅ RecoveryAttempt Value Object validation
- ✅ All use cases with mock repositories
- ✅ Rate limiting logic
- ✅ Password validation against policy

### Integration Tests
- ✅ Full recovery flow (request → verify → reset)
- ✅ Rate limiting enforcement
- ✅ Email sending (with Supabase)
- ✅ Session invalidation after reset

### Test Coverage Target
- Unit tests: 90%+
- Integration tests: Key flows

---

## 📅 IMPLEMENTATION PLAN

### Phase 1: Domain & Application Layer (Day 1)
- [ ] Create RecoveryMethod Value Object
- [ ] Create RecoveryAttempt Value Object
- [ ] Create IRecoveryMethodRepository interface
- [ ] Create IRecoveryHistoryRepository interface
- [ ] Create 6 use cases
- [ ] Write unit tests for domain & application

### Phase 2: Infrastructure Layer (Day 2)
- [ ] Create database migration (007_create_recovery_tables.sql)
- [ ] Implement SupabaseRecoveryMethodRepository
- [ ] Implement SupabaseRecoveryHistoryRepository
- [ ] Enhance SupabaseAuthService for recovery
- [ ] Write integration tests

### Phase 3: Presentation Layer (Day 3)
- [ ] Add 6 API endpoints to main.ts
- [ ] Add authentication middleware
- [ ] Add rate limiting middleware
- [ ] Test all endpoints manually

### Phase 4: Testing & Documentation (Day 4)
- [ ] Run full test suite
- [ ] Fix any bugs
- [ ] Update API documentation
- [ ] Update IDENTITY_SERVICE_AUDIT.md

---

**Last Updated**: 2025-01-07  
**Next Review**: After implementation complete

