# API Gateway Service

API Gateway for Hospital Management System V2 - Clean Architecture Implementation

## 📋 Overview

API Gateway là **entry point duy nhất** cho tất cả client requests vào Hospital Management System V2. Service chịu trách nhiệm:

- ✅ **Authentication**: JWT token verification
- ✅ **Authorization**: Role-based & Permission-based access control
- ✅ **Request Routing**: Proxy requests to appropriate microservices
- ✅ **Cross-Cutting Concerns**: Rate limiting, logging, error handling
- ✅ **Security**: CORS, Helmet, Security headers
- ✅ **Resilience**: Circuit breaker, retry policy, timeout handling
- ✅ **API Documentation**: Swagger UI for interactive API testing
- ✅ **Monitoring**: Visual dashboard & performance metrics
- ✅ **i18n**: Vietnamese error messages for better UX

## 🏗️ Architecture

### Clean Architecture Layers

```
api-gateway/
├── src/
│   ├── domain/              # Domain Layer (Business Logic)
│   │   ├── value-objects/   # JWTToken, UserId, ServiceRoute
│   │   ├── entities/        # AuthenticatedUser
│   │   └── services/        # ITokenVerifier, IPermissionChecker
│   ├── application/         # Application Layer (Use Cases)
│   │   ├── use-cases/       # AuthenticateRequest, AuthorizeRequest, ProxyRequest
│   │   └── services/        # ILogger, IServiceRegistry
│   ├── infrastructure/      # Infrastructure Layer (External Services)
│   │   ├── auth/            # JWTTokenVerifier, SupabasePermissionChecker
│   │   ├── proxy/           # ServiceRegistry
│   │   └── logging/         # WinstonLogger
│   └── presentation/        # Presentation Layer (HTTP)
│       ├── middleware/      # Authentication, Authorization, Logging, Error Handling
│       ├── routes/          # Health, Proxy routes
│       └── main.ts          # Application entry point
```

### Request Flow

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

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account (for permission checking)
- Running microservices (identity, patient-registry, etc.)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables

```bash
# Server
PORT=3101
NODE_ENV=development

# JWT
JWT_SECRET=your-jwt-secret
JWT_ISSUER=hospital-management-system
JWT_AUDIENCE=api-gateway

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Service URLs
IDENTITY_SERVICE_URL=http://identity-service:3001
PATIENT_REGISTRY_SERVICE_URL=http://patient-registry-service:3003
PROVIDER_STAFF_SERVICE_URL=http://provider-staff-service:3002
SCHEDULING_SERVICE_URL=http://scheduling-service:3004
CLINICAL_EMR_SERVICE_URL=http://clinical-emr-service:3007
BILLING_SERVICE_URL=http://billing-service:3009

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3101

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Development

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Start production
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format code
npm run format
```

### Docker

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run

# Or use Docker Compose
docker-compose up api-gateway
```

## 📡 API Routes

### Documentation & Monitoring

```bash
GET /api-docs            # 📚 Swagger UI - Interactive API documentation
GET /dashboard           # 📊 Visual dashboard - Service health monitoring
GET /api/metrics         # 📈 Performance metrics - Request stats & analytics
GET /api/metrics/summary # 📋 Metrics summary - Quick overview
```

### Health Checks

```bash
GET /health              # Overall health status
GET /health/ready        # Readiness probe
GET /health/live         # Liveness probe
```

### Service Routes

| Client Path | Downstream Service | Auth Required | Permissions |
|-------------|-------------------|---------------|-------------|
| `/api/v1/auth/*` | identity-service | ❌ | - |
| `/api/v1/patients/*` | patient-registry | ✅ | patient:read |
| `/api/v1/providers/*` | provider-staff | ✅ | provider:read |
| `/api/v1/appointments/*` | scheduling | ✅ | appointment:read |
| `/api/v1/clinical/*` | clinical-emr | ✅ | clinical:read |
| `/api/v1/billing/*` | billing | ✅ | billing:read |

## 🔐 Authentication

### JWT Token Format

```typescript
{
  "userId": "uuid",
  "email": "user@example.com",
  "roles": ["patient", "doctor"],
  "permissions": ["patient:read", "patient:write"],
  "sessionId": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Making Authenticated Requests

```bash
curl -X GET http://localhost:3101/api/v1/patients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### User Context Headers

API Gateway adds these headers to proxied requests:

```
X-User-Id: uuid
X-User-Email: user@example.com
X-User-Roles: ["patient","doctor"]
X-User-Permissions: ["patient:read","patient:write"]
X-Request-Id: uuid
X-Forwarded-For: client-ip
```

## 🛡️ Security Features

- ✅ **JWT Verification**: Verify token signature, expiration, issuer, audience
- ✅ **RBAC/PBAC**: Role-based & Permission-based access control
- ✅ **Rate Limiting**: Global & per-user rate limits
- ✅ **CORS**: Configurable allowed origins
- ✅ **Helmet**: Security headers (CSP, HSTS, etc.)
- ✅ **Request Validation**: Input validation & sanitization
- ✅ **Error Handling**: Secure error messages (no stack traces in production)

## 📊 Monitoring & Logging

### Visual Dashboard

Access the visual dashboard at `http://localhost:3101/dashboard` để xem:

- ✅ Trạng thái real-time của tất cả services
- ✅ Service health indicators (healthy/unhealthy)
- ✅ Auto-refresh mỗi 5 giây
- ✅ Responsive design (mobile-friendly)

### Performance Metrics

Access performance metrics tại `http://localhost:3101/api/metrics`:

```json
{
  "success": true,
  "timestamp": "2025-01-11T10:00:00.000Z",
  "metrics": {
    "totalRequests": 1500,
    "successfulRequests": 1450,
    "failedRequests": 50,
    "avgResponseTime": 125.5,
    "requestsPerMinute": 25.5,
    "errorRate": 3.33,
    "slowestEndpoints": [
      {
        "path": "/api/v1/clinical/records",
        "avgTime": 450.2,
        "count": 100
      }
    ],
    "errorsByStatusCode": {
      "404": 30,
      "500": 20
    }
  }
}
```

### API Documentation

Access Swagger UI tại `http://localhost:3101/api-docs` để:

- ✅ Xem tất cả API endpoints
- ✅ Test API trực tiếp từ browser
- ✅ Xem request/response schemas
- ✅ Copy curl commands

### Log Levels

- `error`: Errors and exceptions
- `warn`: Warnings and potential issues
- `info`: General information (default)
- `debug`: Detailed debugging information

### Log Format

```json
{
  "timestamp": "2025-01-10 12:00:00",
  "level": "info",
  "message": "Incoming request",
  "requestId": "uuid",
  "method": "GET",
  "path": "/api/v1/patients",
  "userId": "uuid",
  "ip": "127.0.0.1"
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📚 Documentation

- [Technical Design](./TECHNICAL_DESIGN.md)
- [Architecture Overview](../docs/architecture/api-gateway.md)
- [API Specification](./openapi.yaml)

## 🤝 Contributing

1. Follow Clean Architecture principles
2. Write tests for new features
3. Update documentation
4. Follow TypeScript best practices
5. Run linter before committing

## 🌐 Vietnamese Error Messages

API Gateway trả về error messages bằng tiếng Việt để cải thiện UX:

```json
{
  "success": false,
  "error": "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "code": "UNAUTHORIZED",
  "requestId": "uuid"
}
```

**Supported Error Codes:**

- `UNAUTHORIZED` (401): Chưa đăng nhập hoặc token hết hạn
- `FORBIDDEN` (403): Không có quyền truy cập
- `NOT_FOUND` (404): Không tìm thấy tài nguyên
- `VALIDATION_ERROR` (422): Dữ liệu không hợp lệ
- `RATE_LIMIT_EXCEEDED` (429): Vượt quá giới hạn request
- `INTERNAL_SERVER_ERROR` (500): Lỗi hệ thống

## 📝 License

MIT

## 👥 Authors

Hospital Management Team

---

**Status**: ✅ Production Ready

