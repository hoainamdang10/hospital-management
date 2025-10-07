# Identity Service - API Contract

**Version**: 2.0.0
**Last Updated**: 2025-01-08
**Status**: 📋 Draft

---

## Overview

This document defines the API contract for Identity Service, including:
- HTTP status codes
- Error codes and messages
- Validation rules
- Request/response formats
- Rate limiting
- Authentication requirements

**Supported Roles**: 5 core roles
- **Staff Roles** (4): ADMIN, DOCTOR, NURSE, RECEPTIONIST
- **Patient Role** (1): PATIENT

---

## Base URL

```
Development: http://localhost:3021
Production: https://api.hospital.com/identity
```

---

## Authentication

### Bearer Token
```http
Authorization: Bearer <access_token>
```

### Service-to-Service
```http
X-Service-Key: <service_key>
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## Error Response Format

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "timestamp": "2025-01-06T10:30:00Z",
  "path": "/api/v1/auth/register"
}
```

### Validation Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  },
  "timestamp": "2025-01-06T10:30:00Z",
  "path": "/api/v1/auth/register"
}
```

---

## Error Codes Catalog

### Authentication Errors (AUTH_*)

| Code | HTTP Status | Message | Cause | Solution |
|------|-------------|---------|-------|----------|
| AUTH_INVALID_CREDENTIALS | 401 | Invalid email or password | Wrong credentials | Check email/password |
| AUTH_ACCOUNT_LOCKED | 403 | Account is locked | Too many failed attempts | Contact admin or wait |
| AUTH_ACCOUNT_INACTIVE | 403 | Account is not activated | Email not verified | Check email for activation link |
| AUTH_TOKEN_EXPIRED | 401 | Access token has expired | Token expired | Refresh token |
| AUTH_TOKEN_INVALID | 401 | Invalid access token | Malformed token | Re-authenticate |
| AUTH_REFRESH_TOKEN_EXPIRED | 401 | Refresh token has expired | Refresh token expired | Re-authenticate |
| AUTH_MFA_REQUIRED | 403 | MFA verification required | MFA enabled | Provide MFA code |
| AUTH_MFA_INVALID | 401 | Invalid MFA code | Wrong code | Check code and retry |

### Registration Errors (REG_*)

| Code | HTTP Status | Message | Cause | Solution |
|------|-------------|---------|-------|----------|
| REG_EMAIL_EXISTS | 409 | Email already registered | Duplicate email | Use different email or login |
| REG_INVALID_EMAIL | 400 | Invalid email format | Malformed email | Check email format |
| REG_WEAK_PASSWORD | 400 | Password too weak | Password doesn't meet requirements | Use stronger password |
| REG_INVALID_ROLE | 400 | Invalid role specified | Role doesn't exist | Check valid roles |
| REG_ACTIVATION_EXPIRED | 422 | Activation link expired | Link expired | Request new activation link |
| REG_ACTIVATION_INVALID | 422 | Invalid activation token | Token invalid | Request new activation link |

### User Management Errors (USER_*)

| Code | HTTP Status | Message | Cause | Solution |
|------|-------------|---------|-------|----------|
| USER_NOT_FOUND | 404 | User not found | User doesn't exist | Check user ID |
| USER_PERMISSION_DENIED | 403 | Insufficient permissions | User lacks permission | Contact admin |
| USER_CANNOT_DELETE_SELF | 422 | Cannot delete own account | Self-deletion attempt | Use different account |
| USER_CANNOT_MODIFY_ADMIN | 403 | Cannot modify admin user | Insufficient privileges | Contact super admin |

### Validation Errors (VAL_*)

| Code | HTTP Status | Message | Cause | Solution |
|------|-------------|---------|-------|----------|
| VAL_REQUIRED_FIELD | 400 | Required field missing | Missing field | Provide required field |
| VAL_INVALID_FORMAT | 400 | Invalid field format | Wrong format | Check format requirements |
| VAL_OUT_OF_RANGE | 400 | Value out of range | Value too large/small | Check valid range |
| VAL_INVALID_ENUM | 400 | Invalid enum value | Value not in enum | Check valid values |

---

## API Endpoints

### 1. Patient Self-Registration

#### POST /api/v1/auth/register/patient

**Request Body**:
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567",
  "dateOfBirth": "1990-01-01",
  "gender": "MALE"
}
```

**Validation Rules**:
- `email`: Required, valid email format, max 255 chars
- `password`: Required, min 8 chars, must contain uppercase, lowercase, number, special char
- `fullName`: Required, min 2 chars, max 100 chars
- `phoneNumber`: Required, Vietnamese phone format (10 digits starting with 0)
- `dateOfBirth`: Required, ISO 8601 date, must be in past, age >= 18
- `gender`: Required, enum: MALE, FEMALE, OTHER

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "patient@example.com",
    "role": "PATIENT",
    "status": "PENDING_ACTIVATION",
    "message": "Registration successful. Please check your email to activate your account."
  }
}
```

**Error Responses**:
- 400: Validation error
- 409: Email already exists

---

### 2. Staff Registration (Admin Only)

#### POST /api/v1/admin/staff/register

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "email": "doctor@hospital.com",
  "fullName": "Dr. Nguyễn Văn B",
  "phoneNumber": "0901234568",
  "role": "DOCTOR",
  "departmentId": "uuid"
}
```

**Validation Rules**:
- `email`: Required, valid email format, max 255 chars
- `fullName`: Required, min 2 chars, max 100 chars
- `phoneNumber`: Required, Vietnamese phone format
- `role`: Required, enum: ADMIN, DOCTOR, NURSE, RECEPTIONIST (4 staff roles only)
- `departmentId`: Optional, valid UUID

**Note**: PATIENT role không được phép tạo qua staff registration (chỉ self-registration)

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "doctor@hospital.com",
    "role": "DOCTOR",
    "status": "PENDING_ACTIVATION",
    "activationLink": "https://hospital.com/activate?token=xxx",
    "message": "Staff account created. Activation email sent."
  }
}
```

**Error Responses**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden (not admin)
- 409: Email already exists

---

### 3. Login

#### POST /api/v1/auth/login

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Validation Rules**:
- `email`: Required, valid email format
- `password`: Required

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "DOCTOR",
      "fullName": "Dr. Nguyễn Văn B"
    }
  }
}
```

**Error Responses**:
- 401: Invalid credentials
- 403: Account locked or inactive

---

### 4. Refresh Token

#### POST /api/v1/auth/refresh

**Request Body**:
```json
{
  "refreshToken": "refresh_token"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "expiresIn": 900
  }
}
```

**Error Responses**:
- 401: Invalid or expired refresh token

---

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| POST /auth/register/* | 5 requests | 1 hour | IP address |
| POST /auth/login | 10 requests | 15 minutes | IP address |
| POST /auth/refresh | 20 requests | 1 hour | User |
| GET /users/* | 100 requests | 1 minute | User |
| POST /admin/* | 50 requests | 1 minute | User |

### Rate Limit Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1704537600
```

### Rate Limit Exceeded Response (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 300
    }
  }
}
```

---

## Versioning

API versioning is done via URL path:
- Current version: `/api/v1/`
- Future versions: `/api/v2/`, `/api/v3/`, etc.

---

## Deprecation Policy

- Deprecated endpoints will be marked in documentation
- Minimum 6 months notice before removal
- Deprecation header: `X-API-Deprecated: true`

---

## Support

For API support:
- Documentation: `/docs`
- Issues: GitHub Issues
- Email: dev@hospital.com

---

**Status**: 📋 Draft - To be completed with all endpoints  
**Next Update**: Add remaining endpoints (MFA, password reset, user management)

