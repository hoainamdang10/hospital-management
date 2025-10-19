# Email Verification Setup Guide

## Overview

Identity Service sử dụng custom JWT token-based email verification system với Resend email service. Hệ thống này được thiết kế để:

- ✅ Xác thực email cho patient self-registration
- ✅ Bảo mật với JWT signature verification
- ✅ Token có thời hạn (24 giờ)
- ✅ One-time use enforcement
- ✅ Rate limiting (max 3 active tokens per user)
- ✅ Email enumeration protection

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Email Verification Flow                   │
└─────────────────────────────────────────────────────────────┘

1. Patient Registration
   ↓
2. Generate JWT Token (24h expiry)
   ↓
3. Store Token in Database (auth_schema.email_verification_tokens)
   ↓
4. Send Verification Email (Resend API)
   ↓
5. User Clicks Link in Email
   ↓
6. Verify JWT Signature
   ↓
7. Check Token in Database (not used, not expired)
   ↓
8. Mark User as Verified
   ↓
9. Mark Token as Used
   ↓
10. Send Success Email
```

### Database Schema

```sql
CREATE TABLE auth_schema.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_verification_tokens_user_id ON auth_schema.email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON auth_schema.email_verification_tokens(expires_at);
CREATE INDEX idx_email_verification_tokens_is_used ON auth_schema.email_verification_tokens(is_used);
CREATE UNIQUE INDEX idx_email_verification_tokens_token ON auth_schema.email_verification_tokens(token);
```

## Environment Configuration

### Required Environment Variables

Add these to `backend/services-v2/.env`:

```env
# Resend API Key
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here

# Frontend URL for verification links
FRONTEND_URL=http://localhost:3000

# JWT Secret (already configured)
JWT_SECRET=your_jwt_secret_here
```

### Getting Resend API Key

1. **Sign up for Resend**:
   - Go to https://resend.com
   - Create free account
   - Free tier: 100 emails/day, 3,000 emails/month

2. **Create API Key**:
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Name: "Hospital Management - Identity Service"
   - Permissions: "Sending access"
   - Copy the API key (starts with `re_`)

3. **Add to .env**:
   ```env
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

4. **Verify Domain (Optional for Production)**:
   - Go to https://resend.com/domains
   - Add your domain
   - Add DNS records
   - Verify domain

## API Endpoints

### 1. Register User (Generates Verification Token)

```http
POST /auth/register
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid",
  "email": "patient@example.com",
  "requiresEmailVerification": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
}
```

**Email Sent:**
- Subject: "Xác thực email - Hospital Management System"
- Contains verification link: `http://localhost:3000/auth/verify-email?token=xxx`

### 2. Verify Email

```http
GET /auth/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response:**
```json
{
  "success": true,
  "userId": "uuid",
  "email": "patient@example.com",
  "message": "Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ."
}
```

**Error Responses:**
```json
// Invalid token
{
  "success": false,
  "error": "INVALID_TOKEN",
  "message": "Token xác thực không hợp lệ hoặc đã hết hạn"
}

// Token already used
{
  "success": false,
  "error": "TOKEN_ALREADY_USED",
  "message": "Token xác thực đã được sử dụng"
}

// Token expired
{
  "success": false,
  "error": "TOKEN_EXPIRED",
  "message": "Token xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực."
}
```

### 3. Resend Verification Email

```http
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "patient@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn."
}
```

**Rate Limit Response:**
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Bạn đã yêu cầu gửi lại email quá nhiều lần. Vui lòng thử lại sau."
}
```

## Testing

### Unit Tests

```bash
cd backend/services-v2/identity-service

# Test VerifyEmailUseCase
npm test -- VerifyEmailUseCase.test.ts

# Test ResendVerificationEmailUseCase
npm test -- ResendVerificationEmailUseCase.test.ts

# Test SupabaseEmailVerificationTokenRepository
npm test -- SupabaseEmailVerificationTokenRepository.test.ts
```

### Integration Tests

```bash
# Test email verification flow with real database
npm run test:integration -- email-verification-custom-token.integration.test.ts
```

### E2E Tests

```bash
# Test full email verification flow
npm run test:e2e -- 04-email-verification.spec.ts
```

## Security Features

### 1. JWT Signature Verification
- Token signed with JWT_SECRET
- Prevents token tampering
- Automatic expiration check

### 2. Database-Backed Tokens
- All tokens stored in database
- One-time use enforcement
- Audit trail (created_at, used_at)

### 3. Rate Limiting
- Max 3 active tokens per user
- Prevents spam/abuse
- Old tokens invalidated when resending

### 4. Email Enumeration Protection
- Resend endpoint doesn't reveal if email exists
- Same response for existing/non-existing emails
- Security best practice

### 5. Token Expiration
- 24-hour expiration
- Automatic cleanup of expired tokens
- User can request new token

## Troubleshooting

### Email Not Sending

**Check Resend API Key:**
```bash
# Verify API key is set
echo $RESEND_API_KEY

# Test Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'
```

**Check Logs:**
```bash
# View identity service logs
docker logs hospital-identity-service-v2 --tail 100

# Look for email sending errors
docker logs hospital-identity-service-v2 | grep "Email sending"
```

### Token Verification Failing

**Check JWT Secret:**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Ensure it's the same secret used for token generation
```

**Check Token in Database:**
```sql
-- Connect to Supabase
SELECT * FROM auth_schema.email_verification_tokens
WHERE email = 'patient@example.com'
ORDER BY created_at DESC
LIMIT 5;
```

### User Can't Login After Verification

**Check User Verification Status:**
```sql
SELECT id, email, is_email_verified
FROM auth_schema.users
WHERE email = 'patient@example.com';
```

**Manually Verify User (Emergency):**
```sql
UPDATE auth_schema.users
SET is_email_verified = true
WHERE email = 'patient@example.com';
```

## Production Deployment

### 1. Configure Resend Domain

For production, verify your domain with Resend:

```bash
# Add DNS records
TXT  @  resend._domainkey  v=DKIM1; k=rsa; p=...
TXT  @  _resend  resend-domain-verification=...
```

### 2. Update Environment Variables

```env
# Production Resend API Key
RESEND_API_KEY=re_production_key_here

# Production Frontend URL
FRONTEND_URL=https://hospital.example.com

# Production JWT Secret (rotate from development)
JWT_SECRET=production_secret_minimum_32_characters
```

### 3. Disable Supabase Email Confirmation

Go to Supabase Dashboard:
1. Authentication → Email Auth
2. Disable "Confirm email"
3. Save changes

This prevents conflict between Supabase built-in and custom verification.

### 4. Monitor Email Sending

```bash
# Check Resend dashboard
https://resend.com/emails

# Monitor logs
docker logs hospital-identity-service-v2 -f | grep "Email"
```

## Email Templates

Email templates are in Vietnamese and include:

### 1. Verification Email
- Subject: "Xác thực email - Hospital Management System"
- Contains verification link
- Expires in 24 hours

### 2. Verification Success Email
- Subject: "Email đã được xác thực thành công"
- Confirms successful verification
- Provides login link

## Support

For issues or questions:
- Check logs: `docker logs hospital-identity-service-v2`
- Review tests: `npm test`
- Check Resend dashboard: https://resend.com/emails
- Contact: Hospital Management Team

