# API Gateway Service - Technical Design Document

## 📋 Document Information

**Version**: 1.0.0  
**Date**: 2025-01-10  
**Status**: 🟢 **APPROVED FOR IMPLEMENTATION**  
**Author**: Hospital Management Team  
**Based On**: Clean Architecture, Identity Service V2, Microservices Best Practices

---

## 🎯 1. EXECUTIVE SUMMARY

### 1.1 Purpose

API Gateway Service là **entry point duy nhất** cho tất cả client requests vào Hospital Management System V2. Service chịu trách nhiệm:
- **Authentication**: Verify JWT tokens
- **Authorization**: Check user permissions (RBAC/PBAC)
- **Request Routing**: Proxy requests to appropriate microservices
- **Cross-Cutting Concerns**: Rate limiting, logging, error handling

### 1.2 Scope

**IN SCOPE** (What we WILL do):
- ✅ JWT token verification
- ✅ User authentication & authorization
- ✅ Request proxying to downstream services
- ✅ Rate limiting (global & per-user)
- ✅ Request/Response logging
- ✅ Error handling & transformation
- ✅ Health checks & monitoring
- ✅ CORS handling
- ✅ Security headers (Helmet)

**OUT OF SCOPE** (What we will NOT do):
- ❌ Business logic (belongs to domain services)
- ❌ Data persistence (stateless gateway)
- ❌ Service discovery (static configuration for now)
- ❌ Load balancing (handled by Docker/K8s)

### 1.3 Key Principles

1. **Stateless**: No session storage, JWT-based authentication
2. **Clean Architecture**: 4-layer architecture (Domain, Application, Infrastructure, Presentation)
3. **Security First**: HIPAA-compliant, secure by default
4. **Performance**: Minimal latency overhead (<10ms)
5. **Resilience**: Circuit breaker, graceful degradation
6. **Observability**: Comprehensive logging and monitoring

---

## 🏗️ 2. ARCHITECTURE OVERVIEW

### 2.1 Service Structure

```
api-gateway/
├── src/
│   ├── domain/                     # Domain Layer
│   │   ├── value-objects/
│   │   │   ├── JWTToken.ts         # JWT token value object
│   │   │   ├── UserId.ts           # User ID value object
│   │   │   └── ServiceRoute.ts     # Service routing config
│   │   ├── entities/
│   │   │   └── AuthenticatedUser.ts # Authenticated user entity
│   │   └── services/
│   │       ├── ITokenVerifier.ts   # Token verification interface
│   │       └── IPermissionChecker.ts # Permission checking interface
│   ├── application/                # Application Layer
│   │   ├── use-cases/
│   │   │   ├── AuthenticateRequestUseCase.ts
│   │   │   ├── AuthorizeRequestUseCase.ts
│   │   │   └── ProxyRequestUseCase.ts
│   │   └── services/
│   │       ├── ILogger.ts
│   │       └── IServiceRegistry.ts
│   ├── infrastructure/             # Infrastructure Layer
│   │   ├── auth/
│   │   │   ├── JWTTokenVerifier.ts # JWT verification implementation
│   │   │   └── SupabasePermissionChecker.ts
│   │   ├── proxy/
│   │   │   └── HttpServiceProxy.ts # HTTP proxy implementation
│   │   ├── logging/
│   │   │   └── WinstonLogger.ts
│   │   └── resilience/
│   │       ├── CircuitBreaker.ts
│   │       └── RateLimiter.ts
│   └── presentation/               # Presentation Layer
│       ├── middleware/
│       │   ├── AuthenticationMiddleware.ts
│       │   ├── AuthorizationMiddleware.ts
│       │   ├── RateLimitMiddleware.ts
│       │   ├── LoggingMiddleware.ts
│       │   └── ErrorHandlingMiddleware.ts
│       ├── routes/
│       │   ├── authRoutes.ts       # Proxy to identity-service
│       │   ├── patientRoutes.ts    # Proxy to patient-registry
│       │   ├── providerRoutes.ts   # Proxy to provider-staff
│       │   ├── schedulingRoutes.ts # Proxy to scheduling
│       │   ├── clinicalRoutes.ts   # Proxy to clinical-emr
│       │   ├── billingRoutes.ts    # Proxy to billing
│       │   └── healthRoutes.ts     # Health check endpoints
│       └── main.ts                 # Application entry point
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
├── jest.config.js
├── Dockerfile
└── README.md
```

### 2.2 Request Flow

```
Client Request
    ↓
[1] CORS Middleware
    ↓
[2] Security Headers (Helmet)
    ↓
[3] Request Logging
    ↓
[4] Rate Limiting
    ↓
[5] Authentication Middleware
    ├── Extract JWT from Authorization header
    ├── Verify JWT signature
    ├── Decode user info (userId, roles, permissions)
    └── Attach to req.user
    ↓
[6] Authorization Middleware (optional per route)
    ├── Check required permissions
    └── Allow/Deny request
    ↓
[7] Proxy to Downstream Service
    ├── Add req.user to headers (X-User-Id, X-User-Roles)
    ├── Forward request
    └── Return response
    ↓
[8] Response Logging
    ↓
[9] Error Handling (if any)
    ↓
Client Response
```

---

## 🔐 3. AUTHENTICATION & AUTHORIZATION

### 3.1 JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;           // UUID from auth_schema.user_profiles
  email: string;
  roles: string[];          // ['patient', 'doctor', 'nurse', 'admin', 'system_admin']
  permissions: string[];    // ['patient:read', 'patient:write', ...]
  sessionId?: string;       // Optional session tracking
  iat: number;              // Issued at
  exp: number;              // Expiration
}
```

### 3.2 Authentication Flow

```typescript
// AuthenticationMiddleware.ts
export class AuthenticationMiddleware {
  async authenticate(req, res, next) {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 2. Verify token
    const decoded = await this.tokenVerifier.verify(token);
    
    // 3. Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions,
      sessionId: decoded.sessionId
    };
    
    next();
  }
}
```

### 3.3 Authorization Strategies

#### Strategy 1: Role-Based (RBAC)
```typescript
// Require specific role
requireRole('doctor')
requireAnyRole(['doctor', 'nurse'])
```

#### Strategy 2: Permission-Based (PBAC)
```typescript
// Require specific permission
requirePermission('patient:write')
requireAllPermissions(['patient:read', 'patient:write'])
requireAnyPermission(['patient:read', 'appointment:read'])
```

#### Strategy 3: Resource-Based
```typescript
// Check ownership
requireOwnership((req) => req.params.patientId === req.user.userId)
```

---

## 🔄 4. SERVICE ROUTING

### 4.1 Route Mapping

| Client Path | Downstream Service | Internal URL | Auth Required |
|-------------|-------------------|--------------|---------------|
| `/api/v1/auth/*` | identity-service | `http://identity-service:3001` | ❌ (public) |
| `/api/v1/patients/*` | patient-registry | `http://patient-registry-service:3003` | ✅ |
| `/api/v1/providers/*` | provider-staff | `http://provider-staff-service:3002` | ✅ |
| `/api/v1/appointments/*` | scheduling | `http://scheduling-service:3004` | ✅ |
| `/api/v1/clinical/*` | clinical-emr | `http://clinical-emr-service:3007` | ✅ |
| `/api/v1/billing/*` | billing | `http://billing-service:3009` | ✅ |
| `/api/v1/notifications/*` | notifications | `http://notifications-service:3011` | ✅ |

### 4.2 Request Transformation

```typescript
// Add user context to proxied request
proxyReq.setHeader('X-User-Id', req.user.userId);
proxyReq.setHeader('X-User-Email', req.user.email);
proxyReq.setHeader('X-User-Roles', JSON.stringify(req.user.roles));
proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions));
proxyReq.setHeader('X-Request-Id', generateRequestId());
proxyReq.setHeader('X-Forwarded-For', req.ip);
```

---

## 🛡️ 5. SECURITY

### 5.1 Security Headers (Helmet)

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

### 5.2 Rate Limiting

```typescript
// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                 // 1000 requests per IP
  message: 'Too many requests from this IP'
});

// Per-user rate limit (after authentication)
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,                  // 500 requests per user
  keyGenerator: (req) => req.user?.userId || req.ip
});
```

### 5.3 CORS Configuration

```typescript
cors({
  origin: [
    'http://localhost:3000',      // Frontend dev
    'https://hospital.example.com' // Production
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
})
```

---

## 📊 6. MONITORING & LOGGING

### 6.1 Request Logging

```typescript
logger.info('Incoming request', {
  requestId: req.id,
  method: req.method,
  path: req.path,
  userId: req.user?.userId,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

### 6.2 Response Logging

```typescript
logger.info('Outgoing response', {
  requestId: req.id,
  statusCode: res.statusCode,
  duration: Date.now() - req.startTime,
  userId: req.user?.userId
});
```

### 6.3 Error Logging

```typescript
logger.error('Request failed', {
  requestId: req.id,
  error: error.message,
  stack: error.stack,
  userId: req.user?.userId,
  path: req.path
});
```

---

## 🔧 7. CONFIGURATION

### 7.1 Environment Variables

```bash
# Server
PORT=3101
NODE_ENV=development

# JWT
JWT_SECRET=your-jwt-secret
JWT_ISSUER=hospital-management-system
JWT_AUDIENCE=api-gateway

# Supabase (for permission checking)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Service URLs (internal Docker network)
IDENTITY_SERVICE_URL=http://identity-service:3001
PATIENT_REGISTRY_SERVICE_URL=http://patient-registry-service:3003
PROVIDER_STAFF_SERVICE_URL=http://provider-staff-service:3002
SCHEDULING_SERVICE_URL=http://scheduling-service:3004
CLINICAL_EMR_SERVICE_URL=http://clinical-emr-service:3007
BILLING_SERVICE_URL=http://billing-service:3009
NOTIFICATIONS_SERVICE_URL=http://notifications-service:3011

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3101

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info
```

---

## 🚀 8. DEPLOYMENT

### 8.1 Docker Configuration

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3101
CMD ["node", "dist/main.js"]
```

### 8.2 Docker Compose Integration

```yaml
api-gateway:
  build:
    context: .
    dockerfile: ./api-gateway/Dockerfile
  container_name: hospital-api-gateway-v2
  ports:
    - "3101:3101"
  environment:
    - NODE_ENV=development
    - PORT=3101
    - JWT_SECRET=${JWT_SECRET}
    - SUPABASE_URL=${SUPABASE_URL}
    - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
  depends_on:
    - identity-service
    - patient-registry-service
  networks:
    - hospital-v2-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3101/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

---

## ✅ 9. SUCCESS CRITERIA

1. ✅ All requests authenticated via JWT
2. ✅ Authorization enforced per route
3. ✅ Requests proxied to correct services
4. ✅ User context added to downstream requests
5. ✅ Rate limiting prevents abuse
6. ✅ Comprehensive logging
7. ✅ Health checks pass
8. ✅ 90%+ test coverage
9. ✅ <10ms latency overhead
10. ✅ Zero security vulnerabilities

---

**Status**: Ready for implementation ✅

