# Staff Activation Flow - Complete Documentation

## Overview

Luồng kích hoạt tài khoản nhân viên (Staff Activation Flow) cho phép admin tạo lời mời và nhân viên tự kích hoạt tài khoản của mình thông qua link email.

**Supported Staff Roles (4 roles):**
- ADMIN - System administrator
- DOCTOR - Medical doctor
- NURSE - Registered nurse
- RECEPTIONIST - Front desk staff

**Note:** PATIENT role không được phép tạo qua staff invitation (chỉ self-registration).

## Architecture

### Components

1. **ProvisionStaffUseCase** - Admin tạo lời mời
2. **AcceptStaffInvitationUseCase** - Staff kích hoạt tài khoản
3. **SupabaseUserRepository** - Quản lý invitations và users
4. **Domain Events** - StaffInvitationCreated, UserCreated, UserActivated

## Complete Flow

### Step 1: Admin Creates Staff Invitation

**Endpoint:** `POST /admin/staff/register`

**Request:**
```json
{
  "email": "doctor@hospital.com",
  "fullName": "Dr. Nguyễn Văn A",
  "roleType": "DOCTOR",
  "phoneNumber": "0912345678"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "staff-invitation-id",
  "invitationToken": "abc123...",
  "invitationUrl": "https://hospital.com/activate?token=abc123...",
  "expiresAt": "2024-01-15T10:00:00Z"
}
```

**What Happens:**
1. Validate admin permissions
2. Generate secure invitation token (crypto.randomBytes)
3. Store invitation in `staff_invitations` table
4. Send invitation email with activation link
5. Publish `StaffInvitationCreatedEvent`

### Step 2: Staff Receives Email

Email contains:
- Activation link with token
- Expiration time (7 days)
- Instructions

### Step 3: Staff Activates Account

**Endpoint:** `POST /auth/activate-staff` (PUBLIC)

**Request:**
```json
{
  "invitationToken": "abc123...",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "fullName": "Dr. Nguyễn Văn A",
  "phoneNumber": "0912345678"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user-uuid",
  "email": "doctor@hospital.com",
  "role": "DOCTOR",
  "message": "Tài khoản nhân viên đã được kích hoạt thành công"
}
```

**What Happens:**
1. Verify invitation token (valid, not expired, not used)
2. Validate password requirements
3. Create auth user in Supabase Auth
4. Create user profile in `auth_schema.users`
5. Mark invitation as ACCEPTED
6. Publish `UserCreatedEvent` and `UserActivatedEvent`

### Step 4: Staff Can Login

Staff can now login with:
- Email: `doctor@hospital.com`
- Password: Set in Step 3

## Database Schema

### staff_invitations Table

```sql
CREATE TABLE auth_schema.staff_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth_schema.users(id),
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, EXPIRED
  expires_at TIMESTAMP NOT NULL,
  invitation_data JSONB,
  accepted_at TIMESTAMP,
  accepted_by_user_id UUID REFERENCES auth_schema.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_staff_invitations_token ON auth_schema.staff_invitations(invitation_token);
CREATE INDEX idx_staff_invitations_email ON auth_schema.staff_invitations(email);
CREATE INDEX idx_staff_invitations_status ON auth_schema.staff_invitations(status);
```

## Security Considerations

### Token Security
- Tokens are generated using `crypto.randomBytes(32)` (256-bit)
- Tokens are hashed before storage (optional enhancement)
- Tokens expire after 7 days
- Tokens can only be used once

### Validation
- Password must be at least 8 characters
- Email format validation
- Phone number format validation (10-11 digits)
- Role validation against allowed staff roles

### Authorization
- Only admins can create staff invitations
- Activation endpoint is public (no auth required)
- Token verification prevents unauthorized access

## Error Handling

### Common Errors

| Error Code | Message | Cause |
|------------|---------|-------|
| `VALIDATION_ERROR` | Token mời không hợp lệ | Empty or malformed token |
| `INVALID_INVITATION` | Liên kết mời không hợp lệ hoặc đã hết hạn | Token expired or already used |
| `USER_ALREADY_EXISTS` | Tài khoản đã được kích hoạt trước đó | Email already registered |
| `ACTIVATION_FAILED` | Kích hoạt tài khoản thất bại | Database or system error |

## Domain Events

### StaffInvitationCreatedEvent
```typescript
{
  eventType: 'StaffInvitationCreated',
  aggregateId: 'doctor@hospital.com',
  aggregateType: 'StaffInvitation',
  payload: {
    email: 'doctor@hospital.com',
    role: 'DOCTOR',
    invitedBy: 'admin-user-id',
    invitationToken: 'abc123...',
    expiresAt: '2024-01-15T10:00:00Z'
  }
}
```

### UserCreatedEvent
```typescript
{
  eventType: 'UserCreated',
  aggregateId: 'user-uuid',
  aggregateType: 'User',
  payload: {
    userId: 'user-uuid',
    email: 'doctor@hospital.com',
    role: 'DOCTOR'
  }
}
```

### UserActivatedEvent
```typescript
{
  eventType: 'UserActivated',
  aggregateId: 'user-uuid',
  aggregateType: 'User',
  payload: {
    userId: 'user-uuid',
    email: 'doctor@hospital.com',
    activatedAt: '2024-01-08T10:00:00Z'
  }
}
```

## Testing

### Unit Tests
Location: `tests/unit/application/use-cases/AcceptStaffInvitationUseCase.test.ts`

Coverage:
- ✅ Happy path scenarios
- ✅ Validation tests (password, email, phone)
- ✅ Business rules (token validity, user existence)
- ✅ Error handling
- ✅ Edge cases

Run tests:
```bash
npm test -- AcceptStaffInvitationUseCase.test.ts
```

### Integration Tests
TODO: Add integration tests with real database

## API Examples

### cURL Examples

**Create Staff Invitation (Admin):**
```bash
curl -X POST http://localhost:3021/admin/staff/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "email": "doctor@hospital.com",
    "fullName": "Dr. Nguyễn Văn A",
    "roleType": "DOCTOR",
    "phoneNumber": "0912345678"
  }'
```

**Activate Staff Account:**
```bash
curl -X POST http://localhost:3021/auth/activate-staff \
  -H "Content-Type: application/json" \
  -d '{
    "invitationToken": "abc123...",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "fullName": "Dr. Nguyễn Văn A",
    "phoneNumber": "0912345678"
  }'
```

## Future Enhancements

1. **Email Templates** - Rich HTML email templates
2. **Resend Invitation** - Allow admin to resend expired invitations
3. **Invitation Tracking** - Track invitation open/click rates
4. **Bulk Invitations** - Create multiple invitations at once
5. **Custom Expiration** - Allow admin to set custom expiration time
6. **Token Hashing** - Hash tokens before storage for extra security

## Troubleshooting

### Token Not Found
- Check if token is correct
- Verify token hasn't expired
- Ensure invitation status is PENDING

### User Already Exists
- Check if email is already registered
- Verify invitation hasn't been used before

### Email Not Sent
- Check email service configuration
- Verify SMTP settings
- Check email logs

## Related Documentation

- [Identity Service Architecture](./ARCHITECTURE.md)
- [RBAC Implementation](./RBAC.md)
- [Domain Events](./DOMAIN_EVENTS.md)

