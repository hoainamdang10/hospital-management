# Billing Service - Middleware Documentation

## Overview

Middleware layer cho Billing Service, cung cấp các chức năng cross-cutting concerns như authentication, validation, logging, error handling, và audit.

## Middleware Stack

### 1. CORS Middleware (`cors.middleware.ts`)

**Mục đích**: Xử lý Cross-Origin Resource Sharing

**Features**:
- Dynamic origin validation
- Environment-based configuration
- Credentials support
- Custom headers exposure

**Usage**:
```typescript
import { corsMiddleware } from './middleware';
app.use(corsMiddleware);
```

---

### 2. Request Logging Middleware (`request-logging.middleware.ts`)

**Mục đích**: Log tất cả incoming requests và responses

**Features**:
- Request/Response logging
- Correlation ID tracking
- Sensitive data redaction
- Performance monitoring

**Usage**:
```typescript
import { requestLoggingMiddleware } from './middleware';
app.use(requestLoggingMiddleware);
```

---

### 3. Audit Middleware (`audit.middleware.ts`)

**Mục đích**: HIPAA-compliant audit logging cho sensitive operations

**Features**:
- Healthcare context extraction
- PHI access logging
- User action tracking
- Compliance reporting

**Usage**:
```typescript
import { auditMiddleware, hipaaAuditMiddleware } from './middleware';

// Standard audit
app.use(auditMiddleware);

// HIPAA-specific audit
app.use(hipaaAuditMiddleware);
```

**Audit Log Entry**:
```typescript
{
  timestamp: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  healthcareContext: {
    patientId?: string;
    invoiceId?: string;
    dataClassification: 'PHI' | 'PII' | 'Financial' | 'Public';
  }
}
```

---

### 4. Authentication Middleware (`auth.middleware.ts`)

**Mục đích**: JWT-based authentication và authorization

**Features**:
- JWT token verification
- Role-based access control (RBAC)
- Permission checking
- Supabase integration

**Usage**:
```typescript
import { authMiddleware, UserRole } from './middleware';

// Require authentication
router.use(authMiddleware());

// Require specific roles
router.use(authMiddleware({ 
  roles: [UserRole.ADMIN, UserRole.DOCTOR] 
}));

// Require specific permissions
router.use(authMiddleware({ 
  permissions: ['billing:write'] 
}));
```

---

### 5. Rate Limiting Middleware (`rate-limit.middleware.ts`)

**Mục đích**: Protect against DDoS và abuse

**Features**:
- Role-based rate limits
- Endpoint-specific limits
- Burst protection
- Speed limiting

**Usage**:
```typescript
import { rateLimitMiddleware } from './middleware';
app.use(rateLimitMiddleware);
```

**Rate Limits**:
- Admin: 1000 requests/15min
- Doctor/Nurse: 500 requests/15min
- Patient: 100 requests/15min
- Payment endpoints: 50 requests/15min
- Insurance endpoints: 100 requests/15min

---

### 6. Validation Middleware (`validation.middleware.ts`)

**Mục đích**: Input validation cho requests

**Features**:
- Schema-based validation
- Vietnamese format validation
- Custom validators
- Error formatting

**Usage**:
```typescript
import { validateRequest, validateVNDAmount } from './middleware';

// Use predefined validators
router.post('/invoices', 
  validateRequest('createInvoice'),
  controller.createInvoice
);

// Use custom validators
router.post('/payments',
  validateVNDAmount,
  controller.processPayment
);
```

**Available Validators**:
- `validateRequest('createInvoice')`
- `validateRequest('processPayment')`
- `validateRequest('validateInsurance')`
- `validateVNDAmount`
- `validateDateRange`

---

### 7. Error Handler Middleware (`error-handler.middleware.ts`)

**Mục đích**: Centralized error handling

**Features**:
- Custom error classes
- Error logging
- Consistent error responses
- Environment-aware messages

**Usage**:
```typescript
import { errorHandler, NotFoundError, ValidationError } from './middleware';

// Apply at the end of middleware chain
app.use(errorHandler);

// Throw custom errors
throw new NotFoundError('Invoice', invoiceId);
throw new ValidationError('Invalid data', errors);
```

**Error Classes**:
- `ApplicationError` - Base error
- `DomainError` - Business rule violations
- `NotFoundError` - Resource not found
- `ValidationError` - Input validation errors
- `UnauthorizedError` - Authentication errors
- `ForbiddenError` - Authorization errors
- `ConflictError` - Resource conflicts
- `PaymentError` - Payment processing errors
- `InsuranceError` - Insurance-related errors

---

## Middleware Order

**CRITICAL**: Middleware phải được apply theo thứ tự sau:

```typescript
1. CORS Middleware
2. Request Logging Middleware
3. Audit Middleware
4. Authentication Middleware
5. Rate Limiting Middleware
6. Validation Middleware
7. Route Handlers
8. Error Handler Middleware (cuối cùng)
```

## Example: Complete Setup

```typescript
import express from 'express';
import {
  corsMiddleware,
  requestLoggingMiddleware,
  auditMiddleware,
  authMiddleware,
  rateLimitMiddleware,
  errorHandler
} from './middleware';

const app = express();

// Global middleware
app.use(corsMiddleware);
app.use(requestLoggingMiddleware);
app.use(auditMiddleware);

// Routes
app.use('/api/v1', router);

// Error handler (last)
app.use(errorHandler);
```

## Testing

Tất cả middleware đều có unit tests trong `tests/unit/presentation/middleware/`.

## Compliance

- **HIPAA**: Audit middleware logs PHI access
- **Vietnamese Healthcare**: Validation cho BHYT/BHTN
- **Security**: Rate limiting, authentication, CORS
- **Audit Trail**: Complete request/response logging

