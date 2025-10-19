# Staff Invitation System - Frontend Implementation Guide

## Overview

Hệ thống Staff Invitation cho phép admin tạo lời mời kích hoạt tài khoản cho nhân viên mới (ADMIN, DOCTOR, NURSE, RECEPTIONIST). Nhân viên nhận email với link kích hoạt và tự tạo mật khẩu.

## Architecture

### Backend (Identity Service - Port 3021)
- **POST /admin/staff/register** - Admin tạo staff invitation (Protected)
- **POST /auth/activate-staff** - Staff kích hoạt tài khoản (Public)

### Frontend Components

#### 1. StaffActivationForm
**Location**: `frontend/modules/identity/components/StaffActivationForm.tsx`

Component cho phép staff kích hoạt tài khoản từ invitation link.

**Props**:
```typescript
interface StaffActivationFormProps {
  invitationToken: string;
  onSuccess?: (data: { userId: string; email: string; role: string }) => void;
  onError?: (error: string) => void;
}
```

**Features**:
- Validate password strength (min 8 chars, uppercase, lowercase, number)
- Validate phone number (10-11 digits)
- Success state with redirect to login
- Error handling

**Usage**:
```tsx
import { StaffActivationForm } from '@/modules/identity';

<StaffActivationForm
  invitationToken={token}
  onSuccess={(data) => console.log('Activated:', data)}
  onError={(error) => console.error(error)}
/>
```

#### 2. ProvisionStaffForm
**Location**: `frontend/modules/identity/components/ProvisionStaffForm.tsx`

Component cho admin tạo staff invitation.

**Props**:
```typescript
interface ProvisionStaffFormProps {
  accessToken: string;
  onSuccess?: (data: { invitationUrl: string; expiresAt: string }) => void;
  onError?: (error: string) => void;
}
```

**Features**:
- Role selection (ADMIN, DOCTOR, NURSE, RECEPTIONIST)
- Email validation
- Phone number validation (optional)
- Display invitation URL with copy button
- Show expiry date (7 days)

**Usage**:
```tsx
import { ProvisionStaffForm } from '@/modules/identity';

<ProvisionStaffForm
  accessToken={userAccessToken}
  onSuccess={(data) => console.log('Invitation created:', data)}
  onError={(error) => console.error(error)}
/>
```

### Pages

#### 1. Staff Activation Page
**URL**: `/auth/activate?token=xxx`
**Location**: `frontend/app/auth/activate/page.tsx`

Public page cho staff kích hoạt tài khoản.

**Flow**:
1. Staff nhận email với link: `http://localhost:3000/auth/activate?token=xxx`
2. Page extract token từ URL query params
3. Hiển thị StaffActivationForm
4. Sau khi kích hoạt thành công, redirect đến `/login` sau 3 giây

#### 2. Admin Staff Management Page
**URL**: `/admin/staff`
**Location**: `frontend/app/admin/staff/page.tsx`

Protected page cho admin quản lý staff invitations.

**Access Control**:
- Chỉ ADMIN và SUPER_ADMIN có quyền truy cập
- Redirect đến `/login` nếu chưa đăng nhập
- Hiển thị error nếu không có quyền

**Features**:
- Tạo staff invitation
- Hiển thị invitation URL
- Copy invitation URL to clipboard
- Hướng dẫn quy trình kích hoạt
- Thông tin về các vai trò

### API Services

**Location**: `frontend/modules/identity/services/identityService.ts`

#### provisionStaff()
```typescript
export async function provisionStaff(
  data: ProvisionStaffRequest,
  accessToken: string
): Promise<ProvisionStaffResponse>
```

**Request**:
```typescript
interface ProvisionStaffRequest {
  email: string;
  fullName: string;
  roleType: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
  phoneNumber?: string;
}
```

**Response**:
```typescript
interface ProvisionStaffResponse {
  success: boolean;
  invitationToken?: string;
  invitationUrl?: string;
  expiresAt?: string;
  error?: string;
  errorCode?: string;
}
```

#### acceptStaffInvitation()
```typescript
export async function acceptStaffInvitation(
  data: AcceptStaffInvitationRequest
): Promise<AcceptStaffInvitationResponse>
```

**Request**:
```typescript
interface AcceptStaffInvitationRequest {
  invitationToken: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber?: string;
}
```

**Response**:
```typescript
interface AcceptStaffInvitationResponse {
  success: boolean;
  userId?: string;
  email?: string;
  role?: string;
  message?: string;
  error?: string;
  errorCode?: string;
}
```

## Complete Flow

### 1. Admin Creates Invitation

```
Admin → /admin/staff
  ↓
Fill form (email, fullName, roleType, phoneNumber)
  ↓
POST /admin/staff/register
  ↓
Backend creates invitation in database
  ↓
Backend publishes StaffInvitationCreatedEvent
  ↓
Notification Service sends email (planned)
  ↓
Admin receives invitation URL
```

### 2. Staff Activates Account

```
Staff receives email
  ↓
Click link: /auth/activate?token=xxx
  ↓
Fill form (fullName, phoneNumber, password, confirmPassword)
  ↓
POST /auth/activate-staff
  ↓
Backend validates token (not expired, not used)
  ↓
Backend creates user in auth.users
  ↓
Backend creates profile in auth_schema.user_profiles
  ↓
Backend marks invitation as ACCEPTED
  ↓
Staff redirected to /login
```

### 3. Staff Logs In

```
Staff → /login
  ↓
Enter email + password
  ↓
POST /auth/login
  ↓
Receive JWT tokens
  ↓
Redirect to /dashboard
```

## Security Features

### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters recommended

### Token Security
- Invitation token: Secure random 32 bytes (hex)
- Token expiry: 7 days
- One-time use only
- Stored in database with status tracking

### Access Control
- Admin endpoints require valid JWT + ADMIN role
- Public activation endpoint (no auth required)
- Email verification automatic for staff accounts

## Database Schema

### staff_invitations table (auth_schema)

```sql
CREATE TABLE auth_schema.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')),
  invited_by UUID NOT NULL,
  invitation_token VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  status VARCHAR DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
  invitation_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_IDENTITY_SERVICE_URL=http://localhost:3021
```

**Backend** (`backend/services-v2/.env`):
```env
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=re_xxx (for email sending)
```

## Testing

### Manual Testing

#### 1. Test Admin Create Invitation
```bash
# Start backend
cd backend/services-v2
npm run dev:core

# Start frontend
cd frontend
npm run dev

# Login as admin
# Navigate to http://localhost:3000/admin/staff
# Fill form and create invitation
# Copy invitation URL
```

#### 2. Test Staff Activation
```bash
# Open invitation URL in browser
# Example: http://localhost:3000/auth/activate?token=xxx
# Fill activation form
# Submit and verify redirect to login
```

#### 3. Test Staff Login
```bash
# Navigate to http://localhost:3000/login
# Enter email and password from activation
# Verify successful login
```

### API Testing with curl

#### Create Invitation (Admin)
```bash
curl -X POST http://localhost:3021/admin/staff/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.vn",
    "fullName": "Dr. Nguyen Van A",
    "roleType": "DOCTOR",
    "phoneNumber": "0912345678"
  }'
```

#### Activate Staff Account
```bash
curl -X POST http://localhost:3021/auth/activate-staff \
  -H "Content-Type: application/json" \
  -d '{
    "invitationToken": "xxx",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123",
    "fullName": "Dr. Nguyen Van A",
    "phoneNumber": "0912345678"
  }'
```

## Troubleshooting

### Issue: "Invitation token not found"
- Check token in URL is correct
- Verify token hasn't expired (7 days)
- Check token hasn't been used already

### Issue: "Unauthorized" when creating invitation
- Verify user is logged in
- Check user has ADMIN or SUPER_ADMIN role
- Verify JWT token is valid

### Issue: "Email already exists"
- Staff email already registered
- Check if invitation was already accepted
- Use different email or delete existing user

### Issue: Password validation fails
- Ensure password has min 8 characters
- Include uppercase, lowercase, and number
- Passwords must match

## Next Steps

### Planned Features
1. **Email Integration**: Automatic email sending via Notification Service
2. **Invitation Management**: List, resend, cancel invitations
3. **Bulk Invitation**: Create multiple invitations at once
4. **Invitation Templates**: Pre-defined templates for different roles
5. **Audit Trail**: Track all invitation activities

### Integration Points
- **Notification Service**: Handle StaffInvitationCreatedEvent to send emails
- **Provider/Staff Service**: Sync staff profile data after activation
- **Audit Service**: Log all invitation and activation events

## Support

For issues or questions:
- Check backend logs: `docker logs hospital-identity-service-v2`
- Check frontend console for errors
- Verify database state in Supabase dashboard
- Contact: support@hospital.vn

---

**Version**: 2.0.0
**Last Updated**: 2025-01-07
**Author**: Hospital Management Team
