# Email Verification Bounded Context Analysis

## 1. Bounded Context Definition

**Context Name**: Email Verification
**Parent Context**: Identity & Access Management
**Responsibility**: Verify user email ownership during registration process

### Core Concepts
- Email verification is part of user registration workflow
- Ensures email ownership before granting full access
- Supports HIPAA compliance requirements for patient data access

---

## 2. Domain Model

### Aggregates
- **User** (existing) - Root aggregate, owns email verification status
  - `isEmailVerified: boolean` - Verification status
  - `verifyEmail(): void` - Domain method to mark email as verified

### Value Objects
- **EmailVerificationToken** (new)
  - `token: string` - JWT token with 24h expiration
  - `email: Email` - Email address to verify
  - `expiresAt: Date` - Token expiration timestamp
  - `isExpired(): boolean` - Check if token is expired

### Domain Events
- **EmailVerificationRequested** (new)
  - Triggered when user registers
  - Payload: userId, email, token
  
- **EmailVerified** (existing: UserActivatedEvent)
  - Triggered when email is verified
  - Payload: userId, email, verifiedAt

---

## 3. Application Layer Interfaces

### IEmailService (new)
**Location**: `src/application/services/IEmailService.ts`
**Purpose**: Abstract email sending operations
**Responsibility**: Send verification emails (infrastructure-agnostic)

```typescript
export interface IEmailService {
  /**
   * Send email verification email
   * @param email User email address
   * @param token Verification token
   * @param userName User's full name
   */
  sendVerificationEmail(
    email: string, 
    token: string, 
    userName: string
  ): Promise<void>;

  /**
   * Send verification success notification
   * @param email User email address
   * @param userName User's full name
   */
  sendVerificationSuccessEmail(
    email: string,
    userName: string
  ): Promise<void>;
}
```

### IEmailVerificationTokenRepository (new)
**Location**: `src/application/repositories/IEmailVerificationTokenRepository.ts`
**Purpose**: Persist and retrieve verification tokens
**Responsibility**: Token storage and validation

```typescript
export interface IEmailVerificationTokenRepository {
  /**
   * Store verification token
   */
  store(data: {
    userId: string;
    email: string;
    token: string;
    expiresAt: Date;
  }): Promise<void>;

  /**
   * Find token by token string
   */
  findByToken(token: string): Promise<{
    userId: string;
    email: string;
    expiresAt: Date;
    isUsed: boolean;
  } | null>;

  /**
   * Mark token as used
   */
  markAsUsed(token: string): Promise<void>;

  /**
   * Delete expired tokens (cleanup)
   */
  deleteExpired(): Promise<void>;
}
```

---

## 4. Use Cases

### SendEmailVerificationUseCase (new)
**Trigger**: After user registration
**Input**: userId, email, userName
**Output**: success, message
**Side Effects**: 
- Generate verification token
- Store token in database
- Send verification email
- Publish EmailVerificationRequested event

### VerifyEmailUseCase (update existing)
**Trigger**: User clicks verification link
**Input**: token
**Output**: success, message
**Side Effects**:
- Validate token (not expired, not used)
- Update user.isEmailVerified = true
- Mark token as used
- Publish EmailVerified event

### ResendVerificationEmailUseCase (new)
**Trigger**: User requests resend
**Input**: email
**Output**: success, message
**Side Effects**:
- Invalidate old tokens
- Generate new token
- Send new verification email

---

## 5. Infrastructure Layer

### ResendEmailService (new)
**Location**: `src/infrastructure/email/ResendEmailService.ts`
**Implements**: IEmailService
**Dependencies**: Resend SDK
**Configuration**: 
- RESEND_API_KEY (environment variable)
- FROM_EMAIL (environment variable)
- FRONTEND_URL (environment variable)

### SupabaseEmailVerificationTokenRepository (new)
**Location**: `src/infrastructure/repositories/SupabaseEmailVerificationTokenRepository.ts`
**Implements**: IEmailVerificationTokenRepository
**Database**: Supabase PostgreSQL
**Schema**: auth_schema.email_verification_tokens

---

## 6. Database Schema

### Table: email_verification_tokens
**Schema**: auth_schema
**Purpose**: Store email verification tokens

```sql
CREATE TABLE auth_schema.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- RLS Policies
ALTER TABLE auth_schema.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON auth_schema.email_verification_tokens
  FOR ALL USING (auth.role() = 'service_role');
```

---

## 7. API Endpoints

### POST /auth/resend-verification
**Purpose**: Resend verification email
**Auth**: Optional (can be called by unauthenticated users)
**Request**:
```json
{
  "email": "patient@example.com"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư."
}
```

### GET /auth/verify-email?token=xxx
**Purpose**: Verify email with token
**Auth**: None (public endpoint)
**Response**:
```json
{
  "success": true,
  "message": "Email đã được xác thực thành công!",
  "redirectUrl": "/login"
}
```

---

## 8. Dependencies

### External Dependencies
- **Resend SDK**: `npm install resend`
- **jsonwebtoken**: Already installed (for token generation)

### Internal Dependencies
- **Domain Layer**: User aggregate, Email value object
- **Application Layer**: IUserRepository, IEventPublisher, ILogger
- **Infrastructure Layer**: SupabaseClient

---

## 9. Configuration

### Environment Variables
```env
# Email Service
RESEND_API_KEY=re_xxx
FROM_EMAIL=noreply@hospital.com
FROM_NAME=Hospital Management System

# Frontend
FRONTEND_URL=http://localhost:3000

# Token
EMAIL_VERIFICATION_TOKEN_EXPIRY=24h
```

---

## 10. Clean Architecture Compliance

### Dependency Direction
```
Domain (EmailVerificationToken)
  ↑
Application (IEmailService, IEmailVerificationTokenRepository)
  ↑
Infrastructure (ResendEmailService, SupabaseEmailVerificationTokenRepository)
  ↑
Presentation (Controllers, Routes)
```

### Bounded Context Boundaries
- **Email Verification** context is INTERNAL to Identity Service
- Does NOT communicate with other services
- Uses domain events for internal consistency
- Future: Can publish integration events for Notifications Service

---

## 11. Testing Strategy

### Unit Tests
- EmailVerificationToken value object validation
- SendEmailVerificationUseCase logic
- VerifyEmailUseCase logic
- Token expiration logic

### Integration Tests
- ResendEmailService email sending
- SupabaseEmailVerificationTokenRepository CRUD operations
- Full verification flow (register → send email → verify)

### E2E Tests
- User registration triggers verification email
- User clicks verification link
- User resends verification email
- Token expiration handling

---

## 12. Migration Path

### Phase 1: Disable Supabase Email Confirmation
- Supabase Dashboard → Authentication → Providers → Email
- Disable "Confirm email" checkbox

### Phase 2: Implement Custom Email Verification
- Create domain value objects
- Create application interfaces
- Implement infrastructure services
- Update use cases
- Create API endpoints

### Phase 3: Testing
- Unit tests
- Integration tests
- E2E tests

### Phase 4: Deployment
- Run database migration
- Deploy service
- Monitor email delivery

---

**Author**: Hospital Management Team
**Version**: 2.0.0
**Last Updated**: 2025-01-07

