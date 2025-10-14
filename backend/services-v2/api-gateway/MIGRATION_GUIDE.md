# API Gateway Migration Guide

## 📋 Tổng quan

Document này mô tả các thay đổi quan trọng trong API Gateway để tuân thủ bounded context và Clean Architecture principles.

## 🔄 Các thay đổi chính

### 1. **Xóa Database Functions** ⚠️ BREAKING CHANGE

**Trước:**
```
api-gateway/
└── database/
    └── functions/
        └── check_user_permission.sql  ❌ VI PHẠM BOUNDED CONTEXT
```

**Sau:**
```
api-gateway/
└── (không còn database folder)  ✅
```

**Lý do:**
- API Gateway là stateless proxy/router, KHÔNG NÊN có database riêng
- Vi phạm bounded context khi truy cập trực tiếp vào `auth_schema` của Identity Service
- Tạo tight coupling giữa services

---

### 2. **IdentityServiceClient thay thế SupabasePermissionChecker** ⚠️ BREAKING CHANGE

**Trước:**
```typescript
// ❌ Truy cập trực tiếp database
const permissionChecker = new SupabasePermissionChecker({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
}, logger);
```

**Sau:**
```typescript
// ✅ Gọi Identity Service API
const permissionChecker = new IdentityServiceClient({
  identityServiceUrl: process.env.IDENTITY_SERVICE_URL,
  timeout: 5000,
  retries: 3
}, logger);
```

**Lợi ích:**
- Tuân thủ microservices principles
- Không duplicate permission logic
- Dễ maintain và test
- Có thể cache ở Identity Service level

---

### 3. **Authorization Middleware được sử dụng** ✅ NEW FEATURE

**Trước:**
```typescript
// ❌ Chỉ có authentication, không có authorization
this.app.use('/api/v1/patients',
  this.authenticationMiddleware.authenticate(),
  createProxyRoute(...)
);
```

**Sau:**
```typescript
// ✅ Có cả authentication và authorization
this.app.use('/api/v1/patients',
  this.authenticationMiddleware.authenticate(),
  this.authorizationMiddleware.requireAnyPermission(['patient:read', 'patient:write']),
  createProxyRoute(...)
);
```

**Lợi ích:**
- Permission checking ở API Gateway level
- Fail fast - không cần forward request đến downstream service
- Consistent authorization logic

---

### 4. **Routing Configuration Refactored** ✅ IMPROVEMENT

**Trước:**
```typescript
// ❌ Routes được định nghĩa 2 lần
// Lần 1: registerServiceRoutes()
const routes = [
  ServiceRoute.create({
    serviceName: 'patient-registry-service',
    requiredPermissions: ['patient:read']  // Không được sử dụng
  })
];

// Lần 2: setupRoutes()
this.app.use('/api/v1/patients',
  this.authenticationMiddleware.authenticate(),
  createProxyRoute(...)
);
```

**Sau:**
```typescript
// ✅ Routes được generate tự động từ ServiceRoute
const routes = this.serviceRegistry.getAllRoutes();

routes.forEach(route => {
  const middlewares = [];
  
  if (route.requiresAuth) {
    middlewares.push(this.authenticationMiddleware.authenticate());
    
    if (route.requiredPermissions) {
      middlewares.push(
        this.authorizationMiddleware.requireAnyPermission(route.requiredPermissions)
      );
    }
  }
  
  this.app.use(route.pathPrefix, ...middlewares, createProxyRoute(...));
});
```

**Lợi ích:**
- Single source of truth
- Không duplicate configuration
- Dễ thêm/sửa routes

---

### 5. **Circuit Breaker Implementation** ✅ NEW FEATURE

**Trước:**
```typescript
// ❌ Không có resilience pattern
async isHealthy(serviceName: string): Promise<boolean> {
  const response = await fetch(`${route.baseUrl}/health`);
  return response.ok;
}
```

**Sau:**
```typescript
// ✅ Có Circuit Breaker
async isHealthy(serviceName: string): Promise<boolean> {
  const circuitBreaker = this.circuitBreakers.get(serviceName);
  
  return await circuitBreaker.execute(async () => {
    return await this.performHealthCheck(route);
  });
}
```

**Lợi ích:**
- Tự động fail fast khi service down
- Tự động recovery khi service up lại
- Giảm load lên downstream services

---

## 🚀 Migration Steps

### Bước 1: Cập nhật Environment Variables

**Xóa:**
```bash
# ❌ Không cần nữa
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Giữ lại:**
```bash
# ✅ Vẫn cần
IDENTITY_SERVICE_URL=http://identity-service:3001
JWT_SECRET=...
JWT_ISSUER=...
JWT_AUDIENCE=...
```

**Thêm mới (optional):**
```bash
# Circuit Breaker configuration
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
CIRCUIT_BREAKER_MONITORING_PERIOD=60000
```

### Bước 2: Cài đặt Dependencies

```bash
cd backend/services-v2/api-gateway
npm install axios@^1.6.0
npm install --save-dev axios-mock-adapter@^1.22.0
```

### Bước 3: Build và Test

```bash
# Build
npm run build

# Run tests
npm test

# Run integration tests
npm run test:integration
```

### Bước 4: Deploy

```bash
# Docker Compose
cd backend/services-v2
docker-compose -f docker-compose.v2.yml up -d api-gateway

# Hoặc standalone
cd backend/services-v2/api-gateway
npm start
```

---

## ⚠️ Breaking Changes

### 1. Identity Service phải expose permission check endpoints

API Gateway bây giờ gọi Identity Service API thay vì truy cập database trực tiếp.

**Identity Service cần có các endpoints:**

```typescript
POST /api/v1/auth/check-permission
Body: { userId: string, permission: string }
Response: { success: boolean, allowed: boolean, reason?: string }

POST /api/v1/auth/check-permissions
Body: { userId: string, permissions: string[], requireAll: boolean }
Response: { success: boolean, allowed: boolean, reason?: string }

POST /api/v1/auth/check-role
Body: { userId: string, role: string }
Response: { success: boolean, allowed: boolean, reason?: string }

POST /api/v1/auth/check-roles
Body: { userId: string, roles: string[], requireAll: boolean }
Response: { success: boolean, allowed: boolean, reason?: string }
```

### 2. Permission checking ở API Gateway level

Requests sẽ bị reject ở API Gateway nếu không có permission, thay vì forward đến downstream service.

**Impact:**
- Faster failure (fail fast)
- Giảm load lên downstream services
- Consistent error responses

---

## 📊 Performance Impact

### Latency

**Trước:**
- Permission check: ~10ms (direct database query)

**Sau:**
- Permission check: ~20-30ms (HTTP call to Identity Service)
- **Có thể cache ở Identity Service để giảm latency**

### Resilience

**Trước:**
- Không có circuit breaker
- Mỗi request đều gọi downstream service

**Sau:**
- Circuit breaker tự động fail fast
- Giảm load khi service down

---

## 🧪 Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### Manual Testing

```bash
# 1. Health check
curl http://localhost:3101/health

# 2. Authentication test
curl -X POST http://localhost:3101/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# 3. Protected endpoint test
curl http://localhost:3101/api/v1/patients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 Rollback Plan

Nếu cần rollback:

1. Revert code về commit trước migration
2. Restore `.env` với `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`
3. Rebuild và redeploy

```bash
git revert HEAD
npm run build
docker-compose -f docker-compose.v2.yml up -d api-gateway
```

---

## 🎯 Next Steps

1. ✅ Monitor API Gateway logs
2. ✅ Monitor Identity Service performance
3. ✅ Implement caching ở Identity Service
4. ✅ Add Prometheus metrics
5. ✅ Add distributed tracing

---

## 📞 Support

Nếu có vấn đề, liên hệ:
- Team Lead: [Your Name]
- Slack: #api-gateway-support
- Email: support@hospital-management.com

