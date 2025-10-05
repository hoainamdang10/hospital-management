# Dockerize Monorepo Microservices - Giải Pháp Đúng

## 🎯 **Vấn Đề**

Hospital Management V2 sử dụng:
- **Monorepo structure**: Multiple services + shared folder
- **TypeScript path aliases**: `@shared/*` → `../shared/*`
- **Clean Architecture + DDD**: Services depend on shared domain primitives

**Problem**: TypeScript path aliases (`@shared/*`) không work trong Node.js runtime!

```typescript
// Source code (works in TypeScript)
import { AggregateRoot } from '@shared/domain/base/aggregate-root';

// Compiled code (fails in Node.js)
const aggregate_root_1 = require("@shared/domain/base/aggregate-root");
// ❌ Error: Cannot find module '@shared/domain/base/aggregate-root'
```

---

## ✅ **Giải Pháp Đúng: Unified Build Context + Proper WORKDIR**

### **1. Docker Compose Configuration**

**ĐÚNG** ✅:
```yaml
services:
  patient-registry-service:
    build:
      context: .                                    # Parent directory
      dockerfile: ./patient-registry-service/Dockerfile
```

**SAI** ❌:
```yaml
services:
  patient-registry-service:
    build:
      context: ./patient-registry-service           # Service directory only
      dockerfile: Dockerfile
```

**Lý do**: Build context phải là parent directory để access được `shared/` folder.

---

### **2. Dockerfile Structure**

**ĐÚNG** ✅:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy entire structure
COPY patient-registry-service/ ./patient-registry-service/
COPY shared/ ./shared/

# Build from service directory
WORKDIR /app/patient-registry-service
RUN npm ci && npm cache clean --force
RUN ln -s /app/patient-registry-service/node_modules /app/node_modules
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app/patient-registry-service              # ⚠️ CRITICAL: Match build structure

# Copy maintaining relative paths
COPY --from=builder /app/patient-registry-service/package*.json ./
COPY --from=builder /app/patient-registry-service/dist ./dist
COPY --from=builder /app/patient-registry-service/node_modules ./node_modules
COPY --from=builder /app/shared ../shared          # ⚠️ CRITICAL: Relative path

CMD ["node", "dist/main.js"]
```

**SAI** ❌:
```dockerfile
# Production stage
FROM node:18-alpine AS production
WORKDIR /app                                       # ❌ Wrong WORKDIR

COPY --from=builder /app/patient-registry-service/dist ./dist
COPY --from=builder /app/shared ./shared           # ❌ Wrong path

CMD ["node", "dist/main.js"]
```

**Lý do**: 
- Compiled code có `require("@shared/...")` được TypeScript resolve thành `require("../shared/...")`
- Runtime cần đúng relative path structure: `/app/patient-registry-service/dist/` → `/app/shared/`

---

### **3. TypeScript Configuration**

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../shared/*"]                 // ✅ Relative path
    }
  },
  "include": [
    "src/**/*",
    "../shared/domain/**/*",                       // ✅ Include shared types
    "../shared/application/**/*"
  ]
}
```

**Lưu ý**: TypeScript compiler sẽ resolve `@shared/*` thành relative paths trong compiled code.

---

## 🏗️ **Architecture Pattern: Monorepo Microservices**

### **Directory Structure**

```
services-v2/
├── shared/                          # Shared domain primitives
│   ├── domain/
│   │   ├── base/
│   │   │   ├── aggregate-root.ts
│   │   │   ├── entity.ts
│   │   │   ├── value-object.ts
│   │   │   └── domain-event.ts
│   │   └── events/
│   ├── application/
│   └── infrastructure/
│
├── identity-service/
│   ├── src/
│   │   ├── domain/
│   │   │   └── aggregates/
│   │   │       └── User.ts         # extends AggregateRoot from @shared
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── patient-registry-service/
│   ├── src/
│   │   ├── domain/
│   │   │   └── aggregates/
│   │   │       └── Patient.ts      # extends AggregateRoot from @shared
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
└── docker-compose.v2.yml
```

---

## 🚫 **Anti-Patterns to Avoid**

### **❌ Anti-Pattern 1: Copy shared vào mỗi service**
```bash
# ❌ Code duplication
cp -r shared/ identity-service/shared/
cp -r shared/ patient-registry-service/shared/
```
**Vấn đề**: Duplicate code, khó maintain, version mismatch.

---

### **❌ Anti-Pattern 2: Publish shared as npm package**
```bash
# ❌ Overkill cho monorepo
cd shared && npm publish
cd identity-service && npm install @hospital/shared
```
**Vấn đề**: Unnecessary complexity, slow development cycle.

---

### **❌ Anti-Pattern 3: Use symlinks in production**
```dockerfile
# ❌ Symlinks don't work well in Docker
RUN ln -s /app/shared /app/patient-registry-service/node_modules/@shared
```
**Vấn đề**: Fragile, breaks easily, hard to debug.

---

### **❌ Anti-Pattern 4: Wrong WORKDIR in production**
```dockerfile
# ❌ Wrong structure
WORKDIR /app
COPY --from=builder /app/patient-registry-service/dist ./dist
COPY --from=builder /app/shared ./shared
# Runtime: /app/dist/main.js tries to require("../shared/...") → /shared (not found!)
```

---

## ✅ **Best Practices**

### **1. Unified Build Context**
- All services use parent directory as build context
- Consistent pattern across all services
- Easy to add new services

### **2. Maintain Relative Path Structure**
- Production WORKDIR matches build structure
- Shared folder copied to correct relative path
- Runtime module resolution works correctly

### **3. Explicit Dependencies**
- tsconfig.json includes shared types
- Clear dependency graph
- Type safety across services

### **4. Multi-stage Build**
- Builder stage: Full dependencies + build tools
- Production stage: Only runtime dependencies
- Smaller production images

### **5. Security**
- Non-root user in production
- Minimal base image (alpine)
- No unnecessary tools in production

---

## 📊 **Comparison: Solutions**

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Unified Build Context** | ✅ Clean, maintainable<br>✅ No code duplication<br>✅ Fast development | ⚠️ Larger build context | ✅ **RECOMMENDED** |
| Copy shared to each service | ✅ Simple Dockerfile | ❌ Code duplication<br>❌ Version mismatch | ❌ Anti-pattern |
| Publish as npm package | ✅ Standard approach | ❌ Overkill for monorepo<br>❌ Slow cycle | ❌ Not suitable |
| Symlinks | ✅ No duplication | ❌ Fragile<br>❌ Hard to debug | ❌ Not recommended |

---

## 🎯 **Implementation Checklist**

- [x] Update docker-compose.v2.yml: Set `context: .` for all services
- [x] Update Dockerfiles: Copy both service and shared folders
- [x] Set correct WORKDIR in production stage
- [x] Copy shared to correct relative path (`../shared`)
- [x] Test build: `docker-compose build`
- [x] Test runtime: `docker-compose up`
- [x] Verify health endpoints
- [ ] Document pattern for new services
- [ ] Update CI/CD pipelines

---

## 📝 **Example: Adding New Service**

```yaml
# docker-compose.v2.yml
new-service:
  build:
    context: .                              # ✅ Parent directory
    dockerfile: ./new-service/Dockerfile
  ports:
    - "3030:3030"
```

```dockerfile
# new-service/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY new-service/ ./new-service/
COPY shared/ ./shared/
WORKDIR /app/new-service
RUN npm ci && npm run build

FROM node:18-alpine AS production
WORKDIR /app/new-service                    # ✅ Match structure
COPY --from=builder /app/new-service/dist ./dist
COPY --from=builder /app/new-service/node_modules ./node_modules
COPY --from=builder /app/shared ../shared   # ✅ Relative path
CMD ["node", "dist/main.js"]
```

---

## 🔍 **Debugging Tips**

### **Check build context**
```bash
docker-compose -f docker-compose.v2.yml build --progress=plain patient-registry-service
```

### **Check runtime structure**
```bash
docker run -it services-v2-patient-registry-service sh
ls -la /app
ls -la /app/patient-registry-service
ls -la /app/shared
```

### **Check module resolution**
```bash
docker run -it services-v2-patient-registry-service node -e "console.log(require.resolve('../shared/domain/base/aggregate-root'))"
```

---

## 📚 **References**

- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Monorepo Best Practices](https://monorepo.tools/)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Status**: ✅ **IMPLEMENTED & TESTED**
**Last Updated**: 2025-10-04
**Author**: Hospital Management Team V2

