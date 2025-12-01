import express, { Express, Request, Response } from "express";
import { IncomingMessage } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
// import rateLimit from "express-rate-limit"; // Disabled for development
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { WinstonLogger } from "@infrastructure/logging/WinstonLogger";
import { SupabaseJWTTokenVerifier } from "@infrastructure/auth/SupabaseJWTTokenVerifier";
import { IdentityServiceClient } from "@infrastructure/auth/IdentityServiceClient";
import { ServiceRegistry } from "@infrastructure/proxy/ServiceRegistry";
// import { RedisRateLimitClient } from "@infrastructure/cache/RedisRateLimitClient"; // Disabled for thesis scope
// import { AdvancedRateLimitMiddleware } from "@presentation/middleware/AdvancedRateLimitMiddleware"; // Disabled for thesis scope

import { AuthenticateRequestUseCase } from "@application/use-cases/AuthenticateRequestUseCase";
import { AuthorizeRequestUseCase } from "@application/use-cases/AuthorizeRequestUseCase";

import { AuthenticationMiddleware } from "@presentation/middleware/AuthenticationMiddleware";
import { AuthorizationMiddleware } from "@presentation/middleware/AuthorizationMiddleware";
import { LoggingMiddleware } from "@presentation/middleware/LoggingMiddleware";
import { ErrorHandlingMiddleware } from "@presentation/middleware/ErrorHandlingMiddleware";
import { GlobalProxyMiddleware } from "@presentation/middleware/GlobalProxyMiddleware";

import { createHealthRoutes } from "@presentation/routes/healthRoutes";
import { createMetricsRoutes } from "@presentation/routes/metricsRoutes";
import { createDocsRoutes } from "@presentation/routes/docsRoutes";
import { createDashboardRoutes } from "@presentation/routes/dashboardRoutes";

import { ServiceRoute } from "@domain/value-objects/ServiceRoute";

dotenv.config();

const PORT = process.env.PORT || 3101;
const NODE_ENV = process.env.NODE_ENV || "development";

const logger = new WinstonLogger(
  process.env.LOG_LEVEL || "info",
  process.env.LOG_FORMAT || "json",
);

class ApiGatewayApplication {
  private app: Express;
  private serviceRegistry: ServiceRegistry;
  private globalProxyMiddleware: GlobalProxyMiddleware;
  private authenticationMiddleware: AuthenticationMiddleware;
  // @ts-expect-error - Reserved for future use when permission checking is enabled
  private authorizationMiddleware: AuthorizationMiddleware;
  private loggingMiddleware: LoggingMiddleware;
  private errorHandlingMiddleware: ErrorHandlingMiddleware;
  // private redisRateLimitClient?: RedisRateLimitClient; // Disabled for thesis scope
  // private rateLimitMiddleware?: AdvancedRateLimitMiddleware; // Disabled for thesis scope

  constructor() {
    this.app = express();
    this.serviceRegistry = new ServiceRegistry(logger);

    // Timeout configuration (using default values)
    logger.info("Using default timeout configuration", {
      healthCheck: 5000,
      proxyRequest: 30000,
      proxyUpstream: 30000,
    });

    // Validate required environment variables for Supabase JWT verification
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

    if (!supabaseUrl || !supabaseServiceRoleKey || !jwtSecret) {
      logger.error(
        "Missing required environment variables for JWT verification",
        {
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseKey: !!supabaseServiceRoleKey,
          hasJwtSecret: !!jwtSecret,
        },
      );
      throw new Error(
        "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and JWT_SECRET are required",
      );
    }

    // Validate that JWT_SECRET matches SUPABASE_JWT_SECRET if both are set
    if (
      process.env.JWT_SECRET &&
      process.env.SUPABASE_JWT_SECRET &&
      process.env.JWT_SECRET !== process.env.SUPABASE_JWT_SECRET
    ) {
      logger.warn(
        "JWT_SECRET and SUPABASE_JWT_SECRET do not match - using SUPABASE_JWT_SECRET for consistency",
      );
    }

    // Use Supabase JWT Token Verifier (authoritative source)
    const tokenVerifier = new SupabaseJWTTokenVerifier(
      {
        supabaseUrl,
        supabaseServiceRoleKey,
        jwtSecret: process.env.SUPABASE_JWT_SECRET || jwtSecret,
      },
      logger,
    );

    logger.info("JWT verification configured with Supabase Auth", {
      supabaseUrl,
      jwtSecretSource: process.env.SUPABASE_JWT_SECRET
        ? "SUPABASE_JWT_SECRET"
        : "JWT_SECRET",
    });

    const permissionChecker = new IdentityServiceClient(
      {
        identityServiceUrl:
          process.env.IDENTITY_SERVICE_URL || "http://identity-service:3001",
        timeout: 5000, // 5 seconds
        retries: 3,
      },
      logger,
    );

    const authenticateRequestUseCase = new AuthenticateRequestUseCase(
      tokenVerifier,
      logger,
    );
    const authorizeRequestUseCase = new AuthorizeRequestUseCase(
      permissionChecker,
      logger,
    );

    this.authenticationMiddleware = new AuthenticationMiddleware(
      authenticateRequestUseCase,
    );
    this.authorizationMiddleware = new AuthorizationMiddleware(
      authorizeRequestUseCase,
    );
    this.loggingMiddleware = new LoggingMiddleware(logger);
    this.errorHandlingMiddleware = new ErrorHandlingMiddleware(logger);

    // Initialize GlobalProxyMiddleware for centralized routing
    this.globalProxyMiddleware = new GlobalProxyMiddleware(
      this.serviceRegistry,
      logger,
    );

    this.registerServiceRoutes();
  }

  async initialize(): Promise<void> {
    logger.info("Initializing API Gateway...");

    // DISABLED FOR THESIS SCOPE - Rate limiting completely disabled
    // Initialize Redis for rate limiting
    // try {
    //   this.redisRateLimitClient = new RedisRateLimitClient(
    //     {
    //       url: process.env.REDIS_URL || "redis://redis-v2:6379",
    //       password: process.env.REDIS_PASSWORD,
    //       db: parseInt(process.env.REDIS_RATE_LIMIT_DB || "1"),
    //     },
    //     logger,
    //   );

    //   await this.redisRateLimitClient.connect();
    //   logger.info("Redis rate limit client connected successfully");

    // DISABLED FOR DEVELOPMENT - Advanced rate limiting
    // const rateLimitConfig = {
    //   global: {
    //     windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
    //     max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000"),
    //   },
    //   perUser: {
    //     windowMs: parseInt(process.env.RATE_LIMIT_USER_WINDOW_MS || "900000"),
    //     max: parseInt(process.env.RATE_LIMIT_USER_MAX_REQUESTS || "500"),
    //   },
    //   perEndpoint: {
    //     "/api/v1/auth/login": {
    //       windowMs: 15 * 60 * 1000,
    //       max: 5,
    //     },
    //     "/api/v1/auth/register": {
    //       windowMs: 60 * 60 * 1000,
    //       max: 3,
    //     },
    //     "/api/v1/auth/password/reset": {
    //       windowMs: 60 * 60 * 1000,
    //       max: 3,
    //     },
    //     "/api/v1/patients": {
    //       windowMs: 60 * 1000,
    //       max: 100,
    //     },
    //     "/api/v1/patients/*/medical-history": {
    //       windowMs: 60 * 1000,
    //       max: 50,
    //     },
    //     "/api/v1/providers/*/schedule": {
    //       windowMs: 60 * 1000,
    //       max: 100,
    //     },
    //     "/api/v1/appointments": {
    //       windowMs: 60 * 1000,
    //       max: 50,
    //     },
    //     "/api/v1/clinical/records": {
    //       windowMs: 60 * 1000,
    //       max: 50,
    //     },
    //     "/api/v1/billing/payments": {
    //       windowMs: 60 * 1000,
    //       max: 10,
    //     },
    //     "/api/v1/billing/invoices": {
    //       windowMs: 60 * 1000,
    //       max: 50,
    //     },
    //     "/api/v1/schedules": {
    //       windowMs: 60 * 1000,
    //       max: 100, // Higher limit for schedule management operations
    //     },
    //   },
    // };

    // this.rateLimitMiddleware = new AdvancedRateLimitMiddleware(
    //   this.redisRateLimitClient,
    //   rateLimitConfig,
    //   logger,
    // );

    // logger.info("Advanced rate limiting configured", {
    //   globalMax: rateLimitConfig.global.max,
    //   perUserMax: rateLimitConfig.perUser.max,
    //   endpointCount: Object.keys(rateLimitConfig.perEndpoint).length,
    // });
    // } catch (error) {
    //   logger.error("Failed to initialize Redis rate limiting", {
    //     error: error instanceof Error ? error.message : "Unknown error",
    //   });
    //   logger.warn("Falling back to in-memory rate limiting");
    // }

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();

    logger.info("API Gateway initialization complete");
  }

  private registerServiceRoutes(): void {
    logger.info("Registering service routes...");

    const routes = [
      // Identity Service - Authentication & Authorization (internal port 3001, external 3021)
      ServiceRoute.create({
        serviceName: "identity-service",
        baseUrl:
          process.env.IDENTITY_SERVICE_URL || "http://identity-service:3001",
        pathPrefix: "/api/auth",
        requiresAuth: false,
      }),

      // Identity Service - User Management
      ServiceRoute.create({
        serviceName: "identity-service",
        baseUrl:
          process.env.IDENTITY_SERVICE_URL || "http://identity-service:3001",
        pathPrefix: "/api/v1/users",
        requiresAuth: true,
      }),

      // Identity Service - Permission Management
      ServiceRoute.create({
        serviceName: "identity-service",
        baseUrl:
          process.env.IDENTITY_SERVICE_URL || "http://identity-service:3001",
        pathPrefix: "/api/v1/permissions",
        requiresAuth: true,
        requiredPermissions: ["permission:read"],
      }),

      // Identity Service - Staff Admin (invitation/provision)
      ServiceRoute.create({
        serviceName: "identity-service",
        baseUrl:
          process.env.IDENTITY_SERVICE_URL || "http://identity-service:3001",
        pathPrefix: "/api/admin/staff",
        requiresAuth: true,
      }),

      // Patient Registry Service - Patient Management (internal port 3002, external 3002)
      // Authorization handled by patient-registry-service (ownership-based)
      // Patients can access their own data, Admin/Doctor need patient:read permission
      ServiceRoute.create({
        serviceName: "patient-registry-service",
        baseUrl:
          process.env.PATIENT_REGISTRY_SERVICE_URL || "http://localhost:3002",
        pathPrefix: "/api/v1/patients",
        requiresAuth: true,
        // No requiredPermissions - authorization handled by downstream service
      }),

      // Provider/Staff Service - Doctor/Staff Management (internal port 3003, external 3003)
      // Note: /search endpoint is PUBLIC (no auth required) for appointment booking
      // Other staff endpoints require authentication
      ServiceRoute.create({
        serviceName: "provider-staff-service",
        baseUrl:
          process.env.PROVIDER_STAFF_SERVICE_URL || "http://localhost:3003",
        pathPrefix: "/api/v1/staff",
        requiresAuth: true,
      }),

      // Department Management - Now integrated into Provider/Staff Service
      // No longer a separate service - merged for better bounded context
      ServiceRoute.create({
        serviceName: "provider-staff-service",
        baseUrl:
          process.env.PROVIDER_STAFF_SERVICE_URL || "http://localhost:3003",
        pathPrefix: "/api/v1/departments",
        requiresAuth: false, // Public endpoint for department list
      }),

      // Appointments Service - Appointment Booking & Scheduling (port 3004)
      // Fixed: scheduling-service → appointments-service
      // No permission check - patients need access to book appointments
      // Authorization handled by appointments-service per endpoint
      ServiceRoute.create({
        serviceName: "appointments-service",
        baseUrl:
          process.env.APPOINTMENTS_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://appointments-service:3004"
            : "http://localhost:3004"),
        pathPrefix: "/api/v1/appointments",
        requiresAuth: true,
      }),

      // Appointments Service - Chat (per-appointment conversation)
      ServiceRoute.create({
        serviceName: "appointments-service",
        baseUrl:
          process.env.APPOINTMENTS_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://appointments-service:3004"
            : "http://localhost:3004"),
        pathPrefix: "/api/v1/chat",
        requiresAuth: true,
      }),

      // Appointments Service V2 - Read Model with denormalized data (port 3004)
      ServiceRoute.create({
        serviceName: "appointments-service",
        baseUrl:
          process.env.APPOINTMENTS_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://appointments-service:3004"
            : "http://localhost:3004"),
        pathPrefix: "/api/v2/appointments",
        requiresAuth: true,
        // requiredPermissions: ["appointment:read"], // Removed to allow patient access (ownership check in service)
      }),

      // Appointments Service V2 - Patient appointments endpoint (port 3004)
      // No permission check - patients can view their own appointments
      ServiceRoute.create({
        serviceName: "appointments-service",
        baseUrl:
          process.env.APPOINTMENTS_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://appointments-service:3004"
            : "http://localhost:3004"),
        pathPrefix: "/api/v2/patients",
        requiresAuth: true,
      }),

      // Appointments Service V2 - Doctor appointments endpoint (port 3004)
      ServiceRoute.create({
        serviceName: "appointments-service",
        baseUrl:
          process.env.APPOINTMENTS_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://appointments-service:3004"
            : "http://localhost:3004"),
        pathPrefix: "/api/v2/doctors",
        requiresAuth: true,
      }),

      // Legacy prefix for doctor appointments (/api/v1/doctors/:id/appointments)
      ServiceRoute.create({
        serviceName: "appointments-service",
        baseUrl:
          process.env.APPOINTMENTS_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://appointments-service:3004"
            : "http://localhost:3004"),
        pathPrefix: "/api/v1/doctors",
        requiresAuth: true,
      }),

      // Clinical EMR Service - DISABLED FOR MVP
      // Focus on core features: Identity, Patient, Provider, Appointments, Billing
      // Will be re-enabled post-MVP

      // Billing Service - Self-service invoice operations (patient/staff view)
      ServiceRoute.create({
        serviceName: "billing-service",
        baseUrl:
          process.env.BILLING_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://billing-service:3009"
            : "http://localhost:3009"),
        pathPrefix: "/api/v1/billing/invoices",
        requiresAuth: true,
        // Ownership/authorization handled downstream (patient/staff specific checks)
      }),

      // Billing Service - Admin dashboards (requires billing permissions)
      ServiceRoute.create({
        serviceName: "billing-service",
        baseUrl:
          process.env.BILLING_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://billing-service:3009"
            : "http://localhost:3009"),
        pathPrefix: "/api/v1/billing",
        requiresAuth: true,
        requiredPermissions: ["billing:read"],
      }),

      // Billing Service - Patient Self-Service Invoices (port 3009)
      // Patients can view their own invoices and make payments
      // Authorization handled by service (ownership-based)
      ServiceRoute.create({
        serviceName: "billing-service",
        baseUrl:
          process.env.BILLING_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://billing-service:3009"
            : "http://localhost:3009"),
        pathPrefix: "/api/v1/billing/invoices/patient",
        requiresAuth: true,
        requiredRoles: ["patient"],
        // No requiredPermissions - authorization handled by downstream service
      }),

      // Notifications Service - Multi-channel Notifications (port 3011)
      // No permission check - let service handle authorization
      ServiceRoute.create({
        serviceName: "notifications-service",
        baseUrl:
          process.env.NOTIFICATIONS_SERVICE_URL ||
          (process.env.NODE_ENV === "production"
            ? "http://notifications-service:3011"
            : "http://localhost:3011"),
        pathPrefix: "/api/v1/notifications",
        requiresAuth: true,
      }),

      // Scheduler Service - DISABLED FOR MVP
      // Cron jobs moved to Notifications Service
      // Dedicated scheduler service not needed for MVP scope
    ];

    routes.forEach((route) => this.serviceRegistry.registerRoute(route));

    logger.info(`Registered ${routes.length} service routes`);
  }

  private setupMiddleware(): void {
    logger.info("Setting up middleware...");

    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
            scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
            imgSrc: ["'self'", "data:", "https:", "validator.swagger.io"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      }),
    );

    const allowedOrigins = (
      process.env.ALLOWED_ORIGINS || "http://localhost:3000"
    ).split(",");
    this.app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
      }),
    );

    this.app.use(compression());

    // Cookie parser for session authentication
    this.app.use(cookieParser());

    const defaultLimit = process.env.REQUEST_SIZE_LIMIT || "1mb";

    const rawBodySaver = (
      req: Request & { rawBody?: Buffer },
      _res: Response,
      buf: Buffer,
    ): void => {
      if (buf && buf.length) {
        req.rawBody = Buffer.from(buf);
      }
    };

    const proxiedPrefixes = this.serviceRegistry
      .getAllRoutes()
      .map((route) => route.pathPrefix);

    const resolveRequestPath = (req: IncomingMessage): string => {
      const url = req.url || "/";
      const pathEnd = url.indexOf("?");
      return pathEnd >= 0 ? url.substring(0, pathEnd) : url;
    };

    const isProxiedRequest = (req: IncomingMessage): boolean => {
      const path = resolveRequestPath(req);
      return proxiedPrefixes.some((prefix) => path.startsWith(prefix));
    };

    const shouldParseJson = (req: IncomingMessage): boolean => {
      const contentType = (req.headers["content-type"] || "")
        .toString()
        .toLowerCase();
      if (!contentType.includes("application/json")) {
        return false;
      }
      return !isProxiedRequest(req);
    };

    const shouldParseUrlencoded = (req: IncomingMessage): boolean => {
      const contentType = (req.headers["content-type"] || "")
        .toString()
        .toLowerCase();
      if (!contentType.includes("application/x-www-form-urlencoded")) {
        return false;
      }
      return !isProxiedRequest(req);
    };

    this.app.use(
      express.json({
        limit: defaultLimit,
        verify: rawBodySaver,
        type: shouldParseJson,
      }),
    );
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: defaultLimit,
        verify: rawBodySaver,
        type: shouldParseUrlencoded,
      }),
    );

    logger.info("Size limits configured", {
      defaultLimit: "10MB",
      note: "Using Express built-in body parser limits",
    });

    // Apply rate limiting (Redis-based if available, fallback to in-memory)
    // DISABLED FOR DEVELOPMENT
    // if (this.rateLimitMiddleware) {
    //   logger.info("Applying Redis-based distributed rate limiting");
    //   this.app.use("/api/", this.rateLimitMiddleware.globalLimiter());
    //   this.app.use("/api/", this.rateLimitMiddleware.perUserLimiter());

    //   // Apply strict rate limiting to sensitive endpoints
    //   this.app.use(
    //     "/api/v1/auth/login",
    //     this.rateLimitMiddleware.strictLimiter(),
    //   );
    //   this.app.use(
    //     "/api/v1/auth/register",
    //     this.rateLimitMiddleware.strictLimiter(),
    //   );
    // } else {
    //   logger.warn(
    //     "Using in-memory rate limiting (not recommended for production)",
    //   );
    //   const globalLimiter = rateLimit({
    //     windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
    //     max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000"),
    //     message: "Too many requests from this IP, please try again later",
    //     standardHeaders: true,
    //     legacyHeaders: false,
    //   });
    //   this.app.use("/api/", globalLimiter);
    // }
    logger.info("Rate limiting DISABLED for development");

    this.app.use(this.loggingMiddleware.logRequests());

    logger.info("Middleware setup complete");
  }

  private setupRoutes(): void {
    logger.info("Setting up routes...");

    // =========================================================================
    // NON-API ROUTES (Documentation, Health, Metrics)
    // =========================================================================

    // API Documentation (Swagger UI)
    this.app.use("/api-docs", createDocsRoutes());

    // Dashboard (Visual monitoring)
    this.app.use(
      "/dashboard",
      createDashboardRoutes(this.serviceRegistry, logger),
    );

    // Health check routes
    this.app.use("/health", createHealthRoutes(this.serviceRegistry, logger));
    this.app.use("/", createHealthRoutes(this.serviceRegistry, logger));

    // Metrics routes
    this.app.use("/metrics", createMetricsRoutes(this.serviceRegistry, logger));

    // =========================================================================
    // DEBUG ENDPOINT - Routing Table
    // =========================================================================
    this.app.get("/_debug/routes", (_req, res) => {
      const routingTable = this.serviceRegistry.getRoutingTable();
      res.json({
        success: true,
        totalRoutes: routingTable.length,
        routes: routingTable,
        timestamp: new Date().toISOString(),
      });
    });

    logger.info("Debug endpoint registered at /_debug/routes");

    // =========================================================================
    // GLOBAL PROXY MIDDLEWARE - CENTRALIZED ROUTING
    // =========================================================================
    // This replaces individual app.use(pathPrefix, proxy) calls
    // All /api/* requests are handled by GlobalProxyMiddleware which:
    // 1. Looks up matching route from ServiceRegistry
    // 2. Applies authentication if required
    // 3. Applies path rewrite rules
    // 4. Proxies to target service
    //
    // Benefits:
    // - Single source of truth for routing
    // - No prefix mounting conflicts
    // - Environment-agnostic (works for local & Docker)
    // - Easy to debug via /_debug/routes
    // =========================================================================

    logger.info("Mounting global proxy middleware for /api/* requests");

    // Apply authentication middleware first
    // Note: GlobalProxyMiddleware will check route.requiresAuth to determine
    // whether to enforce authentication, but we apply it globally for consistency
    this.app.use(
      "/api",
      this.authenticationMiddleware.optionalAuthenticate(),
      this.globalProxyMiddleware.handle(),
    );

    const routes = this.serviceRegistry.getAllRoutes();
    logger.info("Global proxy middleware configured", {
      totalRoutes: routes.length,
      routingStrategy: "centralized",
      routingTable: this.serviceRegistry.getRoutingTable().map((r) => ({
        priority: r.priority,
        pathPrefix: r.pathPrefix,
        serviceName: r.serviceName,
      })),
    });

    logger.info(
      "✅ Routes setup complete - Using centralized global proxy middleware",
    );
  }

  private setupErrorHandling(): void {
    this.app.use(this.errorHandlingMiddleware.handleNotFound());
    this.app.use(this.errorHandlingMiddleware.handleErrors());
  }

  public async start(): Promise<void> {
    try {
      this.app.listen(PORT, () => {
        logger.info(`🚀 API Gateway started successfully`, {
          port: PORT,
          environment: NODE_ENV,
          timestamp: new Date().toISOString(),
        });

        logger.info("📋 Registered routes:", {
          routes: this.serviceRegistry.getAllRoutes().map((r) => ({
            service: r.serviceName,
            path: r.pathPrefix,
            requiresAuth: r.requiresAuth,
          })),
        });
      });

      process.on("SIGTERM", () => this.shutdown());
      process.on("SIGINT", () => this.shutdown());
    } catch (error) {
      logger.error("Failed to start API Gateway", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info("Shutting down API Gateway...");

    // DISABLED FOR THESIS SCOPE - Rate limiting disabled
    // Disconnect Redis client
    // if (this.redisRateLimitClient) {
    //   try {
    //     await this.redisRateLimitClient.disconnect();
    //     logger.info("Redis rate limit client disconnected");
    //   } catch (error) {
    //     logger.error("Error disconnecting Redis rate limit client", {
    //       error: error instanceof Error ? error.message : "Unknown error",
    //     });
    //   }
    // }

    logger.info("API Gateway shutdown complete");
    process.exit(0);
  }
}

const application = new ApiGatewayApplication();

// Initialize and start application
(async () => {
  try {
    await application.initialize();
    await application.start();
  } catch (error) {
    logger.error("Failed to start API Gateway", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  }
})();
