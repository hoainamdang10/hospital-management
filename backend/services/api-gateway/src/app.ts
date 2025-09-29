import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";
import { setupSwagger, validateOpenAPISpec } from "./config/swagger.config";

// import { stream } from '@hospital/shared/src/utils/logger';
import { getMetricsHandler, metricsMiddleware } from "@hospital/shared";
import { sanitizeInput } from "@hospital/shared/dist/middleware/validation.middleware";
import {
  createVersioningMiddleware,
  responseTransformMiddleware,
} from "@hospital/shared/dist/middleware/versioning.middleware";
import {
  ResponseHelper,
  addRequestId,
  globalErrorHandler,
} from "@hospital/shared/dist/utils/response-helpers";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "./middleware/auth.middleware";
import healthRoutes from "./routes/health.routes";
import { ServiceRegistry } from "./services/service-registry";

// Security imports
import { securityMonitor } from "@hospital/shared/dist/utils/securityMonitor";
import { SecurityValidator } from "@hospital/shared/dist/utils/securityValidator";

export function createApp(): express.Application {
  // Validate environment variables on startup
  SecurityValidator.validateOrExit();

  const app = express();
  const serviceRegistry = ServiceRegistry.getInstance();
  const DOCTOR_ONLY_MODE = process.env.DOCTOR_ONLY_MODE === "true";

  // Initialize ResponseHelper
  ResponseHelper.initialize("Hospital Management API Gateway", "1.0.0");

  // Helper function for disabled services
  const createDisabledServiceHandler = (serviceName: string) => {
    return (req: express.Request, res: express.Response) => {
      const errorResponse = ResponseHelper.serviceUnavailable(serviceName);
      errorResponse.error!.details = {
        mode: "doctor-only-development",
        availableServices: ["doctors"],
      };
      res.status(503).json(errorResponse);
    };
  };

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
      ],
      credentials: true,
    })
  );

  // Add request ID to all responses
  app.use(addRequestId);

  // Rate limiting - exclude health endpoints
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    skip: (req: express.Request) => {
      // Skip rate limiting for health check endpoints
      return req.path.includes("/health") || req.path === "/metrics";
    },
    onLimitReached: (req: express.Request) => {
      // Log security event when rate limit is exceeded
      securityMonitor.logRateLimitExceeded(req.ip || "unknown", 1000, 1001, {
        path: req.path,
        userAgent: req.get("User-Agent"),
        method: req.method,
      });
    },
  });
  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Phase 2 Middleware - API Optimization
  app.use(sanitizeInput); // Sanitize input data
  app.use(createVersioningMiddleware()); // API versioning
  app.use(responseTransformMiddleware()); // Response transformation based on version

  // Logging middleware
  app.use(morgan("combined"));

  // Metrics middleware
  app.use(metricsMiddleware("api-gateway"));

  // Setup comprehensive OpenAPI 3.0 documentation
  setupSwagger(app);

  // Validate OpenAPI specification
  validateOpenAPISpec();

  // Health check endpoint
  app.use("/health", healthRoutes);

  // Public health endpoints for individual services (no auth required)
  app.get(
    "/api/auth/health",
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL || "http://auth-service:3001",
      changeOrigin: true,
      pathRewrite: {
        "^/api/auth/health": "/health",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Auth Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "Auth service health check unavailable" });
      },
    })
  );

  app.get(
    "/api/doctors/health",
    createProxyMiddleware({
      target: process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3002",
      changeOrigin: true,
      pathRewrite: {
        "^/api/doctors/health": "/health",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Doctor Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "Doctor service health check unavailable" });
      },
    })
  );

  app.get(
    "/api/patients/health",
    createProxyMiddleware({
      target: process.env.PATIENT_SERVICE_URL || "http://patient-service:3003",
      changeOrigin: true,
      pathRewrite: {
        "^/api/patients/health": "/health",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Patient Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "Patient service health check unavailable" });
      },
    })
  );

  // Public health endpoints for Receptionist and Medical Records (no auth)
  app.get(
    "/api/receptionists/health",
    createProxyMiddleware({
      target:
        process.env.RECEPTIONIST_SERVICE_URL ||
        "http://receptionist-service:3006",
      changeOrigin: true,
      pathRewrite: {
        "^/api/receptionists/health": "/health",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Receptionist Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "Receptionist service health check unavailable" });
      },
    })
  );

  app.get(
    "/api/medical-records/health",
    createProxyMiddleware({
      target:
        process.env.MEDICAL_RECORDS_SERVICE_URL ||
        "http://medical-records-service:3007",
      changeOrigin: true,
      pathRewrite: {
        "^/api/medical-records/health": "/health",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Medical Records Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "Medical records service health check unavailable" });
      },
    })
  );

  app.get(
    "/api/appointments/health",
    createProxyMiddleware({
      target:
        process.env.APPOINTMENT_SERVICE_URL ||
        "http://appointment-service:3004",
      changeOrigin: true,
      pathRewrite: {
        "^/api/appointments/health": "/health",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Appointment Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "Appointment service health check unavailable" });
      },
    })
  );

  app.get(
    "/api/departments/health",
    createProxyMiddleware({
      target:
        process.env.DEPARTMENT_SERVICE_URL || "http://department-service:3005",
      changeOrigin: true,
      pathRewrite: {
        "^/api/departments/health": "/health",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Department Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "Department service health check unavailable" });
      },
    })
  );

  // Public health endpoints for Payment, Notification, and File services (no auth)
  app.get(
    "/api/payments/health",
    createProxyMiddleware({
      target: process.env.PAYMENT_SERVICE_URL || "http://payment-service:3009",
      changeOrigin: true,
      pathRewrite: { "^/api/payments/health": "/health" },
      onError: (err: any, req: any, res: any) => {
        console.error("Payment Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "Payment service health check unavailable" });
      },
    })
  );

  app.get(
    "/api/notifications/health",
    createProxyMiddleware({
      target:
        process.env.NOTIFICATION_SERVICE_URL ||
        "http://notification-service:3011",
      changeOrigin: true,
      pathRewrite: { "^/api/notifications/health": "/health" },
      onError: (err: any, req: any, res: any) => {
        console.error("Notification Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "Notification service health check unavailable" });
      },
    })
  );

  app.get(
    "/api/files/health",
    createProxyMiddleware({
      target: process.env.FILE_SERVICE_URL || "http://file-service:3107",
      changeOrigin: true,
      pathRewrite: { "^/api/files/health": "/health" },
      onError: (err: any, req: any, res: any) => {
        console.error("File Service Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "File service health check unavailable" });
      },
    })
  );

  // Metrics endpoint for Prometheus

  // Public health endpoints for GraphQL Gateway as well (optional)
  app.get(
    "/api/graphql-gateway/health",
    createProxyMiddleware({
      target: process.env.GRAPHQL_GATEWAY_URL || "http://graphql-gateway:3200",
      changeOrigin: true,
      pathRewrite: { "^/api/graphql-gateway/health": "/health" },
      onError: (err: any, req: any, res: any) => {
        console.error("GraphQL Gateway Health Proxy Error:", err);
        res
          .status(503)
          .json({ error: "GraphQL Gateway health check unavailable" });
      },
    })
  );

  app.get("/metrics", getMetricsHandler);

  // GraphQL Gateway Routes - Unified GraphQL API with Smart Authentication
  app.use(
    "/graphql",
    (req, res, next) => {
      // Skip auth for introspection queries and health checks
      if (
        req.method === "GET" ||
        (req.body && req.body.query && req.body.query.includes("__schema"))
      ) {
        return next();
      }

      // Apply optional auth middleware for GraphQL
      // This allows both authenticated and public queries
      optionalAuthMiddleware(req, res, next);
    },
    createProxyMiddleware({
      target: process.env.GRAPHQL_GATEWAY_URL || "http://graphql-gateway:3200",
      changeOrigin: true,
      pathRewrite: {
        "^/graphql": "/graphql",
      },
      timeout: 30000,
      proxyTimeout: 30000,
      ws: true, // Enable WebSocket proxying for subscriptions
      onError: (err: any, req: any, res: any) => {
        console.error("🚨 GraphQL Gateway Proxy Error:", err);
        if (!res.headersSent) {
          res.status(503).json({
            error: "GraphQL Gateway unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        console.log(
          "🔄 Proxying GraphQL request:",
          req.method,
          req.originalUrl,
          "→",
          proxyReq.path
        );

        // Forward authentication headers to GraphQL Gateway
        if (req.headers.authorization) {
          proxyReq.setHeader("authorization", req.headers.authorization);
        }
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.id);
          proxyReq.setHeader("x-user-role", req.user.role);
        }

        // Forward authentication headers if present
        if (req.headers.authorization) {
          proxyReq.setHeader("Authorization", req.headers.authorization);
        }

        // Forward user info if available (from auth middleware)
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.userId);
          proxyReq.setHeader("X-User-Role", req.user.role);
          proxyReq.setHeader("X-User-Email", req.user.email);
        }

        // Forward request ID for tracing
        if (req.headers["x-request-id"]) {
          proxyReq.setHeader("X-Request-ID", req.headers["x-request-id"]);
        }

        // Fix content-length for POST requests (GraphQL mutations)
        if (req.body && req.method === "POST") {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Type", "application/json");
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
      onProxyRes: (proxyRes: any, req: any, res: any) => {
        console.log(
          "GraphQL Gateway response:",
          proxyRes.statusCode,
          req.method,
          req.url
        );
      },
    })
  );

  // Auth Service Routes (Public - no auth middleware)
  const authServiceUrl =
    process.env.AUTH_SERVICE_URL || "http://auth-service:3001";
  console.log("🔧 Auth Service URL:", authServiceUrl);
  console.log("🔧 Environment AUTH_SERVICE_URL:", process.env.AUTH_SERVICE_URL);

  // General auth routes (excluding health which is handled above)
  app.use(
    "/api/auth",
    (req, res, next) => {
      // Skip if this is a health check request (already handled above)
      if (req.path === "/health") {
        return next("route");
      }
      next();
    },
    createProxyMiddleware({
      target: authServiceUrl,
      changeOrigin: true,
      pathRewrite: {
        "^/api/auth": "/api/auth",
      },
      timeout: 10000, // 10 second timeout
      proxyTimeout: 10000,
      onError: (err: any, req: any, res: any) => {
        console.error("Auth Service Proxy Error:", err);
        if (!res.headersSent) {
          res.status(503).json({ error: "Auth service unavailable" });
        }
      },
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        console.log("Proxying auth request:", req.method, req.url);
        // Fix content-length for POST requests
        if (
          req.body &&
          (req.method === "POST" ||
            req.method === "PUT" ||
            req.method === "PATCH")
        ) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Type", "application/json");
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
      onProxyRes: (proxyRes: any, req: any, res: any) => {
        console.log(
          "Auth service response:",
          proxyRes.statusCode,
          req.method,
          req.url
        );
      },
    })
  );

  // Protected routes - require authentication via Auth Service

  // Doctor Service Routes
  app.use(
    "/api/doctors",
    (req, res, next) => {
      // Skip auth for health check (already handled above)
      if (req.path === "/health") {
        return next("route");
      }
      next();
    },
    authMiddleware,
    createProxyMiddleware({
      target: process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3002",
      changeOrigin: true,
      pathRewrite: {
        "^/api/doctors": "/api/doctors",
      },
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err: any, req: any, res: any) => {
        console.error("🚨 Doctor Service Proxy Error:", err);
        if (!res.headersSent) {
          res.status(503).json({
            error: "Doctor service unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        console.log(
          "🔄 Proxying doctor request:",
          req.method,
          req.originalUrl,
          "→",
          proxyReq.path
        );

        // Forward authentication headers
        if (req.headers.authorization) {
          proxyReq.setHeader("Authorization", req.headers.authorization);
        }

        // Forward user info from auth middleware
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.userId);
          proxyReq.setHeader("X-User-Role", req.user.role);
          proxyReq.setHeader("X-User-Email", req.user.email);
        }

        // Fix content-length for POST/PUT/PATCH requests
        if (
          req.body &&
          (req.method === "POST" ||
            req.method === "PUT" ||
            req.method === "PATCH")
        ) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Type", "application/json");
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
      onProxyRes: (proxyRes: any, req: any, res: any) => {
        console.log(
          "✅ Doctor service response:",
          proxyRes.statusCode,
          req.method,
          req.originalUrl
        );
      },
    })
  );

  // REMOVED: Duplicate /api/experiences route - use /api/doctors/:id/experiences instead

  // Patient Service Routes - ENABLED
  app.use(
    "/api/patients",
    (req, res, next) => {
      // Skip auth for health check (already handled above)
      if (req.path === "/health") {
        return next("route");
      }
      next();
    },
    authMiddleware,
    createProxyMiddleware({
      target: process.env.PATIENT_SERVICE_URL || "http://patient-service:3003",
      changeOrigin: true,
      pathRewrite: {
        "^/api/patients": "/api/patients",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Patient Service Proxy Error:", err);
        res.status(503).json({ error: "Patient service unavailable" });
      },
    })
  );

  // Appointment Service Routes - ENABLED
  app.use(
    "/api/appointments",
    (req, res, next) => {
      // Skip auth for health check (already handled above)
      if (req.path === "/health") {
        return next("route");
      }
      next();
    },
    authMiddleware,
    createProxyMiddleware({
      target:
        process.env.APPOINTMENT_SERVICE_URL ||
        "http://appointment-service:3004",
      changeOrigin: true,
      pathRewrite: {
        "^/api/appointments": "/api/appointments",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Appointment Service Proxy Error:", err);
        res.status(503).json({ error: "Appointment service unavailable" });
      },
    })
  );

  // Receptionist Service Routes - MIGRATED TO APPOINTMENT SERVICE (Phase 2B)
  app.use(
    "/api/receptionists",
    authMiddleware,
    createProxyMiddleware({
      target:
        process.env.APPOINTMENT_SERVICE_URL ||
        "http://appointment-service:3004",
      changeOrigin: true,
      pathRewrite: {
        "^/api/receptionists": "/api/receptionists",
      },
      onError: (err: any, req: any, res: any) => {
        console.error(
          "Receptionist Service Proxy Error (via Appointment Service):",
          err
        );
        res.status(503).json({ error: "Receptionist service unavailable" });
      },
    })
  );

  // Receptionist Check-in Routes - MIGRATED TO APPOINTMENT SERVICE (Phase 2B)
  app.use(
    "/api/checkin",
    authMiddleware,
    createProxyMiddleware({
      target:
        process.env.APPOINTMENT_SERVICE_URL ||
        "http://appointment-service:3004",
      changeOrigin: true,
      pathRewrite: {
        "^/api/checkin": "/api/checkin",
      },
      onError: (err: any, req: any, res: any) => {
        console.error(
          "Check-in Service Proxy Error (via Appointment Service):",
          err
        );
        res.status(503).json({ error: "Check-in service unavailable" });
      },
    })
  );

  // Queue Management Routes - NEW (Phase 2B Integration)
  app.use(
    "/api/queue",
    authMiddleware,
    createProxyMiddleware({
      target:
        process.env.APPOINTMENT_SERVICE_URL ||
        "http://appointment-service:3004",
      changeOrigin: true,
      pathRewrite: {
        "^/api/queue": "/api/queue",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Queue Management Service Proxy Error:", err);
        res.status(503).json({ error: "Queue management service unavailable" });
      },
    })
  );

  // Receptionist Reports Routes - MIGRATED TO APPOINTMENT SERVICE (Phase 2B)
  app.use(
    "/api/reports",
    authMiddleware,
    createProxyMiddleware({
      target:
        process.env.APPOINTMENT_SERVICE_URL ||
        "http://appointment-service:3004",
      changeOrigin: true,
      pathRewrite: {
        "^/api/reports": "/api/reports",
      },
      onError: (err: any, req: any, res: any) => {
        console.error(
          "Reports Service Proxy Error (via Appointment Service):",
          err
        );
        res.status(503).json({ error: "Reports service unavailable" });
      },
    })
  );

  // Medical Records Service Routes - ENABLED
  app.use(
    "/api/medical-records",
    authMiddleware,
    createProxyMiddleware({
      target:
        process.env.MEDICAL_RECORDS_SERVICE_URL ||
        "http://medical-records-service:3007",
      changeOrigin: true,
      pathRewrite: {
        "^/api/medical-records": "/api/medical-records",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Medical Records Service Proxy Error:", err);
        res.status(503).json({ error: "Medical records service unavailable" });
      },
    })
  );

  // REMOVED: Prescription Service Routes - MERGED into Medical Records Service
  // Prescription endpoints now available at:
  // - /api/medical-records/:recordId/prescriptions (create/update prescriptions for a medical record)
  // - /api/medical-records/prescriptions/patient/:patientId (get prescriptions by patient)
  // - /api/medical-records/prescriptions/doctor/:doctorId (get prescriptions by doctor)

  // Payment Service Routes - ENABLED
  app.use(
    "/api/payments",
    (req, res, next) => {
      // Skip auth for health check and webhooks
      if (req.path === "/health" || req.path.startsWith("/webhooks")) {
        return next("route");
      }
      next();
    },
    authMiddleware,
    createProxyMiddleware({
      target: process.env.PAYMENT_SERVICE_URL || "http://payment-service:3009",
      changeOrigin: true,
      pathRewrite: {
        "^/api/payments": "/api/payments",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Payment Service Proxy Error:", err);
        res.status(503).json({ error: "Payment service unavailable" });
      },
    })
  );

  // Payment Webhooks (no auth required)
  app.use(
    "/api/webhooks",
    createProxyMiddleware({
      target: process.env.PAYMENT_SERVICE_URL || "http://payment-service:3009",
      changeOrigin: true,
      pathRewrite: {
        "^/api/webhooks": "/api/webhooks",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Payment Webhook Proxy Error:", err);
        res.status(503).json({ error: "Payment webhook service unavailable" });
      },
    })
  );

  // Department Service Routes - MIGRATED TO AUTH SERVICE (Phase 1)
  app.use(
    "/api/departments",
    (req, res, next) => {
      // Skip auth for health check (already handled above)
      if (req.path === "/health") {
        return next("route");
      }
      next();
    },
    authMiddleware,
    createProxyMiddleware({
      target: authServiceUrl, // Migrated to Auth Service
      changeOrigin: true,
      pathRewrite: {
        "^/api/departments": "/api/admin/departments",
      },
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err: any, req: any, res: any) => {
        console.error(
          "🚨 Department Service Proxy Error (via Auth Service):",
          err
        );
        if (!res.headersSent) {
          res.status(503).json({
            error: "Department service unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
    })
  );

  // Specialty Service Routes - MIGRATED TO AUTH SERVICE (Phase 1)
  app.use(
    "/api/specialties",
    authMiddleware,
    createProxyMiddleware({
      target: authServiceUrl, // Migrated to Auth Service
      changeOrigin: true,
      pathRewrite: {
        "^/api/specialties": "/api/admin/departments/specialties",
      },
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err: any, req: any, res: any) => {
        console.error(
          "🚨 Specialty Service Proxy Error (via Auth Service):",
          err
        );
        if (!res.headersSent) {
          res.status(503).json({
            error: "Specialty service unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
    })
  );

  // Room Service Routes - MIGRATED TO AUTH SERVICE (Phase 1)
  app.use(
    "/api/rooms",
    authMiddleware,
    createProxyMiddleware({
      target: authServiceUrl, // Migrated to Auth Service
      changeOrigin: true,
      pathRewrite: {
        "^/api/rooms": "/api/admin/departments/rooms",
      },
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err: any, req: any, res: any) => {
        console.error("🚨 Room Service Proxy Error (via Auth Service):", err);
        if (!res.headersSent) {
          res.status(503).json({
            error: "Room service unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
    })
  );

  // Admin Orchestration Routes - PHASE 3B: Admin Orchestrator → Auth Service
  app.use(
    "/api/admin/orchestrate",
    (req, res, next) => {
      // Skip auth for health check
      if (req.path === "/health") {
        return next("route");
      }
      next();
    },
    authMiddleware,
    createProxyMiddleware({
      target: authServiceUrl, // Route to Auth Service
      changeOrigin: true,
      pathRewrite: {
        "^/api/admin/orchestrate": "/api/admin/orchestrate",
      },
      timeout: 60000, // Extended timeout for complex orchestration operations
      proxyTimeout: 60000,
      onError: (err: any, req: any, res: any) => {
        console.error(
          "🚨 Admin Orchestration Proxy Error (via Auth Service):",
          err
        );
        if (!res.headersSent) {
          res.status(503).json({
            error: "Admin orchestration service unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
            service: "auth-service (orchestration)",
          });
        }
      },
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        // Log orchestration requests for monitoring
        console.log(
          `🎯 Orchestration Request: ${req.method} ${req.url} -> Auth Service`
        );

        // Add orchestration headers
        proxyReq.setHeader("X-Orchestration-Gateway", "api-gateway");
        proxyReq.setHeader(
          "X-Request-ID",
          req.headers["x-request-id"] || "unknown"
        );

        // Forward user context for orchestration
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.id);
          proxyReq.setHeader("X-User-Role", req.user.role);
        }
      },
      onProxyRes: (proxyRes: any, req: any, res: any) => {
        console.log(
          `🎯 Orchestration Response: ${proxyRes.statusCode} ${req.method} ${req.url}`
        );
      },
    })
  );

  // Notification Service Routes - ENABLED
  app.use(
    "/api/notifications",
    authMiddleware,
    createProxyMiddleware({
      target:
        process.env.NOTIFICATION_SERVICE_URL ||
        "http://notification-service:3011",
      changeOrigin: true,
      pathRewrite: {
        "^/api/notifications": "/api/notifications",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("Notification Service Proxy Error:", err);
        res.status(503).json({ error: "Notification service unavailable" });
      },
    })
  );

  // ICD-10 Healthcare Routes - ENABLED (Proxy to Doctor Service)
  app.use(
    "/api/icd10",
    createProxyMiddleware({
      target: process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3002",
      changeOrigin: true,
      pathRewrite: {
        "^/api/icd10": "/api/icd10",
      },
      onError: (err: any, req: any, res: any) => {
        console.error("ICD-10 Service Proxy Error:", err);
        res.status(503).json({ error: "ICD-10 service unavailable" });
      },
    })
  );

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      service: "Hospital Management API Gateway",
      version: "1.0.0",
      mode: DOCTOR_ONLY_MODE ? "doctor-only-development" : "full-system",
      status: "running",
      timestamp: new Date().toISOString(),
      docs: "/docs",
      availableServices: [
        "auth",
        "doctors",
        "patients",
        "appointments",
        "departments", // Migrated to auth service
        "specialties", // Migrated to auth service
        "rooms", // Migrated to auth service
        "medical-records", // Now includes prescription functionality
        "payments",
        "notifications",
        "admin-orchestration", // Phase 3B: Admin orchestration via auth service
      ],
      mergedServices: [
        "prescriptions -> medical-records", // Prescription service merged into Medical Records
        "departments -> auth", // Phase 1: Department service merged into Auth Service
        "admin-orchestrator -> auth", // Phase 3: Admin Orchestrator merged into Auth Service
      ],
      disabledServices: [],
      services: serviceRegistry.getRegisteredServices(),
    });
  });

  // ========================================
  // INTERNAL SERVICE-TO-SERVICE ROUTING
  // ========================================
  // These endpoints allow services to communicate through API Gateway
  // instead of direct service-to-service calls

  // Internal Patient Service Routes (for service-to-service communication)
  app.use(
    "/internal/patients",
    createProxyMiddleware({
      target: process.env.PATIENT_SERVICE_URL || "http://patient-service:3003",
      changeOrigin: true,
      pathRewrite: {
        "^/internal/patients": "/api/patients",
      },
      timeout: 10000,
      proxyTimeout: 10000,
      onError: (err: any, req: any, res: any) => {
        console.error("🚨 Internal Patient Service Proxy Error:", err);
        if (!res.headersSent) {
          res.status(503).json({
            error: "Internal patient service unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        // Forward service-to-service headers
        if (req.headers["x-service-name"]) {
          proxyReq.setHeader("x-service-name", req.headers["x-service-name"]);
        }
        if (req.headers["x-request-id"]) {
          proxyReq.setHeader("x-request-id", req.headers["x-request-id"]);
        }
      },
    })
  );

  // Internal Appointment Service Routes (for service-to-service communication)
  app.use(
    "/internal/appointments",
    createProxyMiddleware({
      target:
        process.env.APPOINTMENT_SERVICE_URL ||
        "http://appointment-service:3004",
      changeOrigin: true,
      pathRewrite: {
        "^/internal/appointments": "/api/appointments",
      },
      timeout: 10000,
      proxyTimeout: 10000,
      onError: (err: any, req: any, res: any) => {
        console.error("🚨 Internal Appointment Service Proxy Error:", err);
        if (!res.headersSent) {
          res.status(503).json({
            error: "Internal appointment service unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        // Forward service-to-service headers
        if (req.headers["x-service-name"]) {
          proxyReq.setHeader("x-service-name", req.headers["x-service-name"]);
        }
        if (req.headers["x-request-id"]) {
          proxyReq.setHeader("x-request-id", req.headers["x-request-id"]);
        }
      },
    })
  );

  // Internal Doctor Service Routes (for service-to-service communication)
  app.use(
    "/internal/doctors",
    createProxyMiddleware({
      target: process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3002",
      changeOrigin: true,
      pathRewrite: {
        "^/internal/doctors": "/api/doctors",
      },
      timeout: 10000,
      proxyTimeout: 10000,
      onError: (err: any, req: any, res: any) => {
        console.error("🚨 Internal Doctor Service Proxy Error:", err);
        if (!res.headersSent) {
          res.status(503).json({
            error: "Internal doctor service unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        // Forward service-to-service headers
        if (req.headers["x-service-name"]) {
          proxyReq.setHeader("x-service-name", req.headers["x-service-name"]);
        }
        if (req.headers["x-request-id"]) {
          proxyReq.setHeader("x-request-id", req.headers["x-request-id"]);
        }
      },
    })
  );

  // Internal Department Service Routes - MIGRATED TO AUTH SERVICE (Phase 1)
  app.use(
    "/internal/departments",
    createProxyMiddleware({
      target: authServiceUrl, // Migrated to Auth Service
      changeOrigin: true,
      pathRewrite: {
        "^/internal/departments": "/api/admin/departments",
      },
      timeout: 10000,
      proxyTimeout: 10000,
      onError: (err: any, req: any, res: any) => {
        console.error(
          "🚨 Internal Department Service Proxy Error (via Auth Service):",
          err
        );
        if (!res.headersSent) {
          res.status(503).json({
            error: "Internal department service unavailable",
            details: err.message,
            timestamp: new Date().toISOString(),
            service: "auth-service (departments)",
          });
        }
      },
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        // Forward service-to-service headers
        if (req.headers["x-service-name"]) {
          proxyReq.setHeader("x-service-name", req.headers["x-service-name"]);
        }
        if (req.headers["x-request-id"]) {
          proxyReq.setHeader("x-request-id", req.headers["x-request-id"]);
        }
      },
    })
  );

  // Service discovery endpoint
  app.get("/services", (req, res) => {
    res.json({
      mode: DOCTOR_ONLY_MODE ? "doctor-only-development" : "full-system",
      availableServices: {
        "graphql-gateway": {
          url: process.env.GRAPHQL_GATEWAY_URL || "http://graphql-gateway:3200",
          status: "active",
          type: "graphql",
          description: "Unified GraphQL API over REST microservices",
        },
        auth: {
          url: process.env.AUTH_SERVICE_URL || "http://auth-service:3001",
          status: "active",
          consolidatedServices: [
            "departments", // Phase 1: Department functionality
            "admin-orchestration", // Phase 3: Admin orchestration functionality
          ],
        },
        doctors: {
          url: process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3002",
          status: "active",
        },
        patients: {
          url: process.env.PATIENT_SERVICE_URL || "http://patient-service:3003",
          status: "active",
        },
        appointments: {
          url:
            process.env.APPOINTMENT_SERVICE_URL ||
            "http://appointment-service:3004",
          status: "active",
        },
        departments: {
          url:
            process.env.DEPARTMENT_SERVICE_URL ||
            "http://department-service:3005",
          status: "active",
        },
        specialties: {
          url:
            process.env.DEPARTMENT_SERVICE_URL ||
            "http://department-service:3005",
          status: "active",
        },
        rooms: {
          url:
            process.env.DEPARTMENT_SERVICE_URL ||
            "http://department-service:3005",
          status: "active",
        },
        "medical-records": {
          url:
            process.env.MEDICAL_RECORDS_SERVICE_URL ||
            "http://medical-records-service:3007",
          status: "active",
        },
        // REMOVED: prescriptions service - merged into medical-records service
        // Prescription endpoints now available at /api/medical-records/prescriptions/*

        notifications: {
          url:
            process.env.NOTIFICATION_SERVICE_URL ||
            "http://notification-service:3011",
          status: "active",
        },
      },
      disabledServices: [],
      internalRoutes: {
        patients: "/internal/patients",
        appointments: "/internal/appointments",
        doctors: "/internal/doctors",
        departments: "/internal/departments",
      },
      communicationPattern: "Pure API Gateway Communication",
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      error: "Route not found",
      path: req.originalUrl,
      method: req.method,
      mode: DOCTOR_ONLY_MODE ? "doctor-only-development" : "full-system",
      availableRoutes: [
        "/graphql",
        "/api/auth",
        "/api/doctors",
        "/api/patients",
        "/api/appointments",
        "/api/departments", // Migrated to auth service
        "/api/specialties", // Migrated to auth service
        "/api/rooms", // Migrated to auth service
        "/api/admin/orchestrate", // Phase 3B: Admin orchestration
        "/api/medical-records",
        "/api/prescriptions",
        "/api/billing",
        "/api/notifications",
        "/health",
        "/docs",
        "/services",
        "/internal/appointments",
        "/internal/doctors",
        "/internal/patients",
        "/internal/departments", // Migrated to auth service
      ],
    });
  });

  // Global error handling middleware with Vietnamese messages (must be last)
  app.use(globalErrorHandler);

  return app;
}
