# Security Improvements - Provider Staff Service

## Overview

This document outlines security improvements needed for the Provider Staff Service to address identified vulnerabilities and enhance overall security posture.

---

## 🔴 **CRITICAL ISSUES**

### None identified ✅

The service has good security foundations:
- ✅ Input validation with express-validator
- ✅ Role-based access control (RBAC)
- ✅ HIPAA audit logging
- ✅ Row Level Security (RLS) on Supabase
- ✅ Data masking in logs (license numbers)
- ✅ Circuit breaker for resilience

---

## 🟡 **MEDIUM PRIORITY IMPROVEMENTS**

### 1. **Input Sanitization for Repository Filters**

**Issue**: Repository `findAll()` accepts `any` type for filters without validation.

**Current Code**:
```typescript
async findAll(filters?: any): Promise<ProviderStaff[]> {
  if (filters) {
    if (filters.staffType) {
      query = query.eq('staff_type', filters.staffType);  // No validation
    }
  }
}
```

**Recommended Fix**:
```typescript
// Define type-safe filter interface
interface StaffFilters {
  staffType?: StaffType;
  status?: StaffStatus;
  isActive?: boolean;
  departmentId?: string;
}

// Validate filters
private validateFilters(filters: StaffFilters): void {
  if (filters.staffType && !VALID_STAFF_TYPES.includes(filters.staffType)) {
    throw new Error('Invalid staff type');
  }
  if (filters.status && !VALID_STAFF_STATUSES.includes(filters.status)) {
    throw new Error('Invalid status');
  }
  if (filters.departmentId && !UUID_REGEX.test(filters.departmentId)) {
    throw new Error('Invalid department ID format');
  }
}

async findAll(filters?: StaffFilters): Promise<ProviderStaff[]> {
  if (filters) {
    this.validateFilters(filters);
    // ... rest of implementation
  }
}
```

**Files to Update**:
- `src/infrastructure/repositories/SupabaseProviderStaffRepository.ts`
- `src/domain/repositories/IProviderStaffRepository.ts`

---

### 2. **Sanitize Log Data to Prevent Data Leaks**

**Issue**: Filters and other objects logged directly may contain sensitive data.

**Current Code**:
```typescript
this.logger.info('Finding all staff', {
  filters,  // May contain sensitive data
  repository: 'SupabaseProviderStaffRepository'
});
```

**Recommended Fix**:
```typescript
private sanitizeFiltersForLog(filters: any): any {
  if (!filters) return {};
  
  return {
    staffType: filters.staffType,
    status: filters.status,
    isActive: filters.isActive,
    departmentId: filters.departmentId ? 'REDACTED' : undefined,
    // Exclude any potentially sensitive fields
  };
}

this.logger.info('Finding all staff', {
  filters: this.sanitizeFiltersForLog(filters),
  repository: 'SupabaseProviderStaffRepository'
});
```

**Files to Update**:
- `src/infrastructure/repositories/SupabaseProviderStaffRepository.ts`
- `src/infrastructure/logging/logger.ts` (add sanitization utilities)

---

## 🟢 **LOW PRIORITY IMPROVEMENTS**

### 3. **Rate Limiting for Search/List Operations**

**Issue**: No rate limiting on search and list endpoints.

**Recommended Implementation**:
```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter for search operations
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many search requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for list operations
const listLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many list requests from this IP, please try again later',
});

// Apply to routes
router.get('/search', searchLimiter, validateSearchStaff, searchStaff);
router.get('/', listLimiter, validateListStaff, listStaff);
```

**Files to Update**:
- `src/presentation/routes/staffRoutes.ts`
- `package.json` (add `express-rate-limit` dependency)

---

### 4. **Pagination Validation**

**Issue**: No validation for pagination parameters (page size could be very large).

**Recommended Implementation**:
```typescript
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_NUMBER = 1000;

export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1, max: MAX_PAGE_NUMBER })
    .withMessage(`Page number must be between 1 and ${MAX_PAGE_NUMBER}`),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_PAGE_SIZE })
    .withMessage(`Page size must be between 1 and ${MAX_PAGE_SIZE}`)
    .customSanitizer(value => Math.min(value || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)),
  
  handleValidationErrors
];
```

**Files to Update**:
- `src/presentation/middleware/ValidationMiddleware.ts`
- Apply to all paginated endpoints

---

### 5. **SQL Injection Prevention (Already Good, but can be Enhanced)**

**Current Status**: ✅ Using Supabase client with parameterized queries

**Additional Recommendation**: Add query logging in development for debugging:
```typescript
if (process.env.NODE_ENV === 'development') {
  this.logger.debug('Executing query', {
    table: this.fullTableName,
    operation: 'select',
    filters: this.sanitizeFiltersForLog(filters)
  });
}
```

---

## 🛡️ **ADDITIONAL SECURITY BEST PRACTICES**

### 6. **Content Security Policy (CSP)**

Add CSP headers to prevent XSS attacks:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

### 7. **CORS Configuration**

Ensure CORS is properly configured:
```typescript
import cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

### 8. **Request Size Limits**

Prevent DoS attacks via large payloads:
```typescript
import express from 'express';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

---

### 9. **Security Headers**

Add security headers using Helmet:
```typescript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.frameguard({ action: 'deny' }));
```

---

### 10. **Audit Logging Enhancement**

Enhance HIPAA audit logging to include:
- IP address
- User agent
- Request ID
- Correlation ID
- Geolocation (if available)

```typescript
interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  correlationId: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### Phase 1: Medium Priority (Week 1)
- [ ] Add type-safe filters to repository
- [ ] Implement filter validation
- [ ] Add log data sanitization
- [ ] Create sanitization utilities

### Phase 2: Low Priority (Week 2)
- [ ] Add rate limiting middleware
- [ ] Implement pagination validation
- [ ] Add query logging for development
- [ ] Update all paginated endpoints

### Phase 3: Additional Security (Week 3)
- [ ] Add CSP headers
- [ ] Configure CORS properly
- [ ] Add request size limits
- [ ] Add security headers with Helmet
- [ ] Enhance audit logging

### Phase 4: Testing & Documentation (Week 4)
- [ ] Write security tests
- [ ] Penetration testing
- [ ] Update security documentation
- [ ] Security audit

---

## 🧪 **SECURITY TESTING**

### 1. Input Validation Tests
```typescript
describe('Input Validation', () => {
  it('should reject invalid staff type', async () => {
    const response = await request(app)
      .get('/api/v1/staff')
      .query({ staffType: 'invalid' });
    
    expect(response.status).toBe(400);
  });

  it('should reject SQL injection attempts', async () => {
    const response = await request(app)
      .get('/api/v1/staff')
      .query({ staffType: "'; DROP TABLE staff_profiles; --" });
    
    expect(response.status).toBe(400);
  });
});
```

### 2. Rate Limiting Tests
```typescript
describe('Rate Limiting', () => {
  it('should rate limit search requests', async () => {
    const requests = Array(101).fill(null).map(() => 
      request(app).get('/api/v1/staff/search')
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### 3. Authorization Tests
```typescript
describe('Authorization', () => {
  it('should deny access without token', async () => {
    const response = await request(app)
      .get('/api/v1/staff');
    
    expect(response.status).toBe(401);
  });

  it('should deny access with insufficient permissions', async () => {
    const response = await request(app)
      .get('/api/v1/staff')
      .set('Authorization', `Bearer ${patientToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

---

## 📊 **SECURITY METRICS**

Track these metrics to monitor security:

1. **Failed Authentication Attempts**: Count per IP, per user
2. **Rate Limit Hits**: Count per endpoint
3. **Invalid Input Attempts**: Count per endpoint
4. **Unauthorized Access Attempts**: Count per user
5. **Audit Log Volume**: Ensure all actions are logged

---

## 🔍 **SECURITY AUDIT CHECKLIST**

- [ ] All inputs are validated
- [ ] All outputs are sanitized
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] Authentication required for all endpoints
- [ ] Authorization checked for all operations
- [ ] Sensitive data encrypted at rest
- [ ] Sensitive data encrypted in transit (HTTPS)
- [ ] Audit logging comprehensive
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] CORS properly configured

---

**Last Updated**: 2025-01-10
**Author**: Hospital Management Team
**Status**: Recommendations

