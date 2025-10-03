# RBAC Implementation Guide

**Date**: 2025-10-03  
**Status**: ✅ COMPLETED  
**Version**: 2.0.0

---

## 📊 OVERVIEW

Đã implement đầy đủ Role-Based Access Control (RBAC) system với:
- ✅ Permission Service với caching
- ✅ Authentication Middleware (JWT verification)
- ✅ Permission Middleware (fine-grained access control)
- ✅ Integration Tests
- ✅ Protected API endpoints

---

## 🏗️ ARCHITECTURE

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │ Authentication       │  │ Permission               │    │
│  │ Middleware           │  │ Middleware               │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ IPermissionService Interface                         │  │
│  │ - hasPermission()                                    │  │
│  │ - hasAnyPermission()                                 │  │
│  │ - hasAllPermissions()                                │  │
│  │ - getUserPermissions()                               │  │
│  │ - checkPermission()                                  │  │
│  │ - canAccessResource()                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │ PermissionService    │  │ SupabaseAuthClient       │    │
│  │ Implementation       │  │                          │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │ RedisCacheService    │  │ UserRepository           │    │
│  │ (Optional)           │  │                          │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
│  - user_profiles                                            │
│  - healthcare_roles                                         │
│  - role_permissions                                         │
│  - user_sessions                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 PERMISSION SYSTEM

### Permission Format

Permissions follow the format: `resource:action`

**Examples**:
- `patients:read` - Read patient data
- `patients:write` - Create/Update patient data
- `appointments:create` - Create appointments
- `medical_records:read` - Read medical records
- `*` - Admin wildcard (all permissions)

### Wildcard Support

- `*` - Full admin access (all resources, all actions)
- `patients:*` - All actions on patients resource
- `*:read` - Read action on all resources

### Special Actions

- `write` - Includes both `create` and `update`
- `manage` - All actions on specific resource

---

## 📝 USAGE EXAMPLES

### 1. Basic Authentication

```typescript
import { AuthenticationMiddleware } from './presentation/middleware/AuthenticationMiddleware';

// Require authentication
app.get('/protected',
  authMiddleware.authenticate(),
  (req, res) => {
    res.json({ user: req.user });
  }
);

// Optional authentication
app.get('/public-or-private',
  authMiddleware.optionalAuthenticate(),
  (req, res) => {
    if (req.user) {
      res.json({ message: 'Authenticated', user: req.user });
    } else {
      res.json({ message: 'Public access' });
    }
  }
);
```

### 2. Role-Based Access

```typescript
// Require admin role
app.get('/admin',
  authMiddleware.authenticate(),
  authMiddleware.requireAdmin(),
  (req, res) => {
    res.json({ message: 'Admin only' });
  }
);

// Require specific role
app.get('/doctors',
  authMiddleware.authenticate(),
  authMiddleware.requireRole('doctor', 'admin'),
  (req, res) => {
    res.json({ message: 'Doctors and admins only' });
  }
);
```

### 3. Permission-Based Access

```typescript
import { PermissionMiddleware } from './presentation/middleware/PermissionMiddleware';
import { ResourceType, Action } from './application/services/IPermissionService';

// Require specific permission
app.get('/patients',
  authMiddleware.authenticate(),
  permissionMiddleware.requireResource(ResourceType.PATIENTS, Action.READ),
  (req, res) => {
    res.json({ patients: [] });
  }
);

// Require any of multiple permissions
app.get('/data',
  authMiddleware.authenticate(),
  permissionMiddleware.requireAny('patients:read', 'appointments:read'),
  (req, res) => {
    res.json({ data: [] });
  }
);

// Require all permissions
app.post('/critical-action',
  authMiddleware.authenticate(),
  permissionMiddleware.requireAll('patients:write', 'medical_records:write'),
  (req, res) => {
    res.json({ success: true });
  }
);
```

### 4. Resource Ownership Check

```typescript
// User can only access their own data (or admin can access all)
app.get('/users/:userId',
  authMiddleware.authenticate(),
  permissionMiddleware.requirePermission({
    permissions: ['users:read', '*'],
    checkOwnership: true,
    getResourceOwnerId: (req) => req.params.userId
  }),
  (req, res) => {
    res.json({ user: { id: req.params.userId } });
  }
);

// Patient can only access their own medical records
app.get('/medical-records/:patientId',
  authMiddleware.authenticate(),
  permissionMiddleware.requirePermission({
    permissions: ['medical_records:read'],
    checkOwnership: true,
    getResourceOwnerId: (req) => req.params.patientId,
    errorMessage: 'You can only access your own medical records'
  }),
  (req, res) => {
    res.json({ records: [] });
  }
);
```

### 5. Custom Permission Logic

```typescript
// Complex permission check
app.post('/prescriptions',
  authMiddleware.authenticate(),
  permissionMiddleware.requirePermission({
    permissions: ['prescriptions:write'],
    requireAll: false,
    errorMessage: 'Only doctors can write prescriptions'
  }),
  async (req, res) => {
    // Additional business logic
    res.json({ success: true });
  }
);
```

---

## 🧪 TESTING

### Run Tests

```bash
# Run all tests
npm test

# Run integration tests only
npm test -- tests/integration

# Run RBAC tests
npm test -- tests/integration/rbac.test.ts

# Run authentication tests
npm test -- tests/integration/authentication.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Environment Setup

Create `.env.test` file:

```bash
# Supabase Test Configuration
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key
SUPABASE_JWT_SECRET=your_test_jwt_secret

# Test User Credentials (for integration tests)
TEST_USER_EMAIL=test@hospital.vn
TEST_USER_PASSWORD=test-password-123
TEST_USER_ID=test-user-uuid
```

---

## 📊 DEFAULT PERMISSIONS BY ROLE

### Admin
```typescript
permissions: ['*']  // Full access
```

### Doctor
```typescript
permissions: [
  'patients:read',
  'patients:write',
  'appointments:read',
  'appointments:write',
  'medical_records:read',
  'medical_records:write',
  'prescriptions:write'
]
```

### Patient
```typescript
permissions: [
  'own_data:read',
  'appointments:read',
  'appointments:create',
  'medical_records:read_own'
]
```

### Receptionist
```typescript
permissions: [
  'patients:read',
  'appointments:read',
  'appointments:write',
  'appointments:create'
]
```

---

## 🔒 SECURITY FEATURES

### 1. JWT Token Verification
- Validates token signature
- Checks token expiration
- Verifies token issuer

### 2. Permission Caching
- Redis-based caching (5 minutes TTL)
- Reduces database queries
- Invalidation on permission changes

### 3. Audit Logging
- All authentication attempts logged
- Permission denials logged
- Resource access logged

### 4. Conditional Permissions
- Resource ownership checks
- Context-based access control
- Custom permission logic

---

## 🚀 DEPLOYMENT

### Environment Variables

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Optional
REDIS_URL=redis://localhost:6379  # For permission caching
```

### Docker Deployment

```bash
# Build
docker build -t identity-service:latest .

# Run
docker run -p 3021:3021 \
  -e SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  -e SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET \
  identity-service:latest
```

---

## 📖 API ENDPOINTS

### Public Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Password reset request
- `GET /health` - Health check

### Protected Endpoints
- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/users/:userId` - Get user by ID (admin or self)
- `GET /api/v1/users` - List all users (admin only)
- `PATCH /api/v1/users/:userId` - Update user (admin or self)
- `DELETE /api/v1/users/:userId` - Delete user (admin only)

### Admin Endpoints
- `POST /admin/recovery` - Force service recovery
- `POST /admin/permissions/invalidate/:userId` - Invalidate permission cache

---

## 🔧 TROUBLESHOOTING

### Permission Denied Issues

1. **Check user permissions**:
```bash
curl -X GET http://localhost:3021/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Invalidate permission cache**:
```bash
curl -X POST http://localhost:3021/admin/permissions/invalidate/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

3. **Check database permissions**:
```sql
SELECT * FROM auth_schema.role_permissions 
WHERE role_id IN (
  SELECT role_id FROM auth_schema.healthcare_roles 
  WHERE user_id = 'USER_ID'
);
```

---

## ✅ CHECKLIST

- [x] IPermissionService interface created
- [x] PermissionService implementation with caching
- [x] AuthenticationMiddleware for JWT verification
- [x] PermissionMiddleware for RBAC
- [x] Integration tests for RBAC
- [x] Integration tests for authentication
- [x] Protected API endpoints
- [x] Documentation
- [x] Build passing

---

**Status**: ✅ PRODUCTION READY  
**Next Steps**: Deploy to staging and run integration tests with real data

