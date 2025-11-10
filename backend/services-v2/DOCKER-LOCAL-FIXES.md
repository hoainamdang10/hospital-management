# Docker Local Compatibility Fixes

## 📋 Overview

This document tracks all changes made to ensure services work in **both local development and Docker environments**.

## 🔧 Changes Made

### 1. Shared Dependencies (`shared/package.json`)

**Before:**
```json
{
  "dependencies": {
    "@types/uuid": "^10.0.0",
    "uuid": "^13.0.0"
  }
}
```

**After:**
```json
{
  "name": "@hospital-management/shared",
  "version": "2.0.0",
  "dependencies": {
    "@supabase/supabase-js": "^2.56.0",
    "@types/uuid": "^10.0.0",
    "uuid": "^13.0.0",
    "pino": "^10.1.0",
    "pino-pretty": "^13.1.2",
    "amqplib": "^0.10.9",
    "@types/amqplib": "^0.10.7",
    "redis": "^5.8.3"
  }
}
```

**Reason:** Local development requires all dependencies installed in shared folder for module resolution.

### 2. Patient Registry Service

#### a. `tsconfig.json`
**Removed exclusion:**
```diff
- "../shared/infrastructure/**/*",
```
This was blocking imports from `shared/infrastructure/database/optimized-supabase-client.ts`.

#### b. `package.json`
**Updated uuid version:**
```diff
- "uuid": "^9.0.1"
+ "uuid": "^13.0.0"
```
Match with shared folder version.

#### c. `Dockerfile`
**Updated shared dependencies installation:**
```dockerfile
RUN cd /app/shared && \
    if [ -f package.json ]; then \
      npm install; \
    else \
      npm init -y && \
      npm install uuid @types/uuid @supabase/supabase-js pino pino-pretty amqplib @types/amqplib redis --save; \
    fi
```

### 3. API Gateway

#### a. Environment Files
**Added missing `SCHEDULER_SERVICE_URL`:**
- `.env.local` → `http://localhost:3030`
- `.env` → `http://localhost:3030`
- `.env.docker` → `http://scheduler-service:3030`

#### b. `Dockerfile`
**Updated shared dependencies installation** (same as Patient Registry).

### 4. Department Service

#### a. `src/main.ts`
**Fixed route order to prevent health check conflict:**
```diff
+ // Health check endpoint - MUST BE BEFORE department routes
+ app.get('/health', ...);
+ 
+ // Root endpoint
+ app.get('/', ...);
+ 
  // Routes
- app.use('/', createDepartmentRoutes(controller));
+ // Mount department routes - AFTER specific routes to avoid conflicts
+ app.use('/', createDepartmentRoutes(controller));
```

**Issue:** The `/:id` route in department routes was matching `/health` path.

### 5. Other Services with Shared Dependencies

Updated Dockerfiles for:
- **Identity Service**
- **Provider Staff Service**
- **Billing Service**

All now properly install shared dependencies using conditional logic.

## 🐳 Docker vs Local Differences

| Aspect | Local Development | Docker |
|--------|------------------|---------|
| **Module Resolution** | From `shared/node_modules` | Built and bundled in image |
| **Env Loading** | From `.env.local` | From `.env.docker` |
| **Dependencies** | Must be installed manually | Auto-installed during build |
| **Hot Reload** | ✅ Yes (nodemon/ts-node-dev) | ❌ No (needs rebuild) |
| **Debugging** | ✅ Easy | ⚠️ Harder (requires attach) |

## ✅ Testing Recommendations

### Before Docker Build

1. **Test local first:**
   ```bash
   npm run env:local
   npm run dev:infrastructure
   # Start each service manually
   ```

2. **Verify all services healthy:**
   ```bash
   curl http://localhost:3101/health
   ```

3. **Check shared dependencies:**
   ```bash
   cd shared && npm install
   ls -la node_modules/@supabase
   ls -la node_modules/amqplib
   ```

### Docker Build Test

1. **Switch to Docker environment:**
   ```bash
   npm run env:docker
   ```

2. **Build specific service:**
   ```bash
   docker-compose -f docker-compose.v2.yml build patient-registry-service
   docker-compose -f docker-compose.v2.yml build api-gateway
   docker-compose -f docker-compose.v2.yml build identity-service
   docker-compose -f docker-compose.v2.yml build provider-staff-service
   docker-compose -f docker-compose.v2.yml build department-service
   docker-compose -f docker-compose.v2.yml build billing-service
   ```

3. **Test individual service:**
   ```bash
   docker-compose -f docker-compose.v2.yml up patient-registry-service
   # Check logs for errors
   ```

4. **Full stack test:**
   ```bash
   docker-compose -f docker-compose.v2.yml --profile dev:full up -d
   docker-compose -f docker-compose.v2.yml ps
   docker-compose -f docker-compose.v2.yml logs -f
   ```

## 🚨 Potential Issues

### 1. Module Not Found in Docker

**Symptom:** `Cannot find module 'amqplib'` or similar

**Fix:** Rebuild image with `--no-cache`:
```bash
docker-compose -f docker-compose.v2.yml build --no-cache <service-name>
```

### 2. Health Check Fails

**Symptom:** Service shows unhealthy in Docker

**Debug:**
```bash
docker exec -it <container-name> sh
wget -O- http://localhost:<port>/health
```

### 3. Environment Variables Not Loaded

**Symptom:** Service connects to wrong URLs

**Fix:** Ensure `env_file` directive in `docker-compose.v2.yml`:
```yaml
services:
  service-name:
    env_file:
      - .env.docker
      - ./service-name/.env.docker
```

## 📝 Checklist for New Services

When adding a new service that uses shared folder:

- [ ] Add service-specific `.env.local` and `.env.docker`
- [ ] Update Dockerfile to install shared dependencies:
  ```dockerfile
  COPY shared ./shared
  RUN cd /app/shared && \
      if [ -f package.json ]; then \
        npm install; \
      else \
        npm init -y && \
        npm install uuid @types/uuid @supabase/supabase-js pino pino-pretty amqplib @types/amqplib redis --save; \
      fi
  ```
- [ ] Add to `docker-compose.v2.yml` with `env_file` directives
- [ ] Test both local and Docker environments
- [ ] Update this document

## 🎯 Summary

All changes ensure that:
1. ✅ Services run in **local development** with hot reload
2. ✅ Services build and run in **Docker** without errors
3. ✅ **Shared dependencies** are properly installed in both environments
4. ✅ **Environment variables** are correctly loaded per environment
5. ✅ **Health checks** work in both environments

---
**Last Updated:** 2025-11-10
**Updated By:** Multi-env setup fixes for Docker/Local compatibility
