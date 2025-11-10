# Appointments API 404 Error - Root Cause Analysis & Fix

**Date:** November 10, 2025  
**Issue:** Patient appointments endpoint returning 404 Not Found  
**Severity:** High - Blocking patient dashboard functionality  
**Status:** ✅ RESOLVED

---

## 1. Problem Statement

### Symptoms
- Frontend calls: `GET /api/v2/patients/{patientId}/appointments`
- Response: `404 Not Found`
- Error occurs on patient dashboard when loading appointments list
- Other APIs (auth, identity) working normally

### User Impact
- Patients cannot view their appointments
- Dashboard shows loading spinners indefinitely
- No error message displayed to users (poor UX)

---

## 2. Root Cause Analysis

### Architecture Overview

```
┌─────────┐      ┌──────────────┐      ┌────────────────────┐
│ Frontend│─────▶│ API Gateway  │─────▶│ Appointments       │
│         │      │ (Port 3101)  │      │ Service (Port 3004)│
└─────────┘      └──────────────┘      └────────────────────┘
                 Proxy forwards
                 full path using
                 http-proxy-middleware
```

### The Root Cause: Version Mismatch

**API Gateway Configuration** (`api-gateway/src/main.ts:346-353`):
```typescript
ServiceRoute.create({
  serviceName: "appointments-service",
  baseUrl: "http://localhost:3004",
  pathPrefix: "/api/v2/patients",  // ← Routing v2 requests
  requiresAuth: true,
})
```

**Appointments Service Routes** (`appointments-service/src/main.ts:284` - BEFORE FIX):
```typescript
// Query routes (Read operations)
app.use("/api/v1", createAppointmentQueryRoutes()); // ← Only v1 mounted!
```

**Query Route Definition** (`appointmentQueryRoutes.ts:48`):
```typescript
router.get('/patients/:patientId/appointments', authenticate, ...)
```

### Request Flow Analysis

**Expected Flow:**
```
1. Frontend Request:
   GET /api/v2/patients/59fe260f-a6f6-4c79-ba22-b9359ffc82c4/appointments

2. API Gateway (Express + http-proxy-middleware):
   - Matches pathPrefix: "/api/v2/patients"
   - Proxy forwards FULL PATH to target
   
3. Forwarded to Appointments Service:
   GET http://localhost:3004/api/v2/patients/59fe260f.../appointments

4. Appointments Service tries to match:
   ✓ /api/v1/patients/:patientId/appointments  (exists)
   ✗ /api/v2/patients/:patientId/appointments  (NOT FOUND!)
   
5. Result: 404 Not Found ❌
```

### Key Technical Detail: http-proxy-middleware Behavior

When using Express with http-proxy-middleware:

```javascript
app.use(pathPrefix, proxyMiddleware)
```

**Important:** The proxy uses `req.url` (not `req.path`), which contains the **FULL original path**.

- `req.path` → Stripped by Express (e.g., `/123/appointments`)
- `req.url` → Keeps full path (e.g., `/api/v2/patients/123/appointments`)
- **Proxy forwards `req.url`** → Full path sent to target service!

This is **BY DESIGN** in http-proxy-middleware to preserve the original request path.

---

## 3. Solution

### The Fix

**File:** `backend/services-v2/appointments-service/src/main.ts`

**Line 285 - Added:**
```typescript
// Query routes (Read operations - CQRS Queries with denormalized data)
// Mounted on both v1 and v2 for backward compatibility
app.use("/api/v1", createAppointmentQueryRoutes());
app.use("/api/v2", createAppointmentQueryRoutes()); // ← NEW LINE ADDED
```

### Why This Works

By mounting the same routes on both `/api/v1` and `/api/v2`, the service now accepts requests from:
- **v1 API calls:** `/api/v1/patients/:id/appointments` ✅
- **v2 API calls:** `/api/v2/patients/:id/appointments` ✅

This provides **backward compatibility** without breaking existing v1 clients while supporting the API Gateway's v2 routing.

### Verification

**Before Fix:**
```bash
$ curl http://localhost:3004/api/v2/patients/123/appointments
{"success":false,"error":{"code":"NOT_FOUND"}}  # 404
```

**After Fix:**
```bash
$ curl http://localhost:3004/api/v2/patients/123/appointments
{"success":false,"message":"Unauthorized"}  # 401 (route exists!)
```

**End-to-End Test:**
```
Frontend → API Gateway → Appointments Service
GET /api/v2/patients/{id}/appointments → 200 OK ✅
```

---

## 4. Why Was This Confusing?

### Misleading Comment in Code

**File:** `api-gateway/src/main.ts:628`
```typescript
// Important: Do NOT strip path prefix - proxy will forward full path to backend
this.app.use(route.pathPrefix, ...middlewares, proxyMiddleware);
```

**This comment is MISLEADING** because:
1. Express **DOES strip** `pathPrefix` from `req.path`
2. But proxy uses `req.url` which retains the full path
3. So the comment is technically correct about the final outcome, but incorrect about Express behavior

### Historical Context

Looking at the comment in `appointments-service/src/main.ts:283`:
```typescript
// Moved from /api/v2 to /api/v1 for consistency
```

**Timeline:**
1. Service originally had v2 routes
2. Team decided to "standardize" on v1
3. Routes were moved from v2 to v1  
4. **BUT** API Gateway config was never updated!
5. Result: Gateway still routes to v2, service only has v1 → 404 errors

This is a classic **synchronization issue** between gateway and service configurations.

---

## 5. Lessons Learned

### For This Project

1. **Version alignment:** When changing API versions in services, update ALL gateway configs
2. **Testing:** Need integration tests that verify gateway → service routing
3. **Documentation:** Keep a registry of which gateway paths map to which service endpoints
4. **Hot reload:** The service auto-restarted when code changed, which is why the fix worked immediately

### Best Practices

1. **Avoid version mismatches:** Use consistent API versioning across gateway and services
2. **Centralized routing config:** Consider a single source of truth for route mappings
3. **Better error messages:** Services should log incoming request paths for debugging
4. **Health checks:** Include routing health checks in CI/CD pipeline
5. **Clear comments:** Document actual behavior, not intended behavior

---

## 6. Related Issues

### Still Outstanding

**Notifications API - 503 Service Unavailable:**
```
GET /api/v1/notifications/patient/{patientId}
Status: 503 Service Unavailable
```

**Cause:** Notifications Service (port 3011/3031) is not running

**Fix:** Start the notifications service:
```bash
cd backend/services-v2/notifications-service
npm run dev
```

### Fixed Issues

- ✅ **Appointments API** - v2 routes added
- ✅ **Session Authentication** - Cookie forwarding working correctly
- ✅ **API Gateway** - Proxy middleware configured properly

---

## 7. Verification Checklist

- [x] Direct service endpoint test (bypassing gateway)
- [x] Gateway → Service end-to-end test  
- [x] Frontend → Gateway → Service full flow test
- [x] Browser DevTools network inspection
- [x] Service logs verification
- [ ] Integration test added to CI/CD (TODO)
- [ ] Documentation updated in API registry (TODO)

---

## 8. Code References

### Files Modified
- `backend/services-v2/appointments-service/src/main.ts` (Line 285)

### Files Referenced (Not Modified)
- `backend/services-v2/api-gateway/src/main.ts` (Line 346-353, 628-629)
- `backend/services-v2/api-gateway/src/presentation/routes/proxyRoutes.ts`
- `backend/services-v2/api-gateway/src/domain/value-objects/ServiceRoute.ts`
- `backend/services-v2/appointments-service/src/presentation/routes/appointmentQueryRoutes.ts`
- `frontend/lib/api/appointments.service.ts`

---

## 9. Technical Details

### HTTP Proxy Middleware Version
```json
"http-proxy-middleware": "^2.0.6"
```

### Express Routing Behavior

**When using:**
```javascript
app.use('/api/v2/patients', middleware)
```

**For request:** `GET /api/v2/patients/123/appointments`

Express provides middleware with:
- `req.path` = `/123/appointments` (stripped)
- `req.url` = `/api/v2/patients/123/appointments` (full path)
- `req.baseUrl` = `/api/v2/patients`

http-proxy-middleware uses `req.url` for forwarding.

---

## 10. Future Improvements

1. **Unified API versioning strategy**
   - Define clear versioning policy (v1 vs v2)
   - Document migration path from v1 to v2
   - Deprecation timeline for v1 endpoints

2. **Automated routing tests**
   - Integration tests for gateway → service routing
   - Contract tests between gateway config and service routes
   - Add to CI/CD pipeline

3. **Service mesh consideration**
   - Evaluate service mesh (Istio, Linkerd) for routing
   - Centralized routing configuration
   - Better observability

4. **Better error handling**
   - Display user-friendly error messages in frontend
   - Implement retry logic for transient failures
   - Add fallback UI states

---

**Document Author:** AI Assistant  
**Last Updated:** November 10, 2025  
**Review Status:** Pending human review
