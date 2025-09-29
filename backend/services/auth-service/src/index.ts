import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import { getMetricsHandler, metricsMiddleware } from "@hospital/shared";
import { sanitizeInput } from "@hospital/shared/dist/middleware/validation.middleware";
import {
  createVersioningMiddleware,
  responseTransformMiddleware,
} from "@hospital/shared/dist/middleware/versioning.middleware";
import logger from "@hospital/shared/dist/utils/logger";
import {
  ResponseHelper,
  addRequestId,
  globalErrorHandler,
} from "@hospital/shared/dist/utils/response-helpers";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { initializeSupabase, testSupabaseConnection } from "./config/supabase";
import { setupSwagger } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import patientRegistrationRoutes from "./routes/patient-registration.routes";
import sessionRoutes from "./routes/session.routes";
import userRoutes from "./routes/user.routes";
// Admin module routes
import adminDepartmentRoutes from "./modules/admin/routes/department.routes";
import adminOrchestrationRoutes from "./modules/admin/routes/orchestration.routes";

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = "Hospital Auth Service";
const SERVICE_VERSION = "1.0.0";

// Initialize ResponseHelper with service information
ResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-user-role",
    ],
  })
);

// Add request ID to all responses
app.use(addRequestId);

// Rate limiting temporarily disabled for development

// Logging
app.use(morgan("combined"));

// Metrics middleware
app.use(metricsMiddleware("auth-service"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Phase 2 Middleware - API Optimization
app.use(sanitizeInput); // Sanitize input data
app.use(createVersioningMiddleware()); // API versioning
app.use(responseTransformMiddleware()); // Response transformation based on version

// Setup Swagger documentation
setupSwagger(app);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const supabaseConnected = await testSupabaseConnection();
    const status = supabaseConnected ? "healthy" : "unhealthy";
    const statusCode = supabaseConnected ? 200 : 503;

    const healthCheck = ResponseHelper.healthCheck(
      status,
      {
        supabase: {
          status: supabaseConnected ? "healthy" : "unhealthy",
          responseTime: 50,
        },
      },
      {
        authentication: true,
        user_management: true,
        session_management: true,
        oauth_providers: true,
        password_reset: true,
        email_verification: true,
      }
    );

    res.status(statusCode).json(healthCheck);
  } catch (error: any) {
    logger.error("Health check error:", error);
    const errorHealthCheck = ResponseHelper.healthCheck("unhealthy", {
      supabase: {
        status: "unhealthy",
        error: error.message,
      },
    });
    res.status(503).json(errorHealthCheck);
  }
});

// Metrics endpoint for Prometheus
app.get("/metrics", getMetricsHandler);

// API Routes with error handling
try {
  app.use("/api/auth", authRoutes);
  app.use("/api/auth", patientRegistrationRoutes);
  // app.use("/api/auth", mfaRoutes); // Temporarily disabled - MFA routes not implemented
  app.use("/api/users", userRoutes);
  app.use("/api/sessions", sessionRoutes);

  // Admin module routes
  app.use("/api/admin/departments", adminDepartmentRoutes);
  app.use("/api/admin/orchestrate", adminOrchestrationRoutes);

  // Backward compatibility routes (proxy to admin routes)
  app.use("/api/departments", adminDepartmentRoutes);

  logger.info("✅ Routes loaded successfully");
} catch (error: any) {
  logger.error("❌ Failed to load routes:", {
    error: error.message,
    stack: error.stack,
  });
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Hospital Auth Service",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    description: "Authentication microservice using Supabase Auth",
    endpoints: {
      health: "/health",
      docs: "/docs",
      auth: "/api/auth",
      mfa: "/api/auth/mfa",
      users: "/api/users",
      sessions: "/api/sessions",
      admin_departments: "/api/admin/departments",
      admin_orchestration: "/api/admin/orchestrate",
      departments: "/api/departments", // Backward compatibility
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    service: SERVICE_NAME,
    availableRoutes: [
      "/api/auth",
      "/api/auth/mfa",
      "/api/users",
      "/api/sessions",
      "/health",
      "/docs",
    ],
  });
});

// Global error handling middleware with Vietnamese messages (must be last)
app.use(globalErrorHandler);

// Initialize and start server
const startServer = async () => {
  try {
    logger.info("🔄 Starting server initialization...");

    // Initialize Supabase connection
    await initializeSupabase();

    logger.info("🔄 Starting Express server...");

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 ${SERVICE_NAME} started successfully on port ${PORT}`, {
        service: SERVICE_NAME,
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        supabaseConnected: true,
      });
    });

    // Handle server errors
    server.on("error", (error: any) => {
      logger.error("❌ Server error:", {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      process.exit(1);
    });
  } catch (error: any) {
    logger.error("❌ Failed to start server:", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

export default app;
