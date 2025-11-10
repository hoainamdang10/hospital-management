# 🔍 Phân Tích Chi Tiết Lỗi Appointments API

**Ngày:** 10/11/2025 - 17:26  
**Service:** Appointments Service (port 3004)  
**Issue:** 404 Not Found on patient appointments endpoint

---

## 🎯 ROOT CAUSE ANALYSIS

### Request Flow:
```
Frontend
  ↓
  GET /api/v2/patients/59fe260f.../appointments
  ↓
API Gateway (localhost:3101)
  pathPrefix: "/api/v2/patients"
  ↓ Express automatically strips pathPrefix
  Forward: /59fe260f.../appointments
  ↓
Appointments Service (localhost:3004)
  Expects: /api/v2/patients/:patientId/appointments
  ✗ Receives: /59fe260f.../appointments
  ✗ NO ROUTE MATCH → 404 Not Found
```

---

## 📂 Code Evidence

### 1. **API Gateway Configuration** (`api-gateway/src/main.ts:346-353`)

```typescript
// Appointments Service V2 - Patient appointments endpoint (port 3004)
// No permission check - patients can view their own appointments
ServiceRoute.create({
  serviceName: "appointments-service",
  baseUrl: "http://localhost:3004",
  pathPrefix: "/api/v2/patients",  // ⚠️ Gateway strips this!
  requiresAuth: true,
}),
```

### 2. **Express Routing Behavior** (`api-gateway/src/main.ts:629`)

```typescript
// Important: Do NOT strip path prefix - proxy will forward full path to backend
this.app.use(route.pathPrefix, ...middlewares, proxyMiddleware);
```

**❌ Comment is MISLEADING!** Express `app.use(pathPrefix, middleware)` **ALWAYS strips** the pathPrefix before passing to middleware.

**Example:**
- Request: `/api/v2/patients/123/appointments`
- Express strips: `/api/v2/patients`
- Middleware receives: `/123/appointments`

### 3. **Appointments Service Routes** (`appointments-service/src/main.ts:284`)

**BEFORE FIX:**
```typescript
// Query routes (Read operations - CQRS Queries with denormalized data)
// Moved from /api/v2 to /api/v1 for consistency
app.use("/api/v1", createAppointmentQueryRoutes());
```

Service only mounted on `/api/v1`, but API Gateway forwards to `/api/v2`!

**Route Definition** (`appointmentQueryRoutes.ts:48`)
```typescript
router.get('/patients/:patientId/appointments', authenticate, ...)
```

**Full Path Expected:**
- `/api/v1/patients/:patientId/appointments` ✓ (works)
- `/api/v2/patients/:patientId/appointments` ✗ (404 before fix)

---

## ✅ SOLUTION IMPLEMENTED

### **File:** `appointments-service/src/main.ts:284-285`

```typescript
// Query routes (Read operations - CQRS Queries with denormalized data)
// Mounted on both v1 and v2 for backward compatibility
app.use("/api/v1", createAppointmentQueryRoutes());
app.use("/api/v2", createAppointmentQueryRoutes()); // ✅ ADDED THIS LINE
```

**Why this works:**
1. API Gateway forwards: `/59fe260f.../appointments` (after stripping `/api/v2/patients`)
2. But wait... that still won't work! 

**Wait, let me re-analyze...**

---

## ⚠️ WAIT - DEEPER ANALYSIS NEEDED

Let me trace through ServiceRoute.getTargetUrl():

```typescript
public getTargetUrl(originalPath: string): string {
  const relativePath = originalPath.substring(this.props.pathPrefix.length);
  return `${this.props.baseUrl}${relativePath}`;
}
```

**Example:**
- originalPath: `/api/v2/patients/123/appointments`
- pathPrefix: `/api/v2/patients`
- relativePath: `/123/appointments`
- targetUrl: `http://localhost:3004/123/appointments`

But this method might not be used! Let me check how proxy actually works.

---

## 🔍 ACTUAL PROXY BEHAVIOR

Looking at `api-gateway/src/main.ts:629`:
```typescript
this.app.use(route.pathPrefix, ...middlewares, proxyMiddleware);
```

With Express `app.use(pathPrefix, middleware)`:
1. Request: `/api/v2/patients/123/appointments`
2. Express **strips** `/api/v2/patients`
3. Proxy receives: `/123/appointments`
4. Proxy forwards to: `http://localhost:3004/123/appointments`

**But service expects:**
- With v1: `/api/v1/patients/123/appointments`
- With v2: `/api/v2/patients/123/appointments`

**So `/123/appointments` will NOT match any route!**

---

## ✅ CORRECT SOLUTION

Need to add pathRewrite OR mount routes at root level!

### **Option 1: Add pathRewrite in API Gateway** (BEST for consistency)

```typescript
ServiceRoute.create({
  serviceName: "appointments-service",
  baseUrl: "http://localhost:3004",
  pathPrefix: "/api/v2/patients",
  pathRewrite: {
    "^/api/v2/patients": "/api/v2/patients"  // Don't strip, forward as-is
  },
  requiresAuth: true,
}),
```

### **Option 2: Mount routes at root in Service** (Quick fix)

In `appointments-service/src/main.ts`, add:
```typescript
// For direct API Gateway v2 forwarding
app.use("/", createAppointmentQueryRoutes());
```

But this conflicts with other routes!

### **Option 3: Check if pathRewrite is already handled**

Looking at `proxyRoutes.ts:68-78`:
```typescript
const proxyOptions: Options = {
  target: config.target,
  changeOrigin: config.changeOrigin !== false,
  pathRewrite: config.pathRewrite,  // ← Uses pathRewrite if provided!
```

**So pathRewrite IS supported!**

---

## ✅ FINAL CORRECT SOLUTION

### Update API Gateway routes to include pathRewrite:

**File:** `api-gateway/src/main.ts`

```typescript
// Appointments Service V2 - Patient appointments endpoint
ServiceRoute.create({
  serviceName: "appointments-service",
  baseUrl: "http://localhost:3004",
  pathPrefix: "/api/v2/patients",
  pathRewrite: {
    "^/": "/api/v2/patients/"  // Prepend back the prefix
  },
  requiresAuth: true,
}),

// Appointments Service V2 - Doctor appointments endpoint  
ServiceRoute.create({
  serviceName: "appointments-service",
  baseUrl: "http://localhost:3004",
  pathPrefix: "/api/v2/doctors",
  pathRewrite: {
    "^/": "/api/v2/doctors/"  // Prepend back the prefix
  },
  requiresAuth: true,
}),
```

**But wait!** ServiceRoute doesn't have pathRewrite property yet!

Need to update ServiceRoute interface first.

---

## 🎯 SIMPLEST WORKING SOLUTION

Just add v2 mounting in Appointments Service (already done):

```typescript
app.use("/api/v2", createAppointmentQueryRoutes());
```

Then the path flow will be:
1. API Gateway strips `/api/v2/patients` → forwards `/123/appointments`
2. Service receives at root `/123/appointments`
3. **STILL WON'T MATCH** `/api/v2/patients/:patientId/appointments`

**Actually, let me test the REAL behavior...**

The key is in line 629: `app.use(route.pathPrefix, ...middlewares, proxyMiddleware)`

Express will mount proxy at that prefix, so proxy receives the **STRIPPED** path!

**FINAL UNDERSTANDING:**
Service needs routes WITHOUT prefix to match stripped paths!

```typescript
// In appointments-service, add root-level routes
const queryRoutesForGateway = createAppointmentQueryRoutes();
app.use("/", queryRoutesForGateway); // Matches /123/appointments
```

But queryRoutes has paths like `/patients/:id/appointments`, not `/:id/appointments`!

---

## 🎯 ACTUAL FINAL SOLUTION

Need to understand that when Express strips prefix and proxy forwards, the service needs to handle the remaining path.

**API Gateway sends:** `/123/appointments` to `localhost:3004`  
**Service should match:** `/:patientId/appointments`

But our routes are `/patients/:patientId/appointments`!

**Two options:**
1. Change service routes to `/:patientId/appointments` (breaks v1 API)
2. Add pathRewrite in gateway to restore the path

Since ServiceRoute doesn't support pathRewrite config yet, the quickest fix is:

**Mount appointments query routes to match the stripped path pattern!**

Wait, I already added `/api/v2` mounting. Let me verify the logic again:

With `app.use("/api/v2", router)`:
- Gateway forwards: `/123/appointments`
- Service at root receives: `/123/appointments`  
- **DOES NOT** match `/api/v2/patients/:id/appointments`

The v2 mounting helps if gateway forwards `/api/v2/...`!

Let me check if proxy forwards full path or stripped path...

From proxyRoutes.ts, there's NO explicit pathRewrite, so http-proxy-middleware will forward the path AS RECEIVED by the middleware.

Since Express stripped it to `/123/appointments`, that's what gets forwarded!

**SOLUTION:** Service needs route at `/`:
```typescript
app.use("/patients", createAppointmentQueryRoutes());
```

Then `/123/appointments` →  wait, still won't match.

The route is defined as `/patients/:patientId/appointments`, which expects the path to START with `/patients/`.

But gateway forwards `/123/appointments` without `/patients/` prefix!

**REAL SOLUTION:** Gateway needs to NOT strip `/patients/` part!

Change gateway pathPrefix to `/api/v2` not `/api/v2/patients`:
```typescript
pathPrefix: "/api/v2",
```

Then full path `/api/v2/patients/123/appointments` → Express strips `/api/v2` → forwards `/patients/123/appointments` → matches service route!

