# ✅ Phase 2: Authentication - Verify-First Approach

**Ngày hoàn thành**: 6/11/2025  
**Thời gian**: ~3 giờ  
**Status**: ✅ COMPLETED

---

## 🔐 Verify-First Flow

### Backend Architecture (Identity Service)
```
1. User submits registration
   ↓
2. Backend stores in `pending_registrations` table (NOT `users`)
   ↓
3. Generate JWT verification token (24h expiry)
   ↓
4. Send verification email with link
   ↓
5. User clicks link → Verify email
   ↓
6. Backend creates actual user in `users` table
   ↓
7. User can now login
```

### Key Security Features
- ✅ **No user created until email verified** - Prevents spam accounts
- ✅ **24-hour token expiry** - Security best practice
- ✅ **Role hardcoded to PATIENT** - Prevents privilege escalation
- ✅ **Staff accounts via admin only** - Separate endpoint
- ✅ **Pending registration cleanup** - Auto-expire after 24h

---

## 📦 Files Created

### 1. **Auth Types** (`lib/types/auth.ts`)
```typescript
export interface RegisterResponse {
  success: boolean;
  message: string;
  pendingRegistrationId?: string; // Verify-first
  email?: string;
  requiresEmailVerification: boolean; // Always true
  user?: User; // Only after verification
  accessToken?: string; // Only after verification
  refreshToken?: string; // Only after verification
}
```

### 2. **Auth API Service** (`lib/api/auth.service.ts`)
- `login(credentials)` - POST /api/v1/auth/login
- `register(data)` - POST /api/v1/auth/register
- `verifyEmail({ token })` - POST /api/v1/auth/verify-email
- `refreshToken(data)` - POST /api/v1/auth/refresh
- `logout()` - POST /api/v1/auth/logout
- `forgotPassword(email)` - POST /api/v1/auth/forgot-password
- `resetPassword(data)` - POST /api/v1/auth/reset-password
- `changePassword(data)` - POST /api/v1/auth/change-password
- `getCurrentUser()` - GET /api/v1/auth/me

### 3. **Auth Context** (`lib/contexts/AuthContext.tsx`)

**State Management**:
```typescript
{
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Methods**:
- `login(credentials)` - Login & save tokens
- `register(data)` - Register (verify-first, no tokens)
- `logout()` - Clear auth state
- `updateUser(user)` - Update user profile

**Features**:
- ✅ Auto-load from localStorage on mount
- ✅ Verify token on init
- ✅ Role-based redirect after login
- ✅ Toast notifications
- ✅ Error handling

### 4. **Login Page** (`app/login/page.tsx`)

**Features**:
- ✅ Email + Password form
- ✅ Show/hide password toggle
- ✅ Remember me checkbox
- ✅ Forgot password link
- ✅ Form validation with Zod
- ✅ Loading states
- ✅ Beautiful gradient sidebar
- ✅ Responsive design

**Validation**:
```typescript
email: z.string().email()
password: z.string().min(6)
```

### 5. **Register Page** (`app/register/page.tsx`)

**Features**:
- ✅ Full name, email, phone, password fields
- ✅ Password strength validation (8+ chars, uppercase, lowercase, number)
- ✅ Confirm password matching
- ✅ Terms & conditions checkbox
- ✅ Success screen with email verification instructions
- ✅ Verify-first flow explanation
- ✅ Resend verification email button (placeholder)

**Validation**:
```typescript
password: z.string()
  .min(8)
  .regex(/[A-Z]/, 'Must have uppercase')
  .regex(/[a-z]/, 'Must have lowercase')
  .regex(/[0-9]/, 'Must have number')
```

**Success Screen**:
```
✅ Registration successful!
📧 Check your email: user@example.com

Next steps:
1. Open email from Hospital Management System
2. Click verification link
3. Account will be activated
4. Login and start using
```

### 6. **Verify Email Page** (`app/verify-email/page.tsx`)

**Flow**:
```
User clicks link in email
  ↓
GET /verify-email?token=xxx
  ↓
Show loading spinner
  ↓
Call API: POST /api/v1/auth/verify-email
  ↓
Success → Redirect to /login?verified=true
Error → Show error message
```

**States**:
- ✅ Loading - Spinner + "Verifying..."
- ✅ Success - Green checkmark + redirect
- ✅ Error - Red X + error reasons

---

## 🔄 Complete User Journey

### New User Registration
```
1. Visit /register
2. Fill form (name, email, password, phone)
3. Accept terms
4. Click "Đăng ký"
   ↓
5. Backend: Create pending_registration
6. Backend: Send verification email
7. Frontend: Show success screen
   ↓
8. User checks email
9. Click verification link
10. Redirect to /verify-email?token=xxx
    ↓
11. Frontend: Call verify API
12. Backend: Create actual user
13. Frontend: Show success + redirect to /login
    ↓
14. User can now login
```

### Login Flow
```
1. Visit /login
2. Enter email + password
3. Click "Đăng nhập"
   ↓
4. Backend: Validate credentials
5. Backend: Return user + tokens
6. Frontend: Save to localStorage
7. Frontend: Redirect based on role
   - PATIENT → /patient/dashboard
   - DOCTOR → /doctor/dashboard
   - ADMIN → /admin/dashboard
```

### Token Refresh Flow
```
1. API call returns 401
   ↓
2. Axios interceptor catches error
3. Get refreshToken from localStorage
4. Call POST /api/v1/auth/refresh
   ↓
5. Success: Get new accessToken
6. Save new token
7. Retry original request
   ↓
8. Fail: Clear auth + redirect to /login
```

---

## 🧪 Testing Checklist

### Registration
- [ ] Fill all required fields → Success screen
- [ ] Invalid email → Validation error
- [ ] Weak password → Validation error
- [ ] Password mismatch → Validation error
- [ ] Duplicate email → "Email already registered"
- [ ] Don't accept terms → Validation error

### Email Verification
- [ ] Click valid link → Success + redirect
- [ ] Click expired link (>24h) → Error
- [ ] Click used link → Error
- [ ] Invalid token → Error

### Login
- [ ] Valid credentials → Redirect to dashboard
- [ ] Invalid email → Error
- [ ] Wrong password → Error
- [ ] Unverified email → Error "Please verify email"
- [ ] Remember me → Token persists after browser close

### Token Management
- [ ] Access token expires → Auto refresh
- [ ] Refresh token expires → Redirect to login
- [ ] Logout → Clear all tokens

---

## 📊 API Integration Status

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v1/auth/register` | POST | Create pending registration | ✅ |
| `/api/v1/auth/verify-email` | GET/POST | Verify email token | ✅ |
| `/api/v1/auth/login` | POST | Login user | ✅ |
| `/api/v1/auth/refresh` | POST | Refresh access token | ✅ |
| `/api/v1/auth/logout` | POST | Logout user | ✅ |
| `/api/v1/auth/me` | GET | Get current user | ✅ |
| `/api/v1/auth/forgot-password` | POST | Request password reset | ⏳ |
| `/api/v1/auth/reset-password` | POST | Reset password | ⏳ |

---

## 🚀 Next Steps (Phase 3)

### Protected Routes
- [ ] Create `ProtectedRoute` wrapper component
- [ ] Check auth before rendering
- [ ] Redirect to login if not authenticated
- [ ] Role-based access control

### User Profile
- [ ] View profile page
- [ ] Edit profile
- [ ] Change password
- [ ] Upload avatar

### Navbar Integration
- [ ] Show user avatar when logged in
- [ ] Dropdown menu (Profile, Settings, Logout)
- [ ] Hide login/register when authenticated

---

## 📝 Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3101
```

---

## 🎯 Summary

**Phase 2 Complete!** ✅

✅ **Implemented**:
- Verify-first registration flow
- Email verification system
- Login with JWT
- Token refresh mechanism
- Auth context & state management
- Beautiful UI for auth pages

⏭️ **Next**:
- Protected routes
- User profile management
- Navbar with auth state
- Role-based access control

**Total Time**: Phase 1 (2h) + Phase 2 (3h) = **5 hours**  
**Remaining**: ~9-14 hours for Phases 3-5
